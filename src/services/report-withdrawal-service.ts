import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import { FirebaseError } from 'firebase/app';

import { firebaseAuth, firestore } from '@/src/config/firebase';
import { withdrawalNoticeDescription } from '@/src/services/incident-service';

import type { ReportWithdrawalRequest } from '@/src/types/report-withdrawal';

const REQUESTS = 'reportWithdrawalRequests';
const NOTICE_VERSION = 2;
const MIN_REASON_LENGTH = 1;
const MAX_REASON_LENGTH = 300;

export class WithdrawalRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WithdrawalRequestError';
  }
}

function cleanReason(reason: string): string {
  return reason.replace(/\s+/g, ' ').trim();
}

function userReference(userId: string) {
  return doc(firestore, 'users', userId);
}

function convertRequestedAt(value: unknown): Timestamp | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value;
  }

  return undefined;
}

function convertWithdrawal(
  data: Record<string, unknown>,
  userId: string,
  reportId: string
): ReportWithdrawalRequest | null {
  if (
    data.requestedBy !== userId ||
    data.reportId !== reportId ||
    (data.status !== 'pending' && data.status !== 'removed') ||
    typeof data.reason !== 'string' ||
    data.reason.trim().length === 0
  ) {
    return null;
  }

  const requestedAt = convertRequestedAt(data.requestedAt);

  if (requestedAt === undefined) {
    return null;
  }

  return {
    reason: data.reason.trim(),
    status: data.status === 'removed' ? 'removed' : 'pending',
    requestedAt,
  };
}

function requestFromAccount(
  data: Record<string, unknown> | undefined,
  userId: string,
  reportId: string
): ReportWithdrawalRequest | null {
  const requests = data?.[REQUESTS];

  if (!requests || typeof requests !== 'object') {
    return null;
  }

  const raw = (requests as Record<string, unknown>)[reportId];

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return convertWithdrawal(raw as Record<string, unknown>, userId, reportId);
}

function savedRequests(
  data: Record<string, unknown> | undefined
): Record<string, unknown> {
  const requests = data?.[REQUESTS];

  if (!requests || typeof requests !== 'object') {
    return {};
  }

  return { ...(requests as Record<string, unknown>) };
}

/**
 * Marks the signed-in user's published report as removed and stores the reason.
 * Safety Map listeners only include active reports, so the report leaves every map.
 */
export async function createReportWithdrawalRequest(
  reportId: string,
  reason: string
): Promise<void> {
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser || currentUser.isAnonymous) {
    throw new WithdrawalRequestError(
      'Sign in with a registered account to request a withdrawal.'
    );
  }

  const cleanedReportId = reportId.trim();
  const cleanedReason = cleanReason(reason);

  if (!cleanedReportId) {
    throw new WithdrawalRequestError(
      'This report is not available for withdrawal.'
    );
  }

  if (cleanedReason.length < MIN_REASON_LENGTH) {
    throw new WithdrawalRequestError(
      'Enter a reason in your own words.'
    );
  }

  if (cleanedReason.length > MAX_REASON_LENGTH) {
    throw new WithdrawalRequestError(
      'Shorten the reason to 300 characters or less.'
    );
  }

  try {
    const incidentSnapshot = await getDoc(
      doc(firestore, 'incidents', cleanedReportId)
    );
    const incident = incidentSnapshot.data();

    if (!incidentSnapshot.exists() || incident?.creatorUid !== currentUser.uid) {
      throw new WithdrawalRequestError(
        'This report is not available for withdrawal.'
      );
    }

    if (
      incident.status !== 'active' &&
      incident.status !== 'under-review' &&
      incident.status !== 'removed'
    ) {
      throw new WithdrawalRequestError(
        'This report can no longer be withdrawn.'
      );
    }

    const accountReference = userReference(currentUser.uid);
    const accountSnapshot = await getDoc(accountReference);
    const savedWithdrawal = {
      reportId: cleanedReportId,
      requestedBy: currentUser.uid,
      reason: cleanedReason,
      status: 'removed' as const,
      requestedAt: serverTimestamp(),
    };
    const requests = {
      ...savedRequests(accountSnapshot.data()),
      [cleanedReportId]: savedWithdrawal,
    };

    await setDoc(
      accountReference,
      {
        [REQUESTS]: requests,
      },
      { merge: true }
    );

    let removedForEveryone = incident.status === 'removed';

    if (!removedForEveryone) {
      try {
        await updateDoc(doc(firestore, 'incidents', cleanedReportId), {
          status: 'removed',
        });
        removedForEveryone = true;
      } catch (updateError) {
        if (
          !(updateError instanceof FirebaseError) ||
          updateError.code !== 'permission-denied'
        ) {
          throw updateError;
        }
      }
    }

    if (!removedForEveryone) {
      await publishWithdrawalNotice(
        currentUser.uid,
        cleanedReportId,
        incident
      );
    }

    await setDoc(
      accountReference,
      {
        [REQUESTS]: {
          ...requests,
          [cleanedReportId]: {
            ...savedWithdrawal,
            mapHidden: true,
            mapNoticeVersion: NOTICE_VERSION,
          },
        },
      },
      { merge: true }
    );
  } catch (error) {
    if (error instanceof WithdrawalRequestError) {
      throw error;
    }

    throw new WithdrawalRequestError(
      'This report could not be removed. Check your connection and try again.'
    );
  }
}

async function publishWithdrawalNotice(
  userId: string,
  reportId: string,
  incident: Record<string, unknown>
): Promise<void> {
  await addDoc(collection(firestore, 'incidents'), {
    type: typeof incident.type === 'string' ? incident.type : 'other',
    description: withdrawalNoticeDescription(reportId),
    coordinates: incident.coordinates,
    anonymous: true,
    status: 'active',
    creatorUid: userId,
    createdAt: serverTimestamp(),
  });
}

const publishedNoticeIds = new Set<string>();

/** Publishes map removals that were saved before every user could see them. */
export async function ensureWithdrawalNotices(
  userId: string,
  reportIds: string[]
): Promise<void> {
  const pendingIds = reportIds.filter((reportId) => !publishedNoticeIds.has(reportId));

  if (pendingIds.length === 0) {
    return;
  }

  pendingIds.forEach((reportId) => publishedNoticeIds.add(reportId));

  try {
    const accountReference = userReference(userId);
    const accountSnapshot = await getDoc(accountReference);
    const requests = savedRequests(accountSnapshot.data());
    let changed = false;

    for (const reportId of pendingIds) {
      const current = requests[reportId];

      if (!current || typeof current !== 'object') {
        continue;
      }

      const record = current as {
        mapHidden?: unknown;
        mapNoticeVersion?: unknown;
      };

      if (record.mapHidden === true && record.mapNoticeVersion === NOTICE_VERSION) {
        continue;
      }

      const incidentSnapshot = await getDoc(doc(firestore, 'incidents', reportId));
      const incident = incidentSnapshot.data();

      if (incident && incident.status !== 'removed') {
        await publishWithdrawalNotice(userId, reportId, incident);
      }

      requests[reportId] = {
        ...record,
        mapHidden: true,
        mapNoticeVersion: NOTICE_VERSION,
      };
      changed = true;
    }

    if (changed) {
      await setDoc(
        accountReference,
        { [REQUESTS]: requests },
        { merge: true }
      );
    }
  } catch {
    pendingIds.forEach((reportId) => publishedNoticeIds.delete(reportId));
  }
}

function removedReportsFromAccount(
  data: Record<string, unknown> | undefined
): { reportId: string; reason: string }[] {
  const requests = data?.[REQUESTS];

  if (!requests || typeof requests !== 'object') {
    return [];
  }

  return Object.entries(requests as Record<string, unknown>).flatMap(
    ([reportId, value]) => {
      if (!value || typeof value !== 'object') {
        return [];
      }

      const record = value as { status?: unknown; reason?: unknown };

      if (record.status !== 'removed' || typeof record.reason !== 'string') {
        return [];
      }

      const reason = record.reason.trim();

      if (!reason) {
        return [];
      }

      return [{ reportId, reason }];
    }
  );
}

/** Report ids this user has withdrawn. Used so their own map hides the report immediately. */
export function subscribeToRemovedReportIds(
  userId: string,
  onChanged: (reportIds: string[]) => void
): Unsubscribe {
  return subscribeToRemovedReports(userId, (reports) => {
    onChanged(reports.map((report) => report.reportId));
  });
}

/** Withdrawal reasons saved for reports this user has removed. */
export function subscribeToRemovedReports(
  userId: string,
  onChanged: (reports: { reportId: string; reason: string }[]) => void
): Unsubscribe {
  return onSnapshot(
    userReference(userId),
    (snapshot) => {
      onChanged(removedReportsFromAccount(snapshot.data()));
    },
    () => {
      onChanged([]);
    }
  );
}

/** Listens for this user's withdrawal record for one report. */
export function subscribeToReportWithdrawal(
  userId: string,
  reportId: string,
  onRequestChanged: (request: ReportWithdrawalRequest | null) => void,
  onError: (error: WithdrawalRequestError) => void
): Unsubscribe {
  return onSnapshot(
    userReference(userId),
    (snapshot) => {
      onRequestChanged(
        requestFromAccount(snapshot.data(), userId, reportId)
      );
    },
    () => {
      onError(
        new WithdrawalRequestError(
          'Withdrawal status could not be checked. Check your connection and try again.'
        )
      );
    }
  );
}

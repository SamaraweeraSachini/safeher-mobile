import type { Timestamp } from 'firebase/firestore';

/** A withdrawal request shown to the person who submitted it. */
export type ReportWithdrawalRequest = {
  reason: string;
  status: 'pending' | 'removed';
  requestedAt: Timestamp | null;
};

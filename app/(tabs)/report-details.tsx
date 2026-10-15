import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getIncidentCategoryLabel } from '@/constants/incident-categories';
import { useAuth } from '@/src/context/AuthContext';
import { usePrivacyPreferences } from '@/src/context/PrivacyPreferencesContext';
import { useMyReports } from '@/src/hooks/useMyReports';
import { useReportWithdrawal } from '@/src/hooks/useReportWithdrawal';
import {
  createReportWithdrawalRequest,
  WithdrawalRequestError,
} from '@/src/services/report-withdrawal-service';
import { placeLabel } from '@/src/services/reviewed-route-service';

import type { Incident, IncidentStatus } from '@/src/types/incident';

function formatReportedAt(incident: Incident): string {
  const createdAt = incident.createdAt?.toDate();

  if (!createdAt) {
    return 'Date unavailable';
  }

  return createdAt.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fullDescription(description: string): string {
  const compact = description.replace(/\s+/g, ' ').trim();

  return compact || 'No description was added.';
}

function statusExplanation(status: IncidentStatus): string {
  switch (status) {
    case 'under-review':
      return 'This report is under review. It is not shown as an active map report while it is being checked.';
    case 'resolved':
      return 'This report is resolved. It is no longer shown as an active incident on the map.';
    case 'removed':
      return 'It no longer appears on the Safety Map. My Reports still lists it.';
    case 'active':
      return 'This report is active. Other people can see the incident on the map, without your name.';
  }
}

function statusLabel(status: IncidentStatus): string {
  switch (status) {
    case 'under-review':
      return 'Under Review';
    case 'resolved':
      return 'Resolved';
    case 'removed':
      return 'Removed';
    case 'active':
      return 'Active';
  }
}

function canRequestWithdrawal(status: IncidentStatus): boolean {
  return status === 'active' || status === 'under-review';
}

export default function ReportDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reportId?: string | string[] }>();
  const reportId = Array.isArray(params.reportId)
    ? params.reportId[0] ?? ''
    : params.reportId ?? '';
  const { user, isRegisteredUser } = useAuth();
  const { preferences } = usePrivacyPreferences();
  const canLoadReports =
    isRegisteredUser && preferences.showReportHistory && Boolean(user?.uid);
  const { reports, isLoading, error, retry } = useMyReports(
    user?.uid ?? null,
    canLoadReports
  );
  const storedReport = reports.find((item) => item.id === reportId) ?? null;
  const withdrawalEnabled = canLoadReports && storedReport !== null;
  const { request: withdrawal, isLoading: withdrawalLoading } = useReportWithdrawal(
    user?.uid ?? null,
    storedReport?.id ?? null,
    withdrawalEnabled
  );
  const report =
    storedReport && withdrawal?.status === 'removed'
      ? { ...storedReport, status: 'removed' as const }
      : storedReport;
  const [placeName, setPlaceName] = useState('Finding the place…');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setReason('');
    setSubmitError(null);
    setSubmitSuccess(null);
  }, [reportId]);

  const showWithdrawalField = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 250);
  };

  useEffect(() => {
    if (!report) {
      return;
    }

    let cancelled = false;

    placeLabel(report.coordinates, 'Place name unavailable').then((label) => {
      if (!cancelled) {
        setPlaceName(label);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [report]);

  const sendWithdrawal = async () => {
    if (!report || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await createReportWithdrawalRequest(report.id, reason);
      setReason('');
      setSubmitSuccess(
        'This report is now Removed. It no longer appears on the Safety Map.'
      );
    } catch (submissionError) {
      setSubmitError(
        submissionError instanceof WithdrawalRequestError
          ? submissionError.message
          : 'The withdrawal request could not be sent. Check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmWithdrawal = () => {
    const cleaned = reason.replace(/\s+/g, ' ').trim();

    if (cleaned.length < 1) {
      setSubmitSuccess(null);
      setSubmitError('Enter a reason in your own words.');
      return;
    }

    Alert.alert(
      'Withdraw this report?',
      'This marks the report as Removed. It will disappear from the Safety Map for everyone. My Reports will still show it as Removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw report',
          style: 'destructive',
          onPress: () => {
            void sendWithdrawal();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#5A3D4D" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.title}>Report details</Text>

          {!isRegisteredUser ? (
            <StateCard
              icon="person-outline"
              title="Registered account needed"
              message="Sign in with a registered account to view a report you submitted."
            />
          ) : !preferences.showReportHistory ? (
            <StateCard
              icon="eye-off-outline"
              title="Report history is hidden"
              message="Turn on Report history in Privacy Settings to see this report."
            />
          ) : !reportId ? (
            <StateCard
              icon="document-text-outline"
              title="Report unavailable"
              message="Open a report from My Reports to see its details."
            />
          ) : isLoading ? (
            <StateCard
              icon="time-outline"
              title="Loading report"
              message="Checking this incident report."
              loading
            />
          ) : error ? (
            <StateCard
              icon="cloud-offline-outline"
              title="Report unavailable"
              message={error}
              onRetry={retry}
            />
          ) : !report ? (
            <StateCard
              icon="document-text-outline"
              title="Report unavailable"
              message="This report is not in the list of reports you submitted."
            />
          ) : (
            <>
              <View style={styles.card}>
                <Detail
                  first
                  label="Incident type"
                  value={getIncidentCategoryLabel(report.type)}
                />
                <Detail
                  label="Full description"
                  value={fullDescription(report.description)}
                />
                <Detail
                  label="Reported date/time"
                  value={formatReportedAt(report)}
                />
                <Detail label="Location" value={placeName} />
                <Detail
                  label="Anonymous status"
                  value={
                    report.anonymous
                      ? 'Anonymous. Your name is not shown with this report.'
                      : 'Not anonymous. Your name is still not shown on the public report.'
                  }
                />
                <Detail
                  label="Current status"
                  value={`${statusLabel(report.status)}. ${statusExplanation(report.status)}`}
                />
              </View>

              <View style={styles.reminder}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#7A1F3D" />
                <View style={styles.reminderText}>
                  <Text style={styles.reminderTitle}>Reporting guidelines</Text>
                  <Text style={styles.reminderBody}>
                    Share only what is needed to describe the safety concern. Do not
                    include names, phone numbers, or other private details.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/reporting-guidelines' as Href)}
                    accessibilityRole="button"
                    accessibilityLabel="Read reporting guidelines"
                  >
                    <Text style={styles.reminderLink}>Read reporting guidelines</Text>
                  </Pressable>
                </View>
              </View>

              <WithdrawalSection
                status={report.status}
                withdrawal={withdrawal}
                withdrawalLoading={withdrawalLoading}
                reason={reason}
                onChangeReason={(value) => {
                  setReason(value);
                  setSubmitError(null);
                }}
                isSubmitting={isSubmitting}
                submitError={submitError}
                submitSuccess={submitSuccess}
                onReasonFocus={showWithdrawalField}
                onSubmit={confirmWithdrawal}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function WithdrawalSection({
  status,
  withdrawal,
  withdrawalLoading,
  reason,
  onChangeReason,
  isSubmitting,
  submitError,
  submitSuccess,
  onReasonFocus,
  onSubmit,
}: {
  status: IncidentStatus;
  withdrawal: { reason: string; requestedAt: { toDate: () => Date } | null } | null;
  withdrawalLoading: boolean;
  reason: string;
  onChangeReason: (value: string) => void;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  onReasonFocus: () => void;
  onSubmit: () => void;
}) {
  const writtenReason = reason.replace(/\s+/g, ' ').trim();
  const reasonHint =
    writtenReason.length === 0
      ? 'Use your own words. One word is enough.'
      : 'This reason will be saved when the report is removed.';
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>
        {status === 'removed' ? 'Report removed' : 'Withdraw this report'}
      </Text>

      {submitSuccess ? <Text style={styles.success}>{submitSuccess}</Text> : null}

      {withdrawalLoading ? (
        <ActivityIndicator color="#C43D74" style={styles.sectionSpacing} />
      ) : !canRequestWithdrawal(status) ? (
        <>
          {status === 'removed' ? null : (
            <Text style={styles.body}>
              This report is already resolved, so it can no longer be withdrawn.
            </Text>
          )}
          {withdrawal ? <Detail label="Reason" value={withdrawal.reason} /> : null}
        </>
      ) : (
        <>
          <Text style={styles.body}>
            Withdrawing marks this report as Removed. It disappears from the Safety Map for everyone. My Reports still shows it as Removed.
          </Text>
          <Text style={styles.fieldLabel}>Your reason</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={onChangeReason}
            onFocus={onReasonFocus}
            placeholder="Write your reason"
            placeholderTextColor="#9A8790"
            multiline
            maxLength={300}
            textAlignVertical="top"
            accessibilityLabel="Withdrawal reason"
          />
          <Text style={styles.helper}>{reasonHint}</Text>
          {writtenReason.length > 0 ? (
            <View style={styles.reasonPreview}>
              <Text style={styles.reasonPreviewLabel}>Your reason</Text>
              <Text style={styles.reasonPreviewText}>{writtenReason}</Text>
            </View>
          ) : null}
          {submitError ? <Text style={styles.failure}>{submitError}</Text> : null}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isSubmitting) && styles.pressed,
            ]}
            onPress={onSubmit}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Withdraw report"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Withdraw report</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

function Detail({
  label,
  value,
  first = false,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  return (
    <View style={[styles.detail, first && styles.detailFirst]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function StateCard({
  icon,
  title,
  message,
  loading = false,
  onRetry,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.stateCard}>
      {loading ? (
        <ActivityIndicator color="#C43D74" />
      ) : (
        <Ionicons name={icon} size={32} color="#A92F61" />
      )}
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {onRetry ? (
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try loading the report again"
        >
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8FB' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  backButton: {
    minHeight: 54,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: { color: '#5A3D4D', fontSize: 15, fontWeight: '700' },
  title: { marginTop: 8, marginBottom: 18, color: '#392631', fontSize: 27, fontWeight: '800' },
  card: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  detail: { marginTop: 14 },
  detailFirst: { marginTop: 0 },
  detailLabel: { color: '#9A8790', fontSize: 12, fontWeight: '800' },
  detailValue: { marginTop: 4, color: '#392631', fontSize: 15, lineHeight: 22 },
  reminder: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FCE8EE',
  },
  reminderText: { flex: 1 },
  reminderTitle: { color: '#7A1F3D', fontSize: 15, fontWeight: '800' },
  reminderBody: { marginTop: 4, color: '#5A3D4D', fontSize: 14, lineHeight: 21 },
  reminderLink: { marginTop: 8, color: '#C43D74', fontSize: 14, fontWeight: '800' },
  sectionTitle: { color: '#392631', fontSize: 18, fontWeight: '800' },
  sectionSpacing: { marginTop: 14 },
  body: { marginTop: 8, color: '#755F6A', fontSize: 14, lineHeight: 21 },
  fieldLabel: {
    marginTop: 16,
    color: '#392631',
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    minHeight: 120,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1.5,
    borderColor: '#C43D74',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    color: '#291820',
    fontSize: 16,
    lineHeight: 24,
  },
  helper: {
    marginTop: 8,
    color: '#755F6A',
    fontSize: 13,
    lineHeight: 19,
  },
  reasonPreview: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FCE8EE',
  },
  reasonPreviewLabel: {
    color: '#7A1F3D',
    fontSize: 12,
    fontWeight: '800',
  },
  reasonPreviewText: {
    marginTop: 4,
    color: '#291820',
    fontSize: 16,
    lineHeight: 24,
  },
  success: {
    marginTop: 10,
    color: '#35735A',
    fontSize: 14,
    lineHeight: 21,
  },
  failure: {
    marginTop: 10,
    color: '#8B3030',
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#C43D74',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  stateCard: {
    alignItems: 'center',
    gap: 10,
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  stateTitle: { color: '#392631', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateMessage: { color: '#755F6A', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});

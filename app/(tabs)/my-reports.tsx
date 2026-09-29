import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getIncidentCategoryLabel } from '@/constants/incident-categories';
import { useAuth } from '@/src/context/AuthContext';
import { usePrivacyPreferences } from '@/src/context/PrivacyPreferencesContext';
import { useMyReports } from '@/src/hooks/useMyReports';
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

function readableDescription(description: string): string {
  const compact = description.replace(/\s+/g, ' ').trim();

  return compact || 'No description was added.';
}

function shortDescription(description: string): string {
  const readable = readableDescription(description);

  if (readable.length <= 90) {
    return readable;
  }

  return `${readable.slice(0, 87)}...`;
}

function statusExplanation(status: IncidentStatus): string {
  switch (status) {
    case 'under-review':
      return 'This report is under review. It is not shown as an active map report while it is being checked.';
    case 'resolved':
      return 'This report is resolved. It is no longer shown as an active incident on the map.';
    case 'removed':
      return 'This report was removed. Other people cannot see it on the map.';
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

function statusColors(status: IncidentStatus): {
  color: string;
  backgroundColor: string;
} {
  switch (status) {
    case 'under-review':
      return { color: '#2E6DA4', backgroundColor: '#E7F1FA' };
    case 'resolved':
      return { color: '#35735A', backgroundColor: '#E5F4ED' };
    case 'removed':
      return { color: '#8B5555', backgroundColor: '#F6E7E7' };
    case 'active':
      return { color: '#A66518', backgroundColor: '#FFF3D6' };
  }
}

export default function MyReportsScreen() {
  const router = useRouter();
  const { user, isRegisteredUser } = useAuth();
  const { preferences } = usePrivacyPreferences();
  const canLoadReports =
    isRegisteredUser && preferences.showReportHistory && Boolean(user?.uid);
  const { reports, isLoading, error, retry } = useMyReports(
    user?.uid ?? null,
    canLoadReports
  );
  const [selectedReport, setSelectedReport] = useState<Incident | null>(null);
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    reports.forEach((report) => {
      placeLabel(report.coordinates, 'Place name unavailable').then((label) => {
        if (!cancelled) {
          setPlaceNames((current) =>
            current[report.id] === label ? current : { ...current, [report.id]: label }
          );
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [reports]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
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

        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.introduction}>
          Reports you submitted, with their current status.
        </Text>

        {!isRegisteredUser ? (
          <StateCard
            icon="person-outline"
            title="Registered account needed"
            message="Sign in with a registered account to view the incident reports you submitted."
          />
        ) : !preferences.showReportHistory ? (
          <StateCard
            icon="eye-off-outline"
            title="Report history is hidden"
            message="Turn on Report history in Privacy Settings to see the reports you submitted."
          />
        ) : isLoading ? (
          <StateCard
            icon="time-outline"
            title="Loading your reports"
            message="Checking the incident reports linked to your account."
            loading
          />
        ) : error ? (
          <StateCard
            icon="cloud-offline-outline"
            title="Reports unavailable"
            message={error}
            onRetry={retry}
          />
        ) : reports.length === 0 ? (
          <StateCard
            icon="document-text-outline"
            title="No reports yet"
            message="You have not submitted any incident reports."
          />
        ) : (
          reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              placeName={placeNames[report.id] ?? 'Finding the place…'}
              onViewDetails={() => setSelectedReport(report)}
            />
          ))
        )}
      </ScrollView>

      <ReportDetailsModal
        report={selectedReport}
        placeName={
          selectedReport
            ? placeNames[selectedReport.id] ?? 'Finding the place…'
            : ''
        }
        onClose={() => setSelectedReport(null)}
      />
    </SafeAreaView>
  );
}

function ReportCard({
  report,
  placeName,
  onViewDetails,
}: {
  report: Incident;
  placeName: string;
  onViewDetails: () => void;
}) {
  const colors = statusColors(report.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.incidentType}>
          {getIncidentCategoryLabel(report.type)}
        </Text>
        <Text style={[styles.status, { color: colors.color, backgroundColor: colors.backgroundColor }]}>
          {statusLabel(report.status)}
        </Text>
      </View>
      <Text style={styles.description}>{shortDescription(report.description)}</Text>
      <Text style={styles.meta}>{formatReportedAt(report)}</Text>
      <Text style={styles.meta}>
        {report.anonymous ? 'Anonymous' : 'Not anonymous'}
      </Text>
      <Text style={styles.meta}>{placeName}</Text>
      <Pressable
        style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
        onPress={onViewDetails}
        accessibilityRole="button"
        accessibilityLabel="View details"
      >
        <Text style={styles.detailsButtonText}>View Details</Text>
      </Pressable>
    </View>
  );
}

function ReportDetailsModal({
  report,
  placeName,
  onClose,
}: {
  report: Incident | null;
  placeName: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={report !== null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {report ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {getIncidentCategoryLabel(report.type)}
              </Text>
              <Text style={styles.modalSummary}>
                {report.anonymous
                  ? 'You submitted this anonymously. Other people do not see your name.'
                  : 'You did not submit this anonymously. Other people still do not see your name on the report.'}
              </Text>
              <Detail label="What you reported" value={readableDescription(report.description)} />
              <Detail label="Where" value={placeName} />
              <Detail
                label="Report status"
                value={`${statusLabel(report.status)}. ${statusExplanation(report.status)}`}
              />
              <Detail label="When you reported it" value={formatReportedAt(report)} />
              <Pressable
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close report details"
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
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
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try loading reports again"
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8FB' },
  content: { paddingHorizontal: 20, paddingBottom: 36 },
  backButton: {
    minHeight: 54,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: { color: '#5A3D4D', fontSize: 15, fontWeight: '700' },
  title: { marginTop: 8, color: '#392631', fontSize: 27, fontWeight: '800' },
  introduction: {
    marginTop: 8,
    marginBottom: 18,
    color: '#755F6A',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  incidentType: { flex: 1, color: '#392631', fontSize: 16, fontWeight: '800' },
  status: {
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
  },
  description: { marginTop: 10, color: '#392631', fontSize: 14, lineHeight: 20 },
  meta: { marginTop: 6, color: '#755F6A', fontSize: 13, lineHeight: 18 },
  detailsButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#C43D74',
  },
  detailsButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  stateCard: {
    alignItems: 'center',
    gap: 10,
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  stateTitle: { color: '#392631', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateMessage: { color: '#755F6A', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#C43D74',
  },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(57, 38, 49, 0.45)',
  },
  modalCard: {
    maxHeight: '80%',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFF8FB',
  },
  modalTitle: { color: '#392631', fontSize: 22, fontWeight: '800' },
  modalSummary: {
    marginTop: 8,
    color: '#755F6A',
    fontSize: 14,
    lineHeight: 21,
  },
  detail: { marginTop: 14 },
  detailLabel: { color: '#9A8790', fontSize: 12, fontWeight: '800' },
  detailValue: { marginTop: 4, color: '#392631', fontSize: 15, lineHeight: 22 },
  closeButton: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#C43D74',
  },
  closeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});

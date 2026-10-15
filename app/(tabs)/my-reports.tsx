import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { subscribeToRemovedReports } from '@/src/services/report-withdrawal-service';
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
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({});
  const [removedReports, setRemovedReports] = useState<
    { reportId: string; reason: string }[]
  >([]);

  useEffect(() => {
    if (!canLoadReports || !user?.uid) {
      setRemovedReports([]);
      return;
    }

    return subscribeToRemovedReports(user.uid, setRemovedReports);
  }, [canLoadReports, user?.uid]);

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
          reports.map((report) => {
            const withdrawal = removedReports.find(
              (item) => item.reportId === report.id
            );

            return (
              <ReportCard
                key={report.id}
                report={withdrawal ? { ...report, status: 'removed' } : report}
                placeName={placeNames[report.id] ?? 'Finding the place…'}
                withdrawalReason={withdrawal?.reason ?? null}
                onViewDetails={() =>
                  router.push(
                    `/report-details?reportId=${encodeURIComponent(report.id)}` as Href
                  )
                }
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReportCard({
  report,
  placeName,
  withdrawalReason,
  onViewDetails,
}: {
  report: Incident;
  placeName: string;
  withdrawalReason: string | null;
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
      {report.status === 'removed' && withdrawalReason ? (
        <Text style={styles.meta}>Withdrawal reason: {withdrawalReason}</Text>
      ) : null}
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
  pressed: { opacity: 0.75 },
});

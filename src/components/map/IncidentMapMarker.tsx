import { Ionicons } from '@expo/vector-icons';

import {
  memo,
} from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Marker,
} from 'react-native-maps';

import {
  getIncidentCategory,
  getIncidentCategoryLabel,
} from '@/constants/incident-categories';

import type {
  Incident,
} from '@/src/types/incident';

type IncidentMapMarkerProps = {
  incident: Incident;
  onPress: (incident: Incident) => void;
};

const RECENT_MS = 24 * 60 * 60 * 1000;

function isRecent(incident: Incident): boolean {
  const milliseconds = incident.createdAt?.toMillis();

  return Boolean(
    milliseconds && Date.now() - milliseconds <= RECENT_MS
  );
}

function IncidentMapMarker({
  incident,
  onPress,
}: IncidentMapMarkerProps) {
  const { latitude, longitude } = incident.coordinates;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const category = getIncidentCategory(incident.type);
  const markerColor = category?.color ?? '#C43D74';
  const recent = isRecent(incident);

  return (
    <Marker
      identifier={`incident-${incident.id}`}
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges
      onPress={() => onPress(incident)}
      accessibilityLabel={`${getIncidentCategoryLabel(
        incident.type
      )} incident marker${recent ? ', recent' : ''}`}
    >
      <View
        style={[
          styles.markerOuter,
          {
            borderColor: markerColor,
            backgroundColor:
              category?.backgroundColor ?? '#FBEAF1',
          },
          recent && styles.recentOuter,
        ]}
      >
        {recent ? (
          <View style={styles.recentBadge}>
            <Text style={styles.recentText}>NEW</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.markerInner,
            { backgroundColor: markerColor },
          ]}
        >
          <Ionicons
            name={category?.icon ?? 'alert-circle-outline'}
            size={18}
            color="#FFFFFF"
          />
        </View>
      </View>
    </Marker>
  );
}

export default memo(IncidentMapMarker);

const styles = StyleSheet.create({
  markerOuter: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: 23,
    elevation: 6,
    shadowColor: '#3D2732',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
  },

  recentOuter: {
    borderWidth: 4,
  },

  markerInner: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },

  recentBadge: {
    position: 'absolute',
    top: -14,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#B42318',
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  recentText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
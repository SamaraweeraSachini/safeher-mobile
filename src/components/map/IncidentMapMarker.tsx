import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import { Marker } from 'react-native-maps';

import {
    getIncidentCategory,
    getIncidentCategoryLabel,
} from '@/constants/incident-categories';

import type { Incident } from '@/src/types/incident';

type IncidentMapMarkerProps = {
  incident: Incident;
  onPress: (incident: Incident) => void;
};

function coordinatesAreValid(
  latitude: number,
  longitude: number
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function IncidentMapMarker({
  incident,
  onPress,
}: IncidentMapMarkerProps) {
  const {
    latitude,
    longitude,
  } = incident.coordinates;

  if (
    !coordinatesAreValid(
      latitude,
      longitude
    )
  ) {
    console.warn(
      `Incident marker ${incident.id} was ignored because its coordinates are invalid.`
    );

    return null;
  }

  const category =
    getIncidentCategory(
      incident.type
    );

  const markerColor =
    category?.color ?? '#C43D74';

  const markerBackground =
    category?.backgroundColor ??
    '#FBEAF1';

  const markerIcon =
    category?.icon ??
    'alert-circle-outline';

  const categoryLabel =
    getIncidentCategoryLabel(
      incident.type
    );

  return (
    <Marker
      identifier={`incident-${incident.id}`}
      coordinate={{
        latitude,
        longitude,
      }}
      anchor={{
        x: 0.5,
        y: 0.5,
      }}
      tracksViewChanges
      onPress={() => onPress(incident)}
      accessibilityLabel={`${categoryLabel} incident marker`}
      accessibilityHint="Opens safe public information about this incident"
    >
      <View
        style={[
          styles.markerOuter,
          {
            borderColor: markerColor,
            backgroundColor:
              markerBackground,
          },
        ]}
      >
        <View
          style={[
            styles.markerInner,
            {
              backgroundColor:
                markerColor,
            },
          ]}
        >
          <Ionicons
            name={markerIcon}
            size={19}
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: 22,
    elevation: 6,
    shadowColor: '#3D2732',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  markerInner: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
});
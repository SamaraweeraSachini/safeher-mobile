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
    Callout,
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
      title={categoryLabel}
      description={
        incident.description ||
        'No description provided.'
      }
      anchor={{
        x: 0.5,
        y: 0.5,
      }}
      tracksViewChanges={false}
      accessibilityLabel={`${categoryLabel} incident marker`}
      accessibilityHint="Opens information about this incident"
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

      <Callout tooltip={false}>
        <View style={styles.callout}>
          <View style={styles.calloutHeader}>
            <View
              style={[
                styles.calloutIcon,
                {
                  backgroundColor:
                    markerBackground,
                },
              ]}
            >
              <Ionicons
                name={markerIcon}
                size={18}
                color={markerColor}
              />
            </View>

            <View style={styles.calloutTitleArea}>
              <Text
                style={styles.calloutTitle}
                numberOfLines={1}
              >
                {categoryLabel}
              </Text>

              <Text style={styles.activeText}>
                Active incident
              </Text>
            </View>
          </View>

          <Text
            style={styles.calloutDescription}
            numberOfLines={3}
          >
            {incident.description ||
              'No description provided.'}
          </Text>

          <Text style={styles.calloutLocation}>
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </Text>
        </View>
      </Callout>
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

  callout: {
    width: 240,
    paddingVertical: 7,
    paddingHorizontal: 4,
  },

  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  calloutIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  calloutTitleArea: {
    flex: 1,
    marginLeft: 10,
  },

  calloutTitle: {
    color: '#32252B',
    fontSize: 15,
    fontWeight: '800',
  },

  activeText: {
    marginTop: 2,
    color: '#A66518',
    fontSize: 11,
    fontWeight: '700',
  },

  calloutDescription: {
    marginTop: 10,
    color: '#5D4B53',
    fontSize: 13,
    lineHeight: 18,
  },

  calloutLocation: {
    marginTop: 8,
    color: '#927E87',
    fontSize: 10,
  },
});
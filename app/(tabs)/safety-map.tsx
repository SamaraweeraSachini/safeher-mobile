import {
  StyleSheet,
  View,
} from 'react-native';

import MapErrorBoundary from '@/src/components/map/MapErrorBoundary';
import SafetyMap from '@/src/components/map/SafetyMap';

export default function SafetyMapScreen() {
  return (
    <View style={styles.container}>
      <MapErrorBoundary>
        <SafetyMap />
      </MapErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Temporary placeholder so "Start Route" has somewhere valid to go.
 * Replace with the real basic route-guidance screen when that ticket lands.
 */
export default function ActiveRouteScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color="#5A3D4D" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.heading}>You are on your way</Text>
        <Text style={styles.body}>
          Stay aware of your surroundings. Contact emergency services if you
          need help now.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8FB' },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, marginLeft: 18, marginTop: 4, paddingHorizontal: 10, borderRadius: 12 },
  backText: { color: '#5A3D4D', fontSize: 15, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heading: { color: '#32252B', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  body: { color: '#5D4B53', fontSize: 14, textAlign: 'center' },
});
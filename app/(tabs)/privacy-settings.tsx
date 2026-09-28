import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePrivacyPreferences } from '@/src/context/PrivacyPreferencesContext';
import type { PrivacyPreferences } from '@/src/services/privacy-preferences';

type SettingKey = keyof PrivacyPreferences;

type SettingRow = {
  key: SettingKey;
  title: string;
  description: string;
};

const SETTINGS: SettingRow[] = [
  {
    key: 'anonymousReportingByDefault',
    title: 'Anonymous reporting',
    description:
      'New incident reports start as anonymous. You can still change this on the report form before you submit.',
  },
  {
    key: 'allowLocationUse',
    title: 'Use location',
    description:
      'Allow SafeHer to use your location for the map, reports, and routes while the app is open.',
  },
  {
    key: 'showReportHistory',
    title: 'Report history',
    description:
      'Show recent incident reports. When this is off, the report history is hidden.',
  },
  {
    key: 'shareJourneys',
    title: 'Journey sharing',
    description:
      'Show the trusted contacts a journey is shared with. When this is off, those names stay hidden.',
  },
  {
    key: 'safetyAlerts',
    title: 'Safety alerts',
    description:
      'Show journey check-in reminders. When this is off, the next check-in time is hidden.',
  },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreference, clearSavedPreferences } =
    usePrivacyPreferences();
  const [clearMessage, setClearMessage] = useState<string | null>(null);

  const changeSetting = (key: SettingKey, value: boolean) => {
    setClearMessage(null);
    void updatePreference(key, value);
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear saved preferences?',
      'This removes the privacy choices stored on this phone and returns them to the original settings.',
      [
        { text: 'Keep settings', style: 'cancel' },
        {
          text: 'Clear preferences',
          style: 'destructive',
          onPress: () => {
            void clearSavedPreferences().then(() => {
              setClearMessage(
                'Saved privacy preferences were cleared on this phone.'
              );
            });
          },
        },
      ]
    );
  };

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
          accessibilityLabel="Return to Profile"
        >
          <Ionicons name="arrow-back" size={24} color="#5A3D4D" />
          <Text style={styles.backText}>Profile</Text>
        </Pressable>

        <Text style={styles.title}>Privacy Settings</Text>
        <Text style={styles.introduction}>
          These choices change how SafeHer uses your information on this phone.
        </Text>

        {SETTINGS.map((setting) => (
          <View key={setting.key} style={styles.settingCard}>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{setting.title}</Text>
              <Text style={styles.settingDescription}>{setting.description}</Text>
            </View>
            <Switch
              value={preferences[setting.key]}
              onValueChange={(value) => changeSetting(setting.key, value)}
              trackColor={{ false: '#E9D7DD', true: '#E8A6B9' }}
              thumbColor={preferences[setting.key] ? '#7A1F3D' : '#FFFFFF'}
              accessibilityLabel={setting.title}
            />
          </View>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.pressed,
          ]}
          onPress={confirmClear}
          accessibilityRole="button"
          accessibilityLabel="Clear saved preferences"
        >
          <Ionicons name="trash-outline" size={20} color="#A92F61" />
          <View style={styles.clearText}>
            <Text style={styles.clearTitle}>Clear saved preferences</Text>
            <Text style={styles.clearDescription}>
              Removes the privacy choices stored on this phone.
            </Text>
          </View>
        </Pressable>

        {clearMessage ? (
          <Text style={styles.clearMessage}>{clearMessage}</Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.infoButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/privacy-safety' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Privacy information"
        >
          <Ionicons name="information-circle-outline" size={22} color="#A92F61" />
          <View style={styles.clearText}>
            <Text style={styles.clearTitle}>Privacy information</Text>
            <Text style={styles.clearDescription}>
              Read how SafeHer handles personal information.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9A8790" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
  title: {
    marginTop: 8,
    color: '#392631',
    fontSize: 27,
    fontWeight: '800',
  },
  introduction: {
    marginTop: 8,
    marginBottom: 18,
    color: '#755F6A',
    fontSize: 15,
    lineHeight: 22,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  settingText: { flex: 1 },
  settingTitle: { color: '#392631', fontSize: 15, fontWeight: '800' },
  settingDescription: {
    marginTop: 4,
    color: '#755F6A',
    fontSize: 13,
    lineHeight: 19,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FDECEC',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  clearText: { flex: 1 },
  clearTitle: { color: '#392631', fontSize: 15, fontWeight: '800' },
  clearDescription: {
    marginTop: 4,
    color: '#755F6A',
    fontSize: 13,
    lineHeight: 19,
  },
  clearMessage: {
    marginTop: 12,
    color: '#35735A',
    fontSize: 14,
    lineHeight: 20,
  },
  pressed: { opacity: 0.75 },
});

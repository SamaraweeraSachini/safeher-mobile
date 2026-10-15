import { Ionicons } from '@expo/vector-icons';

import {
  type Href,
  useRouter,
} from 'expo-router';

import {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Brand,
} from '@/constants/brand';

import ScreenBackButton from '@/src/components/navigation/ScreenBackButton';

import {
  usePrivacyPreferences,
  type PrivacyPreferences,
} from '@/src/context/PrivacyPreferencesContext';

type SettingKey = keyof PrivacyPreferences;

type SettingItem = {
  key: SettingKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SETTINGS: SettingItem[] = [
  {
    key: 'anonymousReportingByDefault',
    title: 'Anonymous reporting by default',
    description:
      'New incident reports start with anonymous reporting enabled. You can still change it on the report form.',
    icon: 'eye-off-outline',
  },
  {
    key: 'allowLocationUse',
    title: 'Allow location use',
    description:
      'Allows SafeHer features such as incident reporting, Safe Route, SOS and Safe Journey to request your current location.',
    icon: 'location-outline',
  },
  {
    key: 'showReportHistory',
    title: 'Show report history shortcuts',
    description:
      'Shows report-history and recent-report shortcuts in relevant parts of SafeHer.',
    icon: 'time-outline',
  },
  {
    key: 'shareJourneys',
    title: 'Journey sharing',
    description:
      'Allows Safe Journey to display and use trusted-contact sharing information.',
    icon: 'people-outline',
  },
  {
    key: 'safetyAlerts',
    title: 'Safety alerts',
    description:
      'Allows recent incident information to appear as safety updates on the Home screen.',
    icon: 'notifications-outline',
  },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();

  const {
    preferences,
    isReady,
    updatePreference,
    clearSavedPreferences,
  } = usePrivacyPreferences();

  const [savingKey, setSavingKey] = useState<SettingKey | null>(null);
  const [clearing, setClearing] = useState(false);

  const handleChange = async (key: SettingKey, value: boolean) => {
    try {
      setSavingKey(key);
      await updatePreference(key, value);
    } catch (error) {
      console.error('Privacy preference update failed:', error);
      Alert.alert(
        'Could not save setting',
        'The privacy preference could not be saved. Please try again.'
      );
    } finally {
      setSavingKey(null);
    }
  };

  const confirmClear = () => {
    Alert.alert(
      'Reset privacy preferences?',
      'Your locally saved SafeHer privacy preferences will return to their default values. This will not delete your account, reports, trusted contacts or journeys from Firebase.',
      [
        { text: 'Keep Settings', style: 'cancel' },
        {
          text: 'Reset Preferences',
          style: 'destructive',
          onPress: () => {
            void handleClear();
          },
        },
      ]
    );
  };

  const handleClear = async () => {
    try {
      setClearing(true);
      await clearSavedPreferences();

      Alert.alert(
        'Preferences reset',
        'Your local privacy preferences have been restored to the SafeHer defaults.'
      );
    } catch (error) {
      console.error('Privacy reset failed:', error);
      Alert.alert(
        'Reset failed',
        'SafeHer could not reset the preferences. Please try again.'
      );
    } finally {
      setClearing(false);
    }
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Brand.burgundy} />
          <Text style={styles.loadingText}>
            Loading privacy settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenBackButton label="Back" />

        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={Brand.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Privacy Settings</Text>
            <Text style={styles.subtitle}>
              Choose how SafeHer uses local preferences and safety
              features.
            </Text>
          </View>
        </View>

        {/* ---------- Notice ---------- */}
        <View style={styles.notice}>
          <View style={styles.noticeIconWrap}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={Brand.burgundy}
            />
          </View>

          <Text style={styles.noticeText}>
            These controls affect real app behaviour. They are not
            decorative switches.
          </Text>
        </View>

        {/* ---------- Preferences ---------- */}
        <Text style={styles.sectionTitle}>Your preferences</Text>

        {SETTINGS.map(setting => {
          const value = preferences[setting.key];
          const saving = savingKey === setting.key;

          return (
            <View key={setting.key} style={styles.settingCard}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name={setting.icon}
                  size={21}
                  color={Brand.burgundy}
                />
              </View>

              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{setting.title}</Text>

                <Text style={styles.settingDescription}>
                  {setting.description}
                </Text>

                <View
                  style={[
                    styles.statusPill,
                    value ? styles.statusPillOn : styles.statusPillOff,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      value ? styles.statusDotOn : styles.statusDotOff,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      value ? styles.statusOn : styles.statusOff,
                    ]}
                  >
                    {value ? 'On' : 'Off'}
                  </Text>
                </View>
              </View>

              {saving ? (
                <ActivityIndicator color={Brand.burgundy} />
              ) : (
                <Switch
                  value={value}
                  onValueChange={nextValue => {
                    void handleChange(setting.key, nextValue);
                  }}
                  trackColor={{
                    false: Brand.line,
                    true: Brand.roseSoft,
                  }}
                  thumbColor={value ? Brand.burgundy : '#FFFFFF'}
                />
              )}
            </View>
          );
        })}

        {/* ---------- Learn more ---------- */}
        <Text style={styles.sectionTitle}>Understand your privacy</Text>

        <Pressable
          style={({ pressed }) => [
            styles.navigationCard,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/privacy-safety' as Href)}
        >
          <View style={styles.navigationIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color={Brand.burgundy}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.navigationTitle}>
              Privacy & Safety Information
            </Text>
            <Text style={styles.navigationDescription}>
              Learn what information SafeHer uses and how each safety
              feature works.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={Brand.burgundy}
          />
        </Pressable>

        {/* ---------- Reset ---------- */}
        <View style={styles.resetSection}>
          <View style={styles.resetHeaderRow}>
            <View style={styles.resetIconWrap}>
              <Ionicons
                name="warning-outline"
                size={18}
                color="#912018"
              />
            </View>
            <Text style={styles.resetTitle}>
              Reset local preferences
            </Text>
          </View>

          <Text style={styles.resetDescription}>
            This resets only locally saved preferences. Your Firebase
            account data, incidents, contacts and journeys are not
            deleted.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.resetButton,
              clearing && styles.disabled,
              pressed && !clearing && styles.pressed,
            ]}
            disabled={clearing}
            onPress={confirmClear}
          >
            {clearing ? (
              <ActivityIndicator color="#B42318" />
            ) : (
              <Ionicons
                name="refresh-outline"
                size={19}
                color="#B42318"
              />
            )}

            <Text style={styles.resetButtonText}>
              {clearing ? 'Resetting...' : 'Reset Privacy Preferences'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.cream,
  },

  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: Brand.muted,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 44,
  },

  /* ---------- Header ---------- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 16,
  },

  headerIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Brand.burgundy,
    shadowColor: Brand.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  title: {
    color: Brand.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 4,
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  /* ---------- Notice ---------- */
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
    borderRadius: 16,
    backgroundColor: Brand.blush,
  },

  noticeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  noticeText: {
    flex: 1,
    color: Brand.burgundyDeep,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },

  /* ---------- Section ---------- */
  sectionTitle: {
    marginBottom: 12,
    color: Brand.ink,
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.1,
  },

  /* ---------- Setting card ---------- */
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    backgroundColor: Brand.white,
    shadowColor: '#4E1026',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  settingIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: Brand.blush,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
  },

  settingText: {
    flex: 1,
  },

  settingTitle: {
    color: Brand.ink,
    fontSize: 13.5,
    fontWeight: '800',
  },

  settingDescription: {
    marginTop: 4,
    color: Brand.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  statusPillOn: {
    backgroundColor: '#E8F5ED',
  },

  statusPillOff: {
    backgroundColor: '#F5EDEF',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusDotOn: {
    backgroundColor: '#287550',
  },

  statusDotOff: {
    backgroundColor: '#8B5555',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  statusOn: {
    color: '#287550',
  },

  statusOff: {
    color: '#8B5555',
  },

  /* ---------- Navigation card ---------- */
  navigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 15,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    backgroundColor: Brand.white,
    shadowColor: '#4E1026',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  navigationIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: Brand.blush,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
  },

  navigationTitle: {
    color: Brand.ink,
    fontSize: 14,
    fontWeight: '800',
  },

  navigationDescription: {
    marginTop: 4,
    color: Brand.muted,
    fontSize: 11.5,
    lineHeight: 16,
  },

  /* ---------- Reset ---------- */
  resetSection: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDA29B',
    borderRadius: 18,
    backgroundColor: '#FEF3F2',
  },

  resetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  resetIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  resetTitle: {
    color: '#912018',
    fontSize: 15,
    fontWeight: '900',
  },

  resetDescription: {
    marginTop: 8,
    color: '#7A4A46',
    fontSize: 11.5,
    lineHeight: 17,
  },

  resetButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#B42318',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  resetButtonText: {
    color: '#B42318',
    fontWeight: '900',
    fontSize: 13.5,
  },

  disabled: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.78,
  },
});
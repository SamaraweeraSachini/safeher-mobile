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

import LogoutButton from '@/src/components/auth/LogoutButton';
import { useAuth } from '@/src/context/AuthContext';
import type { SafeHerUserProfile } from '@/src/services/auth-service';
import { getUserProfile } from '@/src/services/profile-service';

export default function ProfileScreen() {
  const router = useRouter();

  const { user, isGuest, isRegisteredUser } = useAuth();

  const [profile, setProfile] = useState<SafeHerUserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let screenIsActive = true;

    async function loadProfile() {
      if (!user || isGuest) {
        setProfile(null);
        setProfileLoading(false);
        setProfileMissing(false);
        setProfileError(null);
        return;
      }

      setProfileLoading(true);
      setProfileMissing(false);
      setProfileError(null);

      try {
        const savedProfile = await getUserProfile(user.uid);

        if (!screenIsActive) {
          return;
        }

        setProfile(savedProfile);
        setProfileMissing(savedProfile === null);
      } catch {
        if (!screenIsActive) {
          return;
        }

        setProfile(null);
        setProfileError(
          'We could not load your saved profile. Basic account details are shown instead.'
        );
      } finally {
        if (screenIsActive) {
          setProfileLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      screenIsActive = false;
    };
  }, [isGuest, user]);

  const displayName = isGuest
    ? 'Guest User'
    : profile?.fullName ||
      user?.displayName ||
      'Profile information unavailable';

  const displayEmail = isGuest
    ? 'Not available for guest accounts'
    : profile?.email || user?.email || 'Email information unavailable';

  const accountType = isGuest
    ? 'Guest Account'
    : isRegisteredUser
      ? 'Registered Account'
      : 'Account unavailable';

  const initials = isGuest
    ? 'G'
    : displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('') || 'S';

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C43D74" />

          <Text style={styles.loadingTitle}>
            Loading your profile
          </Text>

          <Text style={styles.loadingDescription}>
            Please wait while we retrieve your account information.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Profile</Text>
            <Text style={styles.pageSubtitle}>
              Your account and safety resources
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color="#A92F61"
            />
          </View>
        </View>

        {/* ---------- Profile card ---------- */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.displayEmail}>{displayEmail}</Text>

          <View
            style={[
              styles.accountBadge,
              isGuest ? styles.guestBadge : styles.registeredBadge,
            ]}
          >
            <Ionicons
              name={
                isGuest
                  ? 'person-outline'
                  : 'checkmark-circle-outline'
              }
              size={15}
              color={isGuest ? '#9A621F' : '#287550'}
            />

            <Text
              style={[
                styles.accountBadgeText,
                isGuest
                  ? styles.guestBadgeText
                  : styles.registeredBadgeText,
              ]}
            >
              {accountType}
            </Text>
          </View>
        </View>

        {/* ---------- Warnings ---------- */}
        {profileMissing ? (
          <View style={styles.warningCard}>
            <View style={styles.warningIconWrap}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#A96C20"
              />
            </View>

            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>
                Saved profile not found
              </Text>
              <Text style={styles.warningDescription}>
                Your authentication details are shown as a fallback.
              </Text>
            </View>
          </View>
        ) : null}

        {profileError ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIconWrap}>
              <Ionicons
                name="cloud-offline-outline"
                size={20}
                color="#B42318"
              />
            </View>

            <Text style={styles.errorText}>{profileError}</Text>
          </View>
        ) : null}

        {/* ---------- Account info ---------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Account information
          </Text>

          <View style={styles.informationCard}>
            <InformationRow
              icon="person-outline"
              label="Name"
              value={displayName}
            />

            <View style={styles.divider} />

            <InformationRow
              icon="mail-outline"
              label="Email"
              value={displayEmail}
            />

            <View style={styles.divider} />

            <InformationRow
              icon="key-outline"
              label="Account type"
              value={accountType}
            />
          </View>
        </View>

        {/* ---------- Safety ---------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety and support</Text>

          <View style={styles.optionsCard}>
            <OptionRow
              icon="options-outline"
              title="Privacy Settings"
              description="Choose how SafeHer uses your information"
              onPress={() => router.push('/privacy-settings' as Href)}
            />

            <View style={styles.divider} />

            <OptionRow
              icon="lock-closed-outline"
              title="Privacy information"
              description="See how location, reports, and trusted contacts are used"
              onPress={() => router.push('/privacy-safety')}
            />

            <View style={styles.divider} />

            <OptionRow
              icon="documents-outline"
              title="My Reports"
              description="Review the incident reports you submitted"
              onPress={() => router.push('/my-reports' as Href)}
            />

            <View style={styles.divider} />

            <OptionRow
              icon="document-text-outline"
              title="Reporting Guidelines"
              description="Read guidance for responsible incident reporting"
              onPress={() => router.push('/reporting-guidelines')}
            />
          </View>
        </View>

        {/* ---------- Logout ---------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account actions</Text>

          <View style={styles.logoutCard}>
            <View style={styles.logoutHeader}>
              <View style={styles.logoutIcon}>
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color="#A92F61"
                />
              </View>

              <View style={styles.logoutTextContainer}>
                <Text style={styles.logoutTitle}>
                  Ready to leave?
                </Text>
                <Text style={styles.logoutDescription}>
                  You will need to log in or continue as a guest to access
                  SafeHer again.
                </Text>
              </View>
            </View>

            <LogoutButton />
          </View>
        </View>

        <Text style={styles.footerText}>
          SafeHer - Supporting safer journeys together
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type InformationRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function InformationRow({ icon, label, value }: InformationRowProps) {
  return (
    <View style={styles.informationRow}>
      <View style={styles.rowIconContainer}>
        <Ionicons name={icon} size={20} color="#A92F61" />
      </View>

      <View style={styles.rowTextContainer}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

type OptionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
};

function OptionRow({ icon, title, description, onPress }: OptionRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.optionRow,
        pressed && styles.optionPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={`Open ${title}`}
    >
      <View style={styles.rowIconContainer}>
        <Ionicons name={icon} size={20} color="#A92F61" />
      </View>

      <View style={styles.rowTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>

      <View style={styles.optionChevron}>
        <Ionicons name="chevron-forward" size={17} color="#A92F61" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFF8FB',
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },

  /* ---------- Loading ---------- */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#FFF8FB',
  },

  loadingTitle: {
    marginTop: 18,
    color: '#392631',
    fontSize: 19,
    fontWeight: '800',
  },

  loadingDescription: {
    marginTop: 7,
    color: '#755F6A',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

  /* ---------- Header ---------- */
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },

  pageTitle: {
    color: '#392631',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  pageSubtitle: {
    marginTop: 4,
    color: '#876F7A',
    fontSize: 13,
  },

  headerIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#F9E4EE',
    borderWidth: 1,
    borderColor: '#F1DDE6',
  },

  /* ---------- Profile card ---------- */
  profileCard: {
    alignItems: 'center',
    marginTop: 10,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },

  avatarRing: {
    padding: 5,
    borderRadius: 50,
    backgroundColor: '#F9E4EE',
  },

  avatar: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 42,
    backgroundColor: '#C43D74',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  displayName: {
    marginTop: 16,
    color: '#392631',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  displayEmail: {
    marginTop: 5,
    color: '#755F6A',
    fontSize: 13.5,
    textAlign: 'center',
  },

  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  guestBadge: {
    backgroundColor: '#FFF1DF',
  },

  registeredBadge: {
    backgroundColor: '#E8F5ED',
  },

  accountBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  guestBadgeText: {
    color: '#9A621F',
  },

  registeredBadgeText: {
    color: '#287550',
  },

  /* ---------- Warning / Error ---------- */
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFF3DE',
    borderWidth: 1,
    borderColor: '#F5DCAE',
  },

  warningIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  warningTextContainer: {
    flex: 1,
  },

  warningTitle: {
    color: '#74552C',
    fontSize: 14,
    fontWeight: '800',
  },

  warningDescription: {
    marginTop: 3,
    color: '#846B48',
    fontSize: 12,
    lineHeight: 18,
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FDA29B',
  },

  errorIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },

  /* ---------- Section ---------- */
  section: {
    marginTop: 26,
  },

  sectionTitle: {
    marginBottom: 12,
    color: '#392631',
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.1,
  },

  /* ---------- Information card ---------- */
  informationCard: {
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },

  informationRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowIconContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F9E4EE',
  },

  rowTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  rowLabel: {
    color: '#876F7A',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  rowValue: {
    marginTop: 4,
    color: '#392631',
    fontSize: 14,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: '#F3E7EC',
  },

  /* ---------- Options card ---------- */
  optionsCard: {
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },

  optionRow: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionPressed: {
    opacity: 0.65,
  },

  optionTitle: {
    color: '#392631',
    fontSize: 14,
    fontWeight: '800',
  },

  optionDescription: {
    marginTop: 4,
    color: '#876F7A',
    fontSize: 12,
    lineHeight: 17,
  },

  optionChevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9E4EE',
    marginLeft: 6,
  },

  /* ---------- Logout ---------- */
  logoutCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5B8CA',
    borderRadius: 20,
    backgroundColor: '#FFF0F5',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },

  logoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  logoutIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  logoutTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  logoutTitle: {
    color: '#742443',
    fontSize: 15,
    fontWeight: '900',
  },

  logoutDescription: {
    marginTop: 3,
    color: '#8A5368',
    fontSize: 12,
    lineHeight: 17,
  },

  /* ---------- Footer ---------- */
  footerText: {
    marginTop: 30,
    color: '#A08D96',
    fontSize: 11.5,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
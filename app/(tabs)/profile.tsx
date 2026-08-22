import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

import { useAuth } from '@/src/context/AuthContext';
import type { SafeHerUserProfile } from '@/src/services/auth-service';
import { getUserProfile } from '@/src/services/profile-service';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    isGuest,
    isRegisteredUser,
  } = useAuth();

  const [profile, setProfile] =
    useState<SafeHerUserProfile | null>(null);

  const [profileLoading, setProfileLoading] =
    useState(false);

  const [profileMissing, setProfileMissing] =
    useState(false);

  const [profileError, setProfileError] =
    useState<string | null>(null);

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
    : profile?.email ||
      user?.email ||
      'Email information unavailable';

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
          <ActivityIndicator
            size="large"
            color="#C43D74"
          />

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
              size={25}
              color="#A92F61"
            />
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.displayName}>{displayName}</Text>

          <Text style={styles.displayEmail}>{displayEmail}</Text>

          <View
            style={[
              styles.accountBadge,
              isGuest
                ? styles.guestBadge
                : styles.registeredBadge,
            ]}
          >
            <Ionicons
              name={
                isGuest
                  ? 'person-outline'
                  : 'checkmark-circle-outline'
              }
              size={17}
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

        {profileMissing && (
          <View style={styles.warningCard}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#A96C20"
            />

            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>
                Saved profile not found
              </Text>

              <Text style={styles.warningDescription}>
                Your authentication details are shown as a fallback.
              </Text>
            </View>
          </View>
        )}

        {profileError && (
          <View style={styles.errorCard}>
            <Ionicons
              name="cloud-offline-outline"
              size={22}
              color="#B42318"
            />

            <Text style={styles.errorText}>{profileError}</Text>
          </View>
        )}

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Safety and support
          </Text>

          <View style={styles.optionsCard}>
            <OptionRow
              icon="lock-closed-outline"
              title="Privacy and Safety"
              description="Learn how SafeHer protects your information"
              onPress={() => router.push('/privacy-safety')}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Account actions
          </Text>

          <View style={styles.logoutSpace}>
            <View style={styles.logoutIcon}>
              <Ionicons
                name="log-out-outline"
                size={23}
                color="#A92F61"
              />
            </View>

            <View style={styles.logoutTextContainer}>
              <Text style={styles.logoutTitle}>Logout</Text>

              <Text style={styles.logoutDescription}>
                Logout will be connected in the next account task.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>
          SafeHer • Supporting safer journeys together
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

function InformationRow({
  icon,
  label,
  value,
}: InformationRowProps) {
  return (
    <View style={styles.informationRow}>
      <View style={styles.rowIconContainer}>
        <Ionicons
          name={icon}
          size={21}
          color="#A92F61"
        />
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

function OptionRow({
  icon,
  title,
  description,
  onPress,
}: OptionRowProps) {
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
        <Ionicons
          name={icon}
          size={21}
          color="#A92F61"
        />
      </View>

      <View style={styles.rowTextContainer}>
        <Text style={styles.optionTitle}>{title}</Text>

        <Text style={styles.optionDescription}>
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={21}
        color="#9A8790"
      />
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
    paddingBottom: 34,
  },

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

  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pageTitle: {
    color: '#392631',
    fontSize: 27,
    fontWeight: '800',
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
  },

  profileCard: {
    alignItems: 'center',
    marginTop: 10,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },

  avatar: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 44,
    backgroundColor: '#C43D74',
    borderWidth: 5,
    borderColor: '#F9E4EE',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },

  displayName: {
    marginTop: 15,
    color: '#392631',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },

  displayEmail: {
    marginTop: 5,
    color: '#755F6A',
    fontSize: 14,
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
    fontWeight: '700',
  },

  guestBadgeText: {
    color: '#9A621F',
  },

  registeredBadgeText: {
    color: '#287550',
  },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFF3DE',
    borderWidth: 1,
    borderColor: '#F5DCAE',
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
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FDA29B',
  },

  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
  },

  section: {
    marginTop: 25,
  },

  sectionTitle: {
    marginBottom: 11,
    color: '#392631',
    fontSize: 17,
    fontWeight: '800',
  },

  informationCard: {
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
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
    fontSize: 12,
    fontWeight: '600',
  },

  rowValue: {
    marginTop: 3,
    color: '#392631',
    fontSize: 14,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#F3E7EC',
  },

  optionsCard: {
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
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

  logoutSpace: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5B8CA',
    borderRadius: 20,
    backgroundColor: '#FFF0F5',
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
    fontWeight: '800',
  },

  logoutDescription: {
    marginTop: 3,
    color: '#8A5368',
    fontSize: 12,
    lineHeight: 17,
  },

  footerText: {
    marginTop: 28,
    color: '#A08D96',
    fontSize: 12,
    textAlign: 'center',
  },
});
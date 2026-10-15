import { Ionicons } from '@expo/vector-icons';

import {
  type Href,
  useRouter,
} from 'expo-router';

import {
  useMemo,
  useState,
} from 'react';

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useAuth,
} from '@/src/context/AuthContext';

import {
  useLanguage,
} from '@/src/context/LanguageContext';

import {
  usePrivacyPreferences,
} from '@/src/context/PrivacyPreferencesContext';

import {
  useActiveSafeJourney,
} from '@/src/hooks/useActiveSafeJourney';

import {
  useActiveIncidents,
} from '@/src/hooks/useRecentIncidents';

type FeatureId =
  | 'safety-map'
  | 'report-incident'
  | 'safe-route'
  | 'trusted-contacts'
  | 'safe-journey'
  | 'sos';

type FeatureCard = {
  id: FeatureId;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  route: Href;
};

const FEATURES: FeatureCard[] = [
  {
    id: 'safety-map',
    icon: 'map-outline',
    color: '#16697A',
    backgroundColor: '#E4F4F7',
    route: '/safety-map',
  },
  {
    id: 'report-incident',
    icon: 'warning-outline',
    color: '#C25450',
    backgroundColor: '#FCECEB',
    route: '/report',
  },
  {
    id: 'safe-route',
    icon: 'navigate-outline',
    color: '#38785A',
    backgroundColor: '#E8F5ED',
    route: '/safe-route',
  },
  {
    id: 'trusted-contacts',
    icon: 'people-outline',
    color: '#7957A8',
    backgroundColor: '#F1EAF9',
    route: '/trusted-contacts',
  },
  {
    id: 'safe-journey',
    icon: 'walk-outline',
    color: '#B36A22',
    backgroundColor: '#FFF1DF',
    route: '/journey',
  },
  {
    id: 'sos',
    icon: 'alert-circle-outline',
    color: '#FFFFFF',
    backgroundColor: '#C83B4D',
    route: '/sos',
  },
];

const TEXT = {
  en: {
    hello: 'Hello',
    guest: 'Guest',
    defaultUser: 'SafeHer User',
    welcome: 'Where would you like to go safely today?',
    safetyTitle: 'Your safety matters',
    safetyDescription:
      'Stay aware, trust your instincts and keep your trusted contacts informed.',
    featureHeading: 'Safety Features',
    featureSubheading: 'Choose a service to continue',
    safetyTip:
      'Safety tip: Share your location with someone you trust before beginning a journey.',
    languageButton: 'සිං',
    languageLabel: 'Switch to Sinhala',
    notifications: 'Safety Updates',
    notificationDescription:
      'Important updates from your current SafeHer activity.',
    noNotifications: 'No important updates right now.',
    noNotificationsDescription:
      'Active journeys and recent safety reports will appear here.',
    activeJourney: 'Active Safe Journey',
    activeJourneyDescription:
      'You currently have a journey in progress.',
    resumeJourney: 'Resume Journey',
    recentIncidents: 'Recent Safety Reports',
    recentIncidentSingle:
      '1 active incident was reported within the last 24 hours.',
    recentIncidentPrefix: '',
    recentIncidentSuffix:
      ' active incidents were reported within the last 24 hours.',
    viewMap: 'View Safety Map',
    alertsOff:
      'Safety alerts are turned off in Privacy Settings.',
    close: 'Close',
    features: {
      'safety-map': {
        title: 'Safety Map',
        description: 'View nearby safety information',
      },
      'report-incident': {
        title: 'Report Incident',
        description: 'Quickly report an unsafe situation',
      },
      'safe-route': {
        title: 'Safe Route',
        description: 'Compare routes using recent safety reports',
      },
      'trusted-contacts': {
        title: 'Trusted Contacts',
        description: 'Manage people you trust',
      },
      'safe-journey': {
        title: 'Safe Journey',
        description: 'Share and monitor your journey',
      },
      sos: {
        title: 'SOS',
        description: 'Get emergency help immediately',
      },
    },
  },
  si: {
    hello: 'ආයුබෝවන්',
    guest: 'අමුත්තා',
    defaultUser: 'SafeHer පරිශීලකයා',
    welcome: 'අද ආරක්ෂිතව යාමට ඔබට අවශ්‍ය කොතැනටද?',
    safetyTitle: 'ඔබගේ ආරක්ෂාව වැදගත්',
    safetyDescription:
      'අවධානයෙන් සිටින්න, ඔබගේ අවබෝධය විශ්වාස කරන්න සහ විශ්වාසදායක සම්බන්ධතා දැනුවත් කර තබන්න.',
    featureHeading: 'ආරක්ෂක විශේෂාංග',
    featureSubheading: 'ඉදිරියට යාමට සේවාවක් තෝරන්න',
    safetyTip:
      'ආරක්ෂක ඉඟිය: ගමනක් ආරම්භ කිරීමට පෙර ඔබ විශ්වාස කරන අයෙකු සමඟ ඔබගේ ස්ථානය බෙදා ගන්න.',
    languageButton: 'EN',
    languageLabel: 'ඉංග්‍රීසි භාෂාවට මාරු වන්න',
    notifications: 'ආරක්ෂක යාවත්කාලීන',
    notificationDescription:
      'ඔබගේ වත්මන් SafeHer ක්‍රියාකාරකම් පිළිබඳ වැදගත් තොරතුරු.',
    noNotifications: 'දැනට වැදගත් යාවත්කාලීන නොමැත.',
    noNotificationsDescription:
      'සක්‍රීය ගමන් සහ මෑත ආරක්ෂක වාර්තා මෙහි පෙන්වනු ඇත.',
    activeJourney: 'සක්‍රීය ආරක්ෂිත ගමන',
    activeJourneyDescription:
      'ඔබට දැනට ක්‍රියාත්මක ගමනක් ඇත.',
    resumeJourney: 'ගමන නැවත අරඹන්න',
    recentIncidents: 'මෑත ආරක්ෂක වාර්තා',
    recentIncidentSingle:
      'පසුගිය පැය 24 තුළ සක්‍රීය සිද්ධියක් වාර්තා වී ඇත.',
    recentIncidentPrefix: 'පසුගිය පැය 24 තුළ සක්‍රීය සිද්ධි ',
    recentIncidentSuffix: 'ක් වාර්තා වී ඇත.',
    viewMap: 'ආරක්ෂක සිතියම බලන්න',
    alertsOff:
      'Privacy Settings තුළ Safety Alerts අක්‍රිය කර ඇත.',
    close: 'වසන්න',
    features: {
      'safety-map': {
        title: 'ආරක්ෂක සිතියම',
        description: 'අසල ආරක්ෂක තොරතුරු බලන්න',
      },
      'report-incident': {
        title: 'සිද්ධියක් වාර්තා කරන්න',
        description: 'අනාරක්ෂිත තත්ත්වයක් ඉක්මනින් වාර්තා කරන්න',
      },
      'safe-route': {
        title: 'ආරක්ෂිත මාර්ගය',
        description: 'මෑත ආරක්ෂක වාර්තා අනුව මාර්ග සසඳන්න',
      },
      'trusted-contacts': {
        title: 'විශ්වාසදායක සම්බන්ධතා',
        description: 'ඔබ විශ්වාස කරන පුද්ගලයින් කළමනාකරණය කරන්න',
      },
      'safe-journey': {
        title: 'ආරක්ෂිත ගමන',
        description: 'ඔබගේ ගමන බෙදාගෙන නිරීක්ෂණය කරන්න',
      },
      sos: {
        title: 'SOS',
        description: 'හදිසි උපකාර ලබාගන්න',
      },
    },
  },
} as const;

const RECENT_INCIDENT_TIME = 24 * 60 * 60 * 1000;

export default function HomeScreen() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { preferences } = usePrivacyPreferences();
  const { journey: activeJourney } = useActiveSafeJourney();
  const { incidents } = useActiveIncidents();

  const [notificationsVisible, setNotificationsVisible] =
    useState(false);

  const text = TEXT[language];

  const displayName = useMemo(() => {
    if (isGuest) {
      return text.guest;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return text.defaultUser;
  }, [isGuest, text.defaultUser, text.guest, user]);

  const recentIncidents = useMemo(
    () =>
      incidents.filter(incident => {
        const createdAt = incident.createdAt?.toMillis();
        if (!createdAt) {
          return false;
        }
        return Date.now() - createdAt <= RECENT_INCIDENT_TIME;
      }),
    [incidents]
  );

  const notificationCount =
    (activeJourney ? 1 : 0) +
    (preferences.safetyAlerts && recentIncidents.length > 0 ? 1 : 0);

  const handleFeaturePress = (feature: FeatureCard) => {
    router.push(feature.route);
  };

  const openActiveJourney = () => {
    setNotificationsVisible(false);
    router.push('/active-journey' as Href);
  };

  const openSafetyMap = () => {
    setNotificationsVisible(false);
    router.push('/safety-map' as Href);
  };

  const getRecentIncidentText = () => {
    if (recentIncidents.length === 1) {
      return text.recentIncidentSingle;
    }
    if (language === 'si') {
      return (
        text.recentIncidentPrefix +
        recentIncidents.length +
        text.recentIncidentSuffix
      );
    }
    return `${recentIncidents.length}` + text.recentIncidentSuffix;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <View style={styles.logoContainer}>
              <Ionicons
                name="shield-checkmark"
                size={22}
                color="#FFFFFF"
              />
            </View>
            <View>
              <Text style={styles.brandName}>SafeHer</Text>
              <Text style={styles.brandTagline}>Stay Safe. Stay Strong.</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [
                styles.languageButton,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                void toggleLanguage();
              }}
              accessibilityRole="button"
              accessibilityLabel={text.languageLabel}
            >
              <Text style={styles.languageText}>
                {text.languageButton}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.notificationButton,
                pressed && styles.pressed,
              ]}
              onPress={() => setNotificationsVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={text.notifications}
            >
              <Ionicons
                name={
                  notificationCount > 0
                    ? 'notifications'
                    : 'notifications-outline'
                }
                size={22}
                color="#5A3D4D"
              />
              {notificationCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        {/* ================= WELCOME ================= */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>
            {text.hello},{' '}
            <Text style={styles.greetingName}>{displayName}</Text>
          </Text>
          <Text style={styles.welcomeText}>{text.welcome}</Text>
        </View>

        {/* ================= ACTIVE JOURNEY ================= */}
        {activeJourney ? (
          <Pressable
            style={({ pressed }) => [
              styles.activeJourneyBanner,
              pressed && styles.pressed,
            ]}
            onPress={openActiveJourney}
          >
            <View style={styles.activeJourneyAccent} />
            <View style={styles.activeJourneyIcon}>
              <Ionicons name="navigate" size={20} color="#287550" />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.activeJourneyTopRow}>
                <Text style={styles.activeJourneyTitle}>
                  {text.activeJourney}
                </Text>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <Text
                style={styles.activeJourneyDestination}
                numberOfLines={1}
              >
                {activeJourney.destination}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#287550"
            />
          </Pressable>
        ) : null}

        {/* ================= SAFETY MESSAGE ================= */}
        <View style={styles.safetyMessage}>
          <View style={styles.safetyIconContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={26}
              color="#A92F61"
            />
          </View>

          <View style={styles.safetyTextContainer}>
            <Text style={styles.safetyTitle}>{text.safetyTitle}</Text>
            <Text style={styles.safetyDescription}>
              {text.safetyDescription}
            </Text>
          </View>
        </View>

        {/* ================= SECTION HEADER ================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{text.featureHeading}</Text>
          <Text style={styles.sectionSubtitle}>
            {text.featureSubheading}
          </Text>
        </View>

        {/* ================= FEATURE GRID ================= */}
        <View style={styles.featureGrid}>
          {FEATURES.map(feature => {
            const isSos = feature.id === 'sos';
            const translatedFeature = text.features[feature.id];

            return (
              <Pressable
                key={feature.id}
                style={({ pressed }) => [
                  styles.featureCard,
                  {
                    backgroundColor: feature.backgroundColor,
                    opacity: pressed ? 0.85 : 1,
                  },
                  isSos && styles.sosCard,
                ]}
                onPress={() => handleFeaturePress(feature)}
                accessibilityRole="button"
                accessibilityLabel={translatedFeature.title}
                accessibilityHint={translatedFeature.description}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    {
                      backgroundColor: isSos
                        ? 'rgba(255, 255, 255, 0.2)'
                        : '#FFFFFF',
                    },
                  ]}
                >
                  <Ionicons
                    name={feature.icon}
                    size={26}
                    color={feature.color}
                  />
                </View>

                <Text
                  style={[
                    styles.featureTitle,
                    isSos && styles.sosText,
                  ]}
                >
                  {translatedFeature.title}
                </Text>

                <Text
                  style={[
                    styles.featureDescription,
                    isSos && styles.sosDescription,
                  ]}
                  numberOfLines={3}
                >
                  {translatedFeature.description}
                </Text>

                <View
                  style={[
                    styles.arrowContainer,
                    isSos && styles.arrowContainerSos,
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={isSos ? '#FFFFFF' : feature.color}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ================= TIP ================= */}
        <View style={styles.tipContainer}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={18} color="#A96C20" />
          </View>
          <Text style={styles.tipText}>{text.safetyTip}</Text>
        </View>
      </ScrollView>

      {/* ================= NOTIFICATIONS MODAL ================= */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setNotificationsVisible(false)}
          />

          <View style={styles.notificationSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.notificationHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notificationTitle}>
                  {text.notifications}
                </Text>
                <Text style={styles.notificationSubtitle}>
                  {text.notificationDescription}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => setNotificationsVisible(false)}
              >
                <Ionicons name="close" size={20} color="#392631" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeJourney ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.notificationCard,
                    pressed && styles.pressed,
                  ]}
                  onPress={openActiveJourney}
                >
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: '#E8F5ED' },
                    ]}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={22}
                      color="#287550"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.notificationCardTitle}>
                      {text.activeJourney}
                    </Text>
                    <Text style={styles.notificationCardDescription}>
                      {text.activeJourneyDescription}
                    </Text>
                    <Text
                      style={styles.notificationDestination}
                      numberOfLines={2}
                    >
                      {activeJourney.destination}
                    </Text>
                    <Text style={styles.notificationAction}>
                      {text.resumeJourney}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#287550"
                  />
                </Pressable>
              ) : null}

              {preferences.safetyAlerts &&
              recentIncidents.length > 0 ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.notificationCard,
                    pressed && styles.pressed,
                  ]}
                  onPress={openSafetyMap}
                >
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: '#FCECEB' },
                    ]}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={22}
                      color="#C25450"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.notificationCardTitle}>
                      {text.recentIncidents}
                    </Text>
                    <Text style={styles.notificationCardDescription}>
                      {getRecentIncidentText()}
                    </Text>
                    <Text style={styles.notificationAction}>
                      {text.viewMap}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#C25450"
                  />
                </Pressable>
              ) : null}

              {!preferences.safetyAlerts ? (
                <View style={styles.alertsOffCard}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={20}
                    color="#876F7A"
                  />
                  <Text style={styles.alertsOffText}>
                    {text.alertsOff}
                  </Text>
                </View>
              ) : null}

              {!activeJourney &&
              (!preferences.safetyAlerts ||
                recentIncidents.length === 0) ? (
                <View style={styles.emptyNotifications}>
                  <View style={styles.emptyNotificationIcon}>
                    <Ionicons
                      name="notifications-outline"
                      size={28}
                      color="#A92F61"
                    />
                  </View>
                  <Text style={styles.emptyNotificationTitle}>
                    {text.noNotifications}
                  </Text>
                  <Text style={styles.emptyNotificationDescription}>
                    {text.noNotificationsDescription}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.pressed,
              ]}
              onPress={() => setNotificationsVisible(false)}
            >
              <Text style={styles.modalCloseText}>{text.close}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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

  /* ---------- Header ---------- */
  header: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C43D74',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  brandName: {
    color: '#452B39',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  brandTagline: {
    color: '#876F7A',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageButton: {
    minWidth: 45,
    height: 44,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#742443',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  languageText: {
    color: '#742443',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DDE6',
    position: 'relative',
    shadowColor: '#742443',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF8FB',
    backgroundColor: '#C83B4D',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  /* ---------- Welcome ---------- */
  welcomeSection: {
    marginTop: 18,
    marginBottom: 20,
  },
  greeting: {
    color: '#392631',
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  greetingName: {
    color: '#A92F61',
    fontWeight: '900',
  },
  welcomeText: {
    marginTop: 6,
    color: '#755F6A',
    fontSize: 14.5,
    lineHeight: 21,
  },

  /* ---------- Active Journey ---------- */
  activeJourneyBanner: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#B7DEC9',
    borderRadius: 18,
    backgroundColor: '#F0F9F4',
    overflow: 'hidden',
    shadowColor: '#287550',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  activeJourneyAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#287550',
  },
  activeJourneyIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#DDF4E6',
  },
  activeJourneyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  activeJourneyTitle: {
    color: '#287550',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#287550',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeJourneyDestination: {
    marginTop: 4,
    color: '#392631',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* ---------- Safety Message ---------- */
  safetyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#F9E4EE',
    borderWidth: 1,
    borderColor: '#F1C8DA',
    shadowColor: '#A92F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  safetyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#A92F61',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  safetyTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  safetyTitle: {
    color: '#742443',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  safetyDescription: {
    marginTop: 5,
    color: '#75515F',
    fontSize: 12.5,
    lineHeight: 18,
  },

  /* ---------- Section Header ---------- */
  sectionHeader: {
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#392631',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    marginTop: 3,
    color: '#876F7A',
    fontSize: 12.5,
  },

  /* ---------- Feature Grid ---------- */
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  featureCard: {
    width: '48%',
    minHeight: 178,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(83, 55, 68, 0.08)',
    shadowColor: '#532E3F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sosCard: {
    borderColor: '#C83B4D',
    shadowColor: '#C83B4D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    marginTop: 14,
    color: '#392631',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  featureDescription: {
    marginTop: 6,
    color: '#695660',
    fontSize: 11.5,
    lineHeight: 16,
    paddingRight: 8,
  },
  sosText: {
    color: '#FFFFFF',
  },
  sosDescription: {
    color: '#FFE7EA',
  },
  arrowContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowContainerSos: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },

  /* ---------- Tip ---------- */
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 24,
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#FFF3DE',
    borderWidth: 1,
    borderColor: '#F5DCAE',
  },
  tipIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    color: '#74552C',
    fontSize: 12.5,
    lineHeight: 18.5,
    marginTop: 3,
  },

  /* ---------- Modal ---------- */
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(41, 24, 32, 0.42)',
  },
  modalDismissArea: {
    flex: 1,
  },
  notificationSheet: {
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  modalHandle: {
    width: 44,
    height: 5,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 3,
    backgroundColor: '#D9C9D0',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  notificationTitle: {
    color: '#392631',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  notificationSubtitle: {
    marginTop: 5,
    color: '#755F6A',
    fontSize: 12,
    lineHeight: 18,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F9E4EE',
  },
  notificationCard: {
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#532E3F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  notificationIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  notificationCardTitle: {
    color: '#392631',
    fontSize: 14,
    fontWeight: '900',
  },
  notificationCardDescription: {
    marginTop: 4,
    color: '#755F6A',
    fontSize: 12,
    lineHeight: 17,
  },
  notificationDestination: {
    marginTop: 5,
    color: '#392631',
    fontSize: 11,
    fontWeight: '700',
  },
  notificationAction: {
    marginTop: 7,
    color: '#A92F61',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  alertsOffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 13,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#F6F1F3',
  },
  alertsOffText: {
    flex: 1,
    color: '#755F6A',
    fontSize: 12,
    lineHeight: 17,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 18,
  },
  emptyNotificationIcon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F9E4EE',
  },
  emptyNotificationTitle: {
    marginTop: 12,
    color: '#392631',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyNotificationDescription: {
    marginTop: 5,
    color: '#755F6A',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  modalCloseButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: '#C43D74',
    shadowColor: '#C43D74',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  pressed: {
    opacity: 0.8,
  },
});
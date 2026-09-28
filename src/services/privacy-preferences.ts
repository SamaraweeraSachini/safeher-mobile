import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrivacyPreferences = {
  anonymousReportingByDefault: boolean;
  allowLocationUse: boolean;
  showReportHistory: boolean;
  shareJourneys: boolean;
  safetyAlerts: boolean;
};

export const defaultPrivacyPreferences: PrivacyPreferences = {
  anonymousReportingByDefault: true,
  allowLocationUse: true,
  showReportHistory: true,
  shareJourneys: true,
  safetyAlerts: true,
};

const STORAGE_KEY = 'safeher.privacy-preferences';

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export async function loadPrivacyPreferences(): Promise<PrivacyPreferences> {
  const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return defaultPrivacyPreferences;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<PrivacyPreferences>;

    return {
      anonymousReportingByDefault: isBoolean(parsed.anonymousReportingByDefault)
        ? parsed.anonymousReportingByDefault
        : defaultPrivacyPreferences.anonymousReportingByDefault,
      allowLocationUse: isBoolean(parsed.allowLocationUse)
        ? parsed.allowLocationUse
        : defaultPrivacyPreferences.allowLocationUse,
      showReportHistory: isBoolean(parsed.showReportHistory)
        ? parsed.showReportHistory
        : defaultPrivacyPreferences.showReportHistory,
      shareJourneys: isBoolean(parsed.shareJourneys)
        ? parsed.shareJourneys
        : defaultPrivacyPreferences.shareJourneys,
      safetyAlerts: isBoolean(parsed.safetyAlerts)
        ? parsed.safetyAlerts
        : defaultPrivacyPreferences.safetyAlerts,
    };
  } catch {
    return defaultPrivacyPreferences;
  }
}

export async function savePrivacyPreferences(
  preferences: PrivacyPreferences
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export async function clearPrivacyPreferences(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

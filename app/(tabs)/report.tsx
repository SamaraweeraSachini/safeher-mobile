import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { Brand } from "@/constants/brand";
import { INCIDENT_CATEGORIES } from "@/constants/incident-categories";

import { usePrivacyPreferences } from "@/src/context/PrivacyPreferencesContext";

import {
  createIncidentReport,
  IncidentSubmissionError,
} from "@/src/services/incident-service";

import {
  reverseGeocodeLocation,
} from "@/src/services/location-address-service";

import type {
  IncidentCategoryId,
  IncidentCoordinates,
} from "@/src/types/incident";

const DESCRIPTION_LIMIT = 500;

interface FormErrors {
  category?: string;
  description?: string;
  location?: string;
  guidelines?: string;
}

interface ErrorMessageProps {
  message: string;
  compact?: boolean;
}

export default function ReportScreen() {
  const { preferences, isReady } = usePrivacyPreferences();

  const anonymousDefaultChanged = useRef(false);

  const [selectedCategory, setSelectedCategory] =
    useState<IncidentCategoryId | null>(null);

  const [description, setDescription] = useState("");

  const [incidentLocation, setIncidentLocation] =
    useState<IncidentCoordinates | null>(null);

  const [incidentAddress, setIncidentAddress] =
    useState<string | null>(null);

  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const [locationSelectionError, setLocationSelectionError] =
    useState<string | null>(null);

  const [reportAnonymously, setReportAnonymously] = useState(true);

  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isReady || anonymousDefaultChanged.current) {
      return;
    }
    setReportAnonymously(preferences.anonymousReportingByDefault);
  }, [isReady, preferences.anonymousReportingByDefault]);

  const clearError = useCallback((field: keyof FormErrors) => {
    setErrors(currentErrors => {
      if (!currentErrors[field]) {
        return currentErrors;
      }
      const updatedErrors = { ...currentErrors };
      delete updatedErrors[field];
      return updatedErrors;
    });
  }, []);

  const handleCategorySelection = (categoryId: IncidentCategoryId) => {
    setSelectedCategory(categoryId);
    clearError("category");
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (value.trim().length <= DESCRIPTION_LIMIT) {
      clearError("description");
    }
  };

  const handleSelectLocation = async () => {
    if (isLocationLoading) {
      return;
    }

    if (!preferences.allowLocationUse) {
      setIncidentLocation(null);
      setIncidentAddress(null);
      setLocationSelectionError(
        "Location use is turned off in Privacy Settings. Turn it on there before selecting a location."
      );
      Alert.alert(
        "Location is turned off",
        "Turn on Use location in Privacy Settings if you want this report to include your location."
      );
      return;
    }

    try {
      setIsLocationLoading(true);
      setLocationSelectionError(null);

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setIncidentLocation(null);
        setIncidentAddress(null);
        setLocationSelectionError(
          "Location services are switched off. Turn on your phone location and try again."
        );
        Alert.alert(
          "Location is turned off",
          "Please turn on Location/GPS on your phone and try again."
        );
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (permission.status !== "granted") {
        setIncidentLocation(null);
        setIncidentAddress(null);
        setLocationSelectionError(
          "Location permission was denied. You can continue using the form, but a location is required before submission."
        );
        Alert.alert(
          "Location permission required",
          "SafeHer needs foreground-location permission to add your current location. Background location is not requested."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const selectedCoordinates: IncidentCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setIncidentLocation(selectedCoordinates);

      const selectedAddress = await reverseGeocodeLocation(
        selectedCoordinates
      );

      setIncidentAddress(selectedAddress);
      setLocationSelectionError(null);
      clearError("location");

      Alert.alert(
        "Location selected",
        selectedAddress
          ? "Your current location was successfully added to the report."
          : "Your location was added. A readable address was unavailable, so SafeHer will keep the GPS coordinates."
      );
    } catch (error) {
      console.error("Incident location selection error:", error);
      setIncidentLocation(null);
      setIncidentAddress(null);
      setLocationSelectionError(
        "SafeHer could not retrieve your current location. Check that Location/GPS is enabled and try again."
      );
      Alert.alert(
        "Unable to retrieve location",
        "Check that Location/GPS is enabled, then try again."
      );
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleGuidelinesChange = () => {
    const nextValue = !guidelinesAccepted;
    setGuidelinesAccepted(nextValue);
    if (nextValue) {
      clearError("guidelines");
    }
  };

  const validateForm = (): boolean => {
    const validationErrors: FormErrors = {};
    const trimmedDescription = description.trim();

    if (!selectedCategory) {
      validationErrors.category = "Please select an incident type.";
    }
    if (trimmedDescription.length > DESCRIPTION_LIMIT) {
      validationErrors.description = `Description must not exceed ${DESCRIPTION_LIMIT} characters.`;
    }
    if (!incidentLocation) {
      validationErrors.location =
        "Please select your current location for this incident report.";
    }
    if (!guidelinesAccepted) {
      validationErrors.guidelines =
        "You must acknowledge the reporting guidelines.";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setDescription("");
    setIncidentLocation(null);
    setIncidentAddress(null);
    setLocationSelectionError(null);
    setIsLocationLoading(false);
    anonymousDefaultChanged.current = false;
    setReportAnonymously(preferences.anonymousReportingByDefault);
    setGuidelinesAccepted(false);
    setErrors({});
  };

  const handleCancel = () => {
    const hasEnteredInformation =
      selectedCategory !== null ||
      description.trim().length > 0 ||
      incidentLocation !== null ||
      guidelinesAccepted ||
      !reportAnonymously;

    if (!hasEnteredInformation) {
      resetForm();
      return;
    }

    Alert.alert(
      "Clear incident report?",
      "The information entered in this form will be removed.",
      [
        { text: "Keep Editing", style: "cancel" },
        {
          text: "Clear Form",
          style: "destructive",
          onPress: resetForm,
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }
    if (!validateForm()) {
      Alert.alert(
        "Check your report",
        "Please correct the highlighted information before submitting."
      );
      return;
    }
    if (!selectedCategory || !incidentLocation) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createIncidentReport({
        type: selectedCategory,
        description,
        coordinates: {
          latitude: incidentLocation.latitude,
          longitude: incidentLocation.longitude,
        },
        address: incidentAddress,
        anonymous: reportAnonymously,
      });

      resetForm();
      router.push("/report-confirmation" as any);
    } catch (error) {
      const errorMessage =
        error instanceof IncidentSubmissionError
          ? error.message
          : "SafeHer could not submit your incident report. Please try again.";

      Alert.alert("Submission failed", errorMessage, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Try Again",
          onPress: () => {
            void handleSubmit();
          },
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  const isLocationBusy = isLocationLoading;
  const visibleLocationError = locationSelectionError;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="warning-outline"
              size={26}
              color={Brand.burgundy}
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Report an Incident</Text>
            <Text style={styles.subtitle}>
              Share safety information to help protect the community.
            </Text>
          </View>
        </View>

        {/* ---------- Safety Notice ---------- */}
        <View style={styles.safetyNotice}>
          <View style={styles.safetyNoticeIconWrap}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={Brand.burgundy}
            />
          </View>
          <Text style={styles.safetyNoticeText}>
            If you are in immediate danger, contact emergency services or
            use the SafeHer SOS feature.
          </Text>
        </View>

        {/* ---------- Recent Incidents ---------- */}
        {preferences.showReportHistory ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View recent incidents"
            onPress={() => {
              router.push("/recent-incidents" as any);
            }}
            style={({ pressed }) => [
              styles.recentIncidentsCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.recentIncidentsIcon}>
              <Ionicons
                name="time-outline"
                size={22}
                color={Brand.burgundy}
              />
            </View>

            <View style={styles.recentIncidentsTextContainer}>
              <Text style={styles.recentIncidentsTitle}>
                Recent Incidents
              </Text>
              <Text style={styles.recentIncidentsDescription}>
                Browse recently reported safety incidents from the
                community.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={Brand.burgundy}
            />
          </Pressable>
        ) : null}

        {/* ---------- Error Summary ---------- */}
        {hasErrors ? (
          <View style={styles.errorSummary}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color={Brand.burgundy}
            />
            <Text style={styles.errorSummaryText}>
              Some required information is missing. Check the highlighted
              fields below.
            </Text>
          </View>
        ) : null}

        {/* ---------- Incident Type ---------- */}
        <View
          style={[
            styles.section,
            errors.category && styles.sectionWithError,
          ]}
        >
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Incident type</Text>
            <Text style={styles.required}>Required</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Select the option that best describes the safety concern.
          </Text>

          <View style={styles.categoryGrid}>
            {INCIDENT_CATEGORIES.map(category => {
              const isSelected = selectedCategory === category.id;

              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${category.label} incident type`}
                  disabled={isSubmitting}
                  onPress={() => {
                    handleCategorySelection(category.id);
                  }}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    isSelected && styles.categoryCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.backgroundColor },
                    ]}
                  >
                    <Ionicons
                      name={category.icon}
                      size={22}
                      color={category.color}
                    />
                  </View>

                  <Text
                    style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelSelected,
                    ]}
                  >
                    {category.label}
                  </Text>

                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Brand.burgundy}
                      style={styles.selectedCheck}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {errors.category ? (
            <ErrorMessage message={errors.category} />
          ) : null}
        </View>

        {/* ---------- Description ---------- */}
        <View
          style={[
            styles.section,
            errors.description && styles.sectionWithError,
          ]}
        >
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.optional}>Optional</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Briefly explain what happened without including sensitive
            personal information.
          </Text>

          <TextInput
            value={description}
            onChangeText={handleDescriptionChange}
            placeholder="Describe the incident or safety concern..."
            placeholderTextColor={Brand.muted}
            multiline
            maxLength={DESCRIPTION_LIMIT}
            textAlignVertical="top"
            editable={!isSubmitting}
            style={[
              styles.descriptionInput,
              errors.description && styles.inputWithError,
            ]}
            accessibilityLabel="Incident description"
          />

          <View style={styles.descriptionFooter}>
            <View style={styles.descriptionErrorContainer}>
              {errors.description ? (
                <ErrorMessage message={errors.description} compact />
              ) : null}
            </View>

            <Text
              style={[
                styles.characterCount,
                description.length >= DESCRIPTION_LIMIT &&
                  styles.characterCountLimit,
              ]}
            >
              {description.length}/{DESCRIPTION_LIMIT}
            </Text>
          </View>
        </View>

        {/* ---------- Location ---------- */}
        <View
          style={[
            styles.section,
            errors.location && styles.sectionWithError,
          ]}
        >
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Incident location</Text>
            <Text style={styles.required}>Required</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Use your current position as the location of the incident or
            safety concern.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use current location for incident report"
            disabled={isSubmitting || isLocationBusy}
            onPress={handleSelectLocation}
            style={({ pressed }) => [
              styles.locationButton,
              incidentLocation && styles.locationButtonSelected,
              errors.location && styles.inputWithError,
              (isSubmitting || isLocationBusy) && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.locationIcon,
                incidentLocation && styles.locationIconSelected,
              ]}
            >
              {isLocationBusy ? (
                <ActivityIndicator size="small" color={Brand.burgundy} />
              ) : (
                <Ionicons
                  name={
                    incidentLocation
                      ? "checkmark-circle"
                      : "locate-outline"
                  }
                  size={22}
                  color={incidentLocation ? Brand.white : Brand.burgundy}
                />
              )}
            </View>

            <View style={styles.locationTextContainer}>
              <Text style={styles.locationTitle}>
                {isLocationBusy
                  ? "Getting your location..."
                  : incidentLocation
                    ? "Current location selected"
                    : locationSelectionError
                      ? "Location unavailable"
                      : "Use current location"}
              </Text>

              <Text style={styles.locationDescription}>
                {incidentLocation
                  ? incidentAddress ??
                    "Location selected. Readable address unavailable."
                  : isLocationBusy
                    ? "Please wait while SafeHer retrieves your location."
                    : "Tap to add your current location."}
              </Text>
            </View>

            {!isLocationBusy ? (
              <Ionicons
                name={
                  incidentLocation ? "checkmark" : "chevron-forward"
                }
                size={20}
                color={
                  incidentLocation ? Brand.burgundy : Brand.muted
                }
              />
            ) : null}
          </Pressable>

          {incidentLocation ? (
            <View style={styles.locationConfirmation}>
              <Ionicons
                name="shield-checkmark-outline"
                size={17}
                color={Brand.burgundy}
              />
              <Text style={styles.locationConfirmationText}>
                {incidentAddress
                  ? "A readable address and GPS coordinates are saved with this report."
                  : "GPS coordinates are saved with this report."}
              </Text>
            </View>
          ) : null}

          {!incidentLocation && visibleLocationError ? (
            <View style={styles.locationFailure}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={Brand.burgundy}
              />
              <View style={styles.locationFailureTextContainer}>
                <Text style={styles.locationFailureText}>
                  {visibleLocationError}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  disabled={isLocationBusy}
                  onPress={handleSelectLocation}
                  style={({ pressed }) => [
                    styles.retryLocationButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={16}
                    color={Brand.burgundy}
                  />
                  <Text style={styles.retryLocationText}>Try Again</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {errors.location ? (
            <ErrorMessage message={errors.location} />
          ) : null}
        </View>

        {/* ---------- Anonymous Option ---------- */}
        <View style={styles.optionCard}>
          <View style={styles.optionIcon}>
            <Ionicons
              name="person-outline"
              size={22}
              color={Brand.burgundy}
            />
          </View>

          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>Report anonymously</Text>
            <Text style={styles.optionDescription}>
              Your name and email will not be publicly displayed.
            </Text>
          </View>

          <Switch
            value={reportAnonymously}
            onValueChange={value => {
              anonymousDefaultChanged.current = true;
              setReportAnonymously(value);
            }}
            disabled={isSubmitting}
            trackColor={{
              false: Brand.line,
              true: Brand.roseSoft,
            }}
            thumbColor={reportAnonymously ? Brand.burgundy : Brand.white}
            accessibilityLabel="Report anonymously"
          />
        </View>

        {/* ---------- Guidelines ---------- */}
        <View
          style={[
            styles.guidelinesCard,
            errors.guidelines && styles.sectionWithError,
          ]}
        >
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: guidelinesAccepted }}
            accessibilityLabel="Accept reporting guidelines"
            disabled={isSubmitting}
            onPress={handleGuidelinesChange}
            hitSlop={8}
            style={[
              styles.checkbox,
              guidelinesAccepted && styles.checkboxSelected,
              errors.guidelines && styles.checkboxWithError,
            ]}
          >
            {guidelinesAccepted ? (
              <Ionicons
                name="checkmark"
                size={15}
                color={Brand.white}
              />
            ) : null}
          </Pressable>

          <View style={styles.guidelinesTextContainer}>
            <Text style={styles.guidelinesText}>
              I confirm that this report is accurate and follows the
              SafeHer reporting guidelines.
            </Text>

            <Pressable
              accessibilityRole="link"
              disabled={isSubmitting}
              onPress={() => {
                router.push("/(tabs)/reporting-guidelines");
              }}
            >
              <Text style={styles.guidelinesLink}>
                Read reporting guidelines
              </Text>
            </Pressable>

            {errors.guidelines ? (
              <ErrorMessage message={errors.guidelines} />
            ) : null}
          </View>
        </View>

        {/* ---------- Actions ---------- */}
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleCancel}
            style={({ pressed }) => [
              styles.cancelButton,
              isSubmitting && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              isSubmitting && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Brand.white} />
            ) : (
              <>
                <Ionicons
                  name="paper-plane-outline"
                  size={18}
                  color={Brand.white}
                />
                <Text style={styles.submitButtonText}>
                  Submit Report
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={styles.privacyMessage}>
          Submitted reports are used only to improve community safety.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ErrorMessage({ message, compact = false }: ErrorMessageProps) {
  return (
    <View
      style={[
        styles.errorMessage,
        compact && styles.errorMessageCompact,
      ]}
    >
      <Ionicons
        name="alert-circle"
        size={15}
        color={Brand.burgundy}
      />
      <Text style={styles.errorMessageText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.cream,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 44,
  },

  /* ---------- Header ---------- */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.blush,
    marginRight: 13,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: Brand.ink,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  subtitle: {
    color: Brand.muted,
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 3,
  },

  /* ---------- Safety Notice ---------- */
  safetyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Brand.blush,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  safetyNoticeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Brand.white,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyNoticeText: {
    flex: 1,
    color: Brand.burgundyDeep,
    fontSize: 12.5,
    lineHeight: 18.5,
    marginLeft: 10,
    marginTop: 4,
  },

  /* ---------- Recent Incidents ---------- */
  recentIncidentsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    padding: 14,
    marginBottom: 15,
    shadowColor: "#4E1026",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  recentIncidentsIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Brand.blush,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  recentIncidentsTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  recentIncidentsTitle: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  recentIncidentsDescription: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  /* ---------- Error Summary ---------- */
  errorSummary: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FCE8EC",
    borderWidth: 1,
    borderColor: Brand.rose,
    borderRadius: 16,
    padding: 13,
    marginBottom: 15,
  },
  errorSummaryText: {
    flex: 1,
    color: Brand.burgundyDeep,
    fontSize: 12.5,
    lineHeight: 18.5,
    marginLeft: 9,
    fontWeight: "600",
  },

  /* ---------- Section ---------- */
  section: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#4E1026",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionWithError: {
    borderColor: Brand.rose,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: Brand.ink,
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: -0.1,
  },
  required: {
    color: Brand.burgundy,
    fontSize: 11,
    fontWeight: "800",
    backgroundColor: Brand.blush,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    letterSpacing: 0.2,
    overflow: "hidden",
  },
  optional: {
    color: Brand.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  sectionDescription: {
    color: Brand.muted,
    fontSize: 12.5,
    lineHeight: 18.5,
    marginTop: 6,
    marginBottom: 14,
  },

  /* ---------- Category Grid ---------- */
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  categoryCard: {
    width: "48%",
    minHeight: 100,
    backgroundColor: Brand.cream,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    padding: 12,
    justifyContent: "center",
    position: "relative",
  },
  categoryCardSelected: {
    backgroundColor: Brand.blush,
    borderColor: Brand.burgundy,
    borderWidth: 2,
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    color: Brand.ink,
    fontSize: 12.5,
    fontWeight: "700",
  },
  categoryLabelSelected: {
    color: Brand.burgundyDeep,
    fontWeight: "800",
  },
  selectedCheck: {
    position: "absolute",
    right: 9,
    top: 9,
  },

  /* ---------- Description ---------- */
  descriptionInput: {
    minHeight: 125,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    backgroundColor: Brand.cream,
    color: Brand.ink,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  inputWithError: {
    borderColor: Brand.rose,
  },
  descriptionFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 7,
  },
  descriptionErrorContainer: {
    flex: 1,
    paddingRight: 8,
  },
  characterCount: {
    color: Brand.muted,
    fontSize: 11.5,
    fontWeight: "600",
  },
  characterCountLimit: {
    color: Brand.burgundy,
    fontWeight: "800",
  },

  /* ---------- Location ---------- */
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    backgroundColor: Brand.cream,
    padding: 13,
  },
  locationButtonSelected: {
    borderColor: Brand.burgundy,
    backgroundColor: Brand.blush,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.blush,
  },
  locationIconSelected: {
    backgroundColor: Brand.burgundy,
  },
  locationTextContainer: {
    flex: 1,
    marginHorizontal: 11,
  },
  locationTitle: {
    color: Brand.ink,
    fontSize: 13.5,
    fontWeight: "800",
  },
  locationDescription: {
    color: Brand.muted,
    fontSize: 11.5,
    marginTop: 3,
    lineHeight: 16,
  },
  locationConfirmation: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Brand.blush,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginTop: 10,
  },
  locationConfirmationText: {
    flex: 1,
    color: Brand.burgundyDeep,
    fontSize: 12,
    lineHeight: 17,
    marginLeft: 7,
  },
  locationFailure: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FCE8EC",
    borderRadius: 12,
    padding: 11,
    marginTop: 10,
  },
  locationFailureTextContainer: {
    flex: 1,
    marginLeft: 7,
  },
  locationFailureText: {
    color: Brand.burgundyDeep,
    fontSize: 12,
    lineHeight: 17,
  },
  retryLocationButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  retryLocationText: {
    color: Brand.burgundy,
    fontSize: 12,
    fontWeight: "800",
    textDecorationLine: "underline",
  },

  /* ---------- Anonymous ---------- */
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#4E1026",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  optionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.blush,
    marginRight: 11,
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  optionTitle: {
    color: Brand.ink,
    fontSize: 14.5,
    fontWeight: "800",
  },
  optionDescription: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  /* ---------- Guidelines ---------- */
  guidelinesCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#4E1026",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Brand.rose,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    marginTop: 1,
  },
  checkboxSelected: {
    backgroundColor: Brand.burgundy,
    borderColor: Brand.burgundy,
  },
  checkboxWithError: {
    borderColor: Brand.burgundy,
  },
  guidelinesTextContainer: {
    flex: 1,
  },
  guidelinesText: {
    color: Brand.ink,
    fontSize: 12.5,
    lineHeight: 18.5,
  },
  guidelinesLink: {
    color: Brand.burgundy,
    fontSize: 12.5,
    fontWeight: "800",
    textDecorationLine: "underline",
    marginTop: 7,
  },

  /* ---------- Errors ---------- */
  errorMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  errorMessageCompact: {
    marginTop: 0,
  },
  errorMessageText: {
    flex: 1,
    color: Brand.burgundy,
    fontSize: 11.5,
    lineHeight: 16.5,
    fontWeight: "600",
    marginLeft: 5,
  },

  /* ---------- Actions ---------- */
  actionRow: {
    flexDirection: "row",
    gap: 11,
  },
  cancelButton: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: Brand.burgundy,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.white,
  },
  cancelButtonText: {
    color: Brand.burgundy,
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  submitButton: {
    flex: 1.55,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: Brand.burgundy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Brand.burgundy,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: Brand.white,
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.78,
  },
  privacyMessage: {
    color: Brand.muted,
    fontSize: 11.5,
    lineHeight: 16.5,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 18,
  },
});
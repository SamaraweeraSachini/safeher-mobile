import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  useState,
} from 'react';
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
} from 'react-native';

import { Brand } from '@/constants/brand';
import {
  INCIDENT_CATEGORIES,
} from '@/constants/incident-categories';
import type {
  IncidentCategoryId,
} from '@/src/types/incident';

const DESCRIPTION_LIMIT = 500;

export default function ReportScreen() {
  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<IncidentCategoryId | null>(null);

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    reportAnonymously,
    setReportAnonymously,
  ] = useState(true);

  const [
    guidelinesAccepted,
    setGuidelinesAccepted,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const handleSelectLocation = () => {
    Alert.alert(
      'Location selection',
      'Current-location selection will be connected in SAFE-62.'
    );
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setDescription('');
    setReportAnonymously(true);
    setGuidelinesAccepted(false);
  };

  const handleCancel = () => {
    const hasEnteredInformation =
      selectedCategory !== null ||
      description.trim().length > 0 ||
      guidelinesAccepted;

    if (!hasEnteredInformation) {
      resetForm();
      return;
    }

    Alert.alert(
      'Clear incident report?',
      'The information entered in this form will be removed.',
      [
        {
          text: 'Keep Editing',
          style: 'cancel',
        },
        {
          text: 'Clear Form',
          style: 'destructive',
          onPress: resetForm,
        },
      ]
    );
  };

  const handleSubmit = () => {
    /*
     * SAFE-60 creates the complete form interface.
     * Validation will be implemented in SAFE-61 and Firestore submission
     * will be implemented in SAFE-63.
     */
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      Alert.alert(
        'Form interface complete',
        'Form validation and submission will be connected in the next incident-reporting tasks.'
      );
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="warning-outline"
              size={27}
              color={Brand.burgundy}
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              Report an Incident
            </Text>

            <Text style={styles.subtitle}>
              Share safety information to help protect the community.
            </Text>
          </View>
        </View>

        <View style={styles.safetyNotice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={22}
            color={Brand.burgundy}
          />

          <Text style={styles.safetyNoticeText}>
            If you are in immediate danger, contact emergency services or
            use the SafeHer SOS feature.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Incident type
            </Text>

            <Text style={styles.required}>
              Required
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            Select the option that best describes the safety concern.
          </Text>

          <View style={styles.categoryGrid}>
            {INCIDENT_CATEGORIES.map((category) => {
              const isSelected =
                selectedCategory === category.id;

              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isSelected,
                  }}
                  accessibilityLabel={`${category.label} incident type`}
                  onPress={() => {
                    setSelectedCategory(category.id);
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
                      {
                        backgroundColor:
                          category.backgroundColor,
                      },
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
                      isSelected &&
                        styles.categoryLabelSelected,
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
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Description
            </Text>

            <Text style={styles.optional}>
              Optional
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            Briefly explain what happened without including sensitive
            personal information.
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the incident or safety concern..."
            placeholderTextColor={Brand.muted}
            multiline
            maxLength={DESCRIPTION_LIMIT}
            textAlignVertical="top"
            editable={!isSubmitting}
            style={styles.descriptionInput}
            accessibilityLabel="Incident description"
          />

          <Text style={styles.characterCount}>
            {description.length}/{DESCRIPTION_LIMIT}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Incident location
            </Text>

            <Text style={styles.required}>
              Required
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            Add the location where the incident or safety concern occurred.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select incident location"
            disabled={isSubmitting}
            onPress={handleSelectLocation}
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.locationIcon}>
              <Ionicons
                name="location-outline"
                size={23}
                color={Brand.burgundy}
              />
            </View>

            <View style={styles.locationTextContainer}>
              <Text style={styles.locationTitle}>
                Use current location
              </Text>

              <Text style={styles.locationDescription}>
                No location selected
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={Brand.muted}
            />
          </Pressable>
        </View>

        <View style={styles.optionCard}>
          <View style={styles.optionIcon}>
            <Ionicons
              name="person-outline"
              size={23}
              color={Brand.burgundy}
            />
          </View>

          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>
              Report anonymously
            </Text>

            <Text style={styles.optionDescription}>
              Your name and email will not be publicly displayed.
            </Text>
          </View>

          <Switch
            value={reportAnonymously}
            onValueChange={setReportAnonymously}
            disabled={isSubmitting}
            trackColor={{
              false: Brand.line,
              true: Brand.roseSoft,
            }}
            thumbColor={
              reportAnonymously
                ? Brand.burgundy
                : Brand.white
            }
            accessibilityLabel="Report anonymously"
          />
        </View>

        <View style={styles.guidelinesCard}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: guidelinesAccepted,
            }}
            accessibilityLabel="Accept reporting guidelines"
            disabled={isSubmitting}
            onPress={() => {
              setGuidelinesAccepted(
                (currentValue) => !currentValue
              );
            }}
            hitSlop={8}
            style={[
              styles.checkbox,
              guidelinesAccepted &&
                styles.checkboxSelected,
            ]}
          >
            {guidelinesAccepted ? (
              <Ionicons
                name="checkmark"
                size={17}
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
                router.push(
                  '/(tabs)/reporting-guidelines'
                );
              }}
            >
              <Text style={styles.guidelinesLink}>
                Read reporting guidelines
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleCancel}
            style={({ pressed }) => [
              styles.cancelButton,
              isSubmitting &&
                styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              isSubmitting &&
                styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator
                size="small"
                color={Brand.white}
              />
            ) : (
              <>
                <Ionicons
                  name="paper-plane-outline"
                  size={19}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
    marginRight: 13,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: Brand.ink,
    fontSize: 25,
    fontWeight: '800',
  },
  subtitle: {
    color: Brand.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Brand.blush,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  safetyNoticeText: {
    flex: 1,
    color: Brand.burgundyDeep,
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 10,
  },
  section: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Brand.ink,
    fontSize: 17,
    fontWeight: '700',
  },
  required: {
    color: Brand.burgundy,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: Brand.blush,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  optional: {
    color: Brand.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionDescription: {
    color: Brand.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    minHeight: 96,
    backgroundColor: Brand.cream,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
    position: 'relative',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    color: Brand.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryLabelSelected: {
    color: Brand.burgundyDeep,
  },
  selectedCheck: {
    position: 'absolute',
    right: 9,
    top: 9,
  },
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
  characterCount: {
    color: Brand.muted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 7,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 15,
    backgroundColor: Brand.cream,
    padding: 13,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
  },
  locationTextContainer: {
    flex: 1,
    marginHorizontal: 11,
  },
  locationTitle: {
    color: Brand.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  locationDescription: {
    color: Brand.muted,
    fontSize: 12,
    marginTop: 3,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
  },
  optionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blush,
    marginRight: 11,
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  optionTitle: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  optionDescription: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  guidelinesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Brand.rose,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    marginTop: 1,
  },
  checkboxSelected: {
    backgroundColor: Brand.burgundy,
    borderColor: Brand.burgundy,
  },
  guidelinesTextContainer: {
    flex: 1,
  },
  guidelinesText: {
    color: Brand.ink,
    fontSize: 13,
    lineHeight: 19,
  },
  guidelinesLink: {
    color: Brand.burgundy,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
    marginTop: 7,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 11,
  },
  cancelButton: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Brand.burgundy,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.white,
  },
  cancelButtonText: {
    color: Brand.burgundy,
    fontSize: 15,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1.55,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Brand.burgundy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.75,
  },
  privacyMessage: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 18,
  },
});
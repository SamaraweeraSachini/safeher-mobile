import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Brand } from "@/constants/brand";

export default function ReportConfirmationScreen() {
  const handleViewSafetyMap = () => {
    router.navigate(
      "/(tabs)/safety-map"
    );
  };

  const handleReturnHome = () => {
    router.navigate(
      "/(tabs)"
    );
  };

  const handleSubmitAnotherReport = () => {
    router.navigate(
      "/(tabs)/report"
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Brand.cream}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successSection}>
          <View style={styles.successOuterCircle}>
            <View style={styles.successInnerCircle}>
              <Ionicons
                name="checkmark"
                size={46}
                color={Brand.white}
              />
            </View>
          </View>

          <Text style={styles.successTitle}>
            Report Submitted
          </Text>

          <Text style={styles.successDescription}>
            Thank you for helping make the SafeHer community safer.
            Your incident report was submitted successfully.
          </Text>
        </View>

        <View style={styles.communityCard}>
          <View style={styles.communityIcon}>
            <Ionicons
              name="people-outline"
              size={24}
              color={Brand.burgundy}
            />
          </View>

          <View style={styles.communityTextContainer}>
            <Text style={styles.communityTitle}>
              Helping the community
            </Text>

            <Text style={styles.communityDescription}>
              Your report can help other community members stay
              informed about safety concerns in the area.
            </Text>
          </View>
        </View>

        <View style={styles.privacyCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={24}
            color={Brand.burgundy}
          />

          <View style={styles.privacyTextContainer}>
            <Text style={styles.privacyTitle}>
              Your privacy matters
            </Text>

            <Text style={styles.privacyDescription}>
              SafeHer uses reports to improve community safety.
              Personal information is protected according to your
              reporting and privacy choices.
            </Text>
          </View>
        </View>

        <Text style={styles.actionsTitle}>
          What would you like to do next?
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View incident on Safety Map"
          onPress={handleViewSafetyMap}
          style={({ pressed }) => [
            styles.primaryAction,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.primaryActionIcon}>
            <Ionicons
              name="map-outline"
              size={23}
              color={Brand.white}
            />
          </View>

          <View style={styles.actionTextContainer}>
            <Text style={styles.primaryActionTitle}>
              View on Safety Map
            </Text>

            <Text style={styles.primaryActionDescription}>
              Open the community safety map.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color={Brand.white}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Submit another incident report"
          onPress={handleSubmitAnotherReport}
          style={({ pressed }) => [
            styles.secondaryAction,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.secondaryActionIcon}>
            <Ionicons
              name="add-circle-outline"
              size={23}
              color={Brand.burgundy}
            />
          </View>

          <View style={styles.actionTextContainer}>
            <Text style={styles.secondaryActionTitle}>
              Submit Another Report
            </Text>

            <Text style={styles.secondaryActionDescription}>
              Report another safety concern.
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color={Brand.burgundy}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to Home"
          onPress={handleReturnHome}
          style={({ pressed }) => [
            styles.homeButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="home-outline"
            size={20}
            color={Brand.burgundy}
          />

          <Text style={styles.homeButtonText}>
            Return Home
          </Text>
        </Pressable>

        <Text style={styles.footerText}>
          Thank you for contributing to a safer community.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.cream,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 40,
  },

  successSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  successOuterCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: Brand.blush,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  successInnerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Brand.burgundy,
    alignItems: "center",
    justifyContent: "center",
  },

  successTitle: {
    color: Brand.ink,
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
  },

  successDescription: {
    color: Brand.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    paddingHorizontal: 12,
  },

  communityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 19,
    padding: 16,
    marginBottom: 13,
  },

  communityIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: Brand.blush,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  communityTextContainer: {
    flex: 1,
  },

  communityTitle: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: "700",
  },

  communityDescription: {
    color: Brand.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Brand.blush,
    borderWidth: 1,
    borderColor: Brand.roseSoft,
    borderRadius: 19,
    padding: 16,
    marginBottom: 25,
  },

  privacyTextContainer: {
    flex: 1,
    marginLeft: 11,
  },

  privacyTitle: {
    color: Brand.burgundyDeep,
    fontSize: 15,
    fontWeight: "700",
  },

  privacyDescription: {
    color: Brand.burgundyDeep,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  actionsTitle: {
    color: Brand.ink,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 13,
  },

  primaryAction: {
    minHeight: 78,
    backgroundColor: Brand.burgundy,
    borderRadius: 19,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  primaryActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  actionTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  primaryActionTitle: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: "800",
  },

  primaryActionDescription: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 12,
    marginTop: 3,
  },

  secondaryAction: {
    minHeight: 78,
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 19,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  secondaryActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Brand.blush,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  secondaryActionTitle: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryActionDescription: {
    color: Brand.muted,
    fontSize: 12,
    marginTop: 3,
  },

  homeButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Brand.burgundy,
    borderRadius: 16,
    backgroundColor: Brand.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  homeButtonText: {
    color: Brand.burgundy,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },

  pressed: {
    opacity: 0.75,
  },

  footerText: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 18,
  },
});
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

type GuidelineItemProps = {
  icon:
    | "checkmark-circle-outline"
    | "shield-checkmark-outline"
    | "eye-off-outline"
    | "ban-outline"
    | "person-outline"
    | "warning-outline";
  title: string;
  description: string;
  important?: boolean;
};

function GuidelineItem({
  icon,
  title,
  description,
  important = false,
}: GuidelineItemProps) {
  return (
    <View
      style={[
        styles.guidelineCard,
        important && styles.importantCard,
      ]}
    >
      <View
        style={[
          styles.guidelineIcon,
          important && styles.importantIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={23}
          color={
            important
              ? Brand.burgundy
              : Brand.burgundyDeep
          }
        />
      </View>

      <View style={styles.guidelineContent}>
        <Text style={styles.guidelineTitle}>
          {title}
        </Text>

        <Text style={styles.guidelineDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export default function ReportingGuidelinesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Brand.cream}
      />

      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to incident report"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={Brand.ink}
            />
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Reporting Guidelines
            </Text>

            <Text style={styles.headerSubtitle}>
              Report responsibly and protect privacy
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Ionicons
                name="document-text-outline"
                size={30}
                color={Brand.burgundy}
              />
            </View>

            <Text style={styles.introTitle}>
              Help keep reports safe and useful
            </Text>

            <Text style={styles.introDescription}>
              SafeHer incident reports help the community
              understand safety concerns. Please follow these
              guidelines before submitting a report.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Responsible reporting
          </Text>

          <GuidelineItem
            icon="checkmark-circle-outline"
            title="Report accurate information"
            description="Only report information that you believe is true. Describe what happened as clearly and accurately as possible."
          />

          <GuidelineItem
            icon="shield-checkmark-outline"
            title="Respect people's privacy"
            description="Do not include unnecessary personal information such as full names, phone numbers, home addresses, email addresses or other identifying details."
          />

          <GuidelineItem
            icon="eye-off-outline"
            title="Protect victims and witnesses"
            description="Never expose private or sensitive information about a victim, witness or another person involved in an incident."
          />

          <GuidelineItem
            icon="ban-outline"
            title="No false or misleading reports"
            description="Do not knowingly submit false, exaggerated or misleading information. Reports should be made only for genuine safety concerns."
          />

          <GuidelineItem
            icon="person-outline"
            title="No offensive or harmful content"
            description="Reports must not contain abusive, threatening, discriminatory, sexually explicit or otherwise offensive content."
          />

          <Text style={styles.sectionTitle}>
            During an emergency
          </Text>

          <GuidelineItem
            icon="warning-outline"
            title="Immediate danger requires emergency help"
            description="SafeHer incident reporting is not a replacement for emergency services. If you or someone else is in immediate danger, contact the appropriate emergency service or use the SafeHer SOS feature."
            important
          />

          <View style={styles.privacyNotice}>
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color={Brand.burgundy}
            />

            <View style={styles.privacyNoticeContent}>
              <Text style={styles.privacyNoticeTitle}>
                Privacy reminder
              </Text>

              <Text style={styles.privacyNoticeText}>
                Share only the information needed to describe
                the safety concern. Avoid details that could
                unnecessarily identify or endanger another
                person.
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Before you submit
            </Text>

            <View style={styles.summaryRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={Brand.burgundy}
              />

              <Text style={styles.summaryText}>
                Make sure the report is accurate.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={Brand.burgundy}
              />

              <Text style={styles.summaryText}>
                Remove unnecessary personal information.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={Brand.burgundy}
              />

              <Text style={styles.summaryText}>
                Keep the description respectful and relevant.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to incident report"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.returnButton,
              pressed && styles.returnButtonPressed,
            ]}
          >
            <Ionicons
              name="arrow-back-outline"
              size={19}
              color={Brand.white}
            />

            <Text style={styles.returnButtonText}>
              Return to Report
            </Text>
          </Pressable>

          <Text style={styles.footerText}>
            By submitting an incident report, you confirm that
            the information follows these reporting guidelines.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.cream,
  },

  screen: {
    flex: 1,
    backgroundColor: Brand.cream,
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Brand.white,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.blush,
  },

  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },

  headerTitle: {
    color: Brand.ink,
    fontSize: 20,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: Brand.muted,
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },

  headerSpacer: {
    width: 42,
  },

  pressed: {
    opacity: 0.7,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },

  introCard: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
    marginBottom: 22,
  },

  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Brand.blush,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  introTitle: {
    color: Brand.ink,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  introDescription: {
    color: Brand.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },

  sectionTitle: {
    color: Brand.ink,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 2,
  },

  guidelineCard: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  importantCard: {
    borderColor: Brand.rose,
    backgroundColor: Brand.blush,
  },

  guidelineIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Brand.blush,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  importantIcon: {
    backgroundColor: Brand.white,
  },

  guidelineContent: {
    flex: 1,
  },

  guidelineTitle: {
    color: Brand.ink,
    fontSize: 15,
    fontWeight: "700",
  },

  guidelineDescription: {
    color: Brand.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  privacyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Brand.blush,
    borderRadius: 18,
    padding: 15,
    marginTop: 5,
    marginBottom: 18,
  },

  privacyNoticeContent: {
    flex: 1,
    marginLeft: 11,
  },

  privacyNoticeTitle: {
    color: Brand.burgundyDeep,
    fontSize: 14,
    fontWeight: "800",
  },

  privacyNoticeText: {
    color: Brand.burgundyDeep,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  summaryCard: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },

  summaryTitle: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },

  summaryText: {
    flex: 1,
    color: Brand.muted,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 8,
  },

  returnButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Brand.burgundy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  returnButtonPressed: {
    opacity: 0.78,
  },

  returnButtonText: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },

  footerText: {
    color: Brand.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 12,
  },
});


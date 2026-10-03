import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


import { firestore } from "@/src/config/firebase";
import { useAuth } from "@/src/context/AuthContext";
import SosHoldButton from "@/src/components/sos/SosHoldButton";

type ContactPreview = {
  id: string;
  name: string;
  relationship: string;
};

type LocationStatus =
  | "checking"
  | "available"
  | "permission-needed"
  | "unavailable";

export default function SosScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>("checking");
  const [contacts, setContacts] = useState<ContactPreview[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const checkLocation = useCallback(async () => {
    setLocationStatus("checking");

    try {
      const enabled = await Location.hasServicesEnabledAsync();

      if (!enabled) {
        setLocationStatus("unavailable");
        return;
      }

      const permission = await Location.getForegroundPermissionsAsync();

      setLocationStatus(permission.granted ? "available" : "permission-needed");
    } catch {
      setLocationStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    void checkLocation();
  }, [checkLocation]);

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setContacts([]);
      setContactsError(null);
      setContactsLoading(false);
      return;
    }

    let active = true;

    setContactsLoading(true);
    setContactsError(null);

    getDocs(collection(firestore, "users", user.uid, "trustedContacts"))
      .then((snapshot) => {
        if (!active) return;

        const items = snapshot.docs.map((document) => {
          const data = document.data();

          return {
            id: document.id,
            name: typeof data.name === "string" ? data.name.trim() : "",
            relationship:
              typeof data.relationship === "string"
                ? data.relationship.trim()
                : "",
          };
        });

        setContacts(items.filter((item) => item.name.length > 0));
      })
      .catch(() => {
        if (active) {
          setContacts([]);
          setContactsError(
            "Could not load trusted contacts. Check your connection and try again.",
          );
        }
      })
      .finally(() => {
        if (active) setContactsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, refresh]);

  const locationMessages: Record<LocationStatus, string> = {
    checking: "Checking location availability...",
    available:
      "Location permission is available. Your position will be checked when SOS is activated.",
    "permission-needed":
      "Location permission is needed to include your position. You can still call for help without it.",
    unavailable:
      "Location is unavailable right now. You can still call for help without it.",
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.back}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#5A3D4D" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>SOS assistance</Text>

        <Text style={styles.intro}>
          Prepare an emergency-support request. If you are in immediate danger,
          contact emergency services directly.
        </Text>

        <View style={styles.hero}>
          <SosHoldButton onConfirm={() => undefined} />

          <Text style={styles.instruction}>
            Press and hold for three seconds, then confirm to activate a
            prototype SOS request.
          </Text>
          
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current location</Text>

          <Text style={styles.body}>{locationMessages[locationStatus]}</Text>

          {locationStatus === "checking" && (
            <ActivityIndicator color="#C43D74" />
          )}

          <Pressable
            style={styles.action}
            onPress={() => void checkLocation()}
            accessibilityRole="button"
            accessibilityLabel="Check location availability again"
          >
            <Text style={styles.actionText}>Check availability</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trusted contacts</Text>

          {authLoading || contactsLoading ? (
            <ActivityIndicator color="#C43D74" />
          ) : contactsError ? (
            <>
              <Text style={styles.body}>{contactsError}</Text>

              <Pressable
                style={styles.action}
                onPress={() => setRefresh((n) => n + 1)}
                accessibilityRole="button"
                accessibilityLabel="Retry loading trusted contacts"
              >
                <Text style={styles.actionText}>Try again</Text>
              </Pressable>
            </>
          ) : !user || user.isAnonymous ? (
            <Text style={styles.body}>
              Sign in with a registered account to see saved contacts.
            </Text>
          ) : contacts.length === 0 ? (
            <Text style={styles.body}>
              No trusted contacts have been added. You can still access
              emergency services.
            </Text>
          ) : (
            contacts.map((contact) => (
              <Text key={contact.id} style={styles.contact}>
                {contact.name}
                {contact.relationship ? ` · ${contact.relationship}` : ""}
              </Text>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergency services</Text>

          <Text style={styles.body}>
            Emergency-service quick-call actions will appear here when verified
            numbers are added. If you need immediate assistance, use your phone
            dialer now.
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            SafeHer SOS is an academic prototype. Opening this screen does not
            send an alert, contact trusted people, or notify emergency services.
            Do not rely on SafeHer as your only way to get help.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8FB",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },

  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 44,
  },

  backText: {
    color: "#5A3D4D",
    fontSize: 15,
    fontWeight: "700",
  },

  title: {
    marginTop: 8,
    color: "#32252B",
    fontSize: 28,
    fontWeight: "900",
  },

  intro: {
    marginTop: 8,
    color: "#5D4B53",
    fontSize: 14,
    lineHeight: 21,
  },

  hero: {
    alignItems: "center",
    paddingVertical: 26,
  },

  instruction: {
    marginTop: 18,
    color: "#32252B",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },

  card: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },

  cardTitle: {
    marginBottom: 8,
    color: "#32252B",
    fontSize: 17,
    fontWeight: "800",
  },

  body: {
    color: "#5D4B53",
    fontSize: 14,
    lineHeight: 20,
  },

  contact: {
    color: "#32252B",
    fontSize: 14,
    paddingVertical: 7,
  },

  action: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 8,
  },

  actionText: {
    color: "#A92F61",
    fontSize: 14,
    fontWeight: "700",
  },

  disclaimer: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFF3D6",
  },

  disclaimerText: {
    color: "#5D4B53",
    fontSize: 12,
    lineHeight: 18,
  },
});

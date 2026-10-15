import type { PreparedSos } from "@/src/services/sos-preparation-service";

export function generateEmergencyMessage(activation: PreparedSos): string {
  const location = activation.location;

  const locationText = location?.mapsLink
    ? [
        `Location: ${location.mapsLink}`,
        "This location was captured during SOS preparation and is not live tracking.",
      ].join("\n")
    : "Location unavailable. Please contact me to confirm where I am.";

  return [
    "SafeHer SOS - PROTOTYPE TEST MESSAGE",
    "",
    "I am requesting assistance. Please contact me.",
    "",
    `SOS activation time: ${activation.activatedAt} (UTC)`,
    "",
    locationText,
    "",
    "This message was prepared by the SafeHer academic prototype.",
    "SafeHer has not automatically contacted emergency services.",
  ].join("\n");
}

export type CheckInInterval =
  | 15
  | 30
  | 45
  | 60;

export interface JourneyTrustedContact {
  id: string;
  name: string;
}

export interface SafeJourneyConfiguration {
  destination: string;
  expectedArrivalTime: Date;
  trustedContactIds: string[];
  checkInIntervalMinutes: CheckInInterval;
  shareJourney: boolean;
}
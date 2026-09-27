export type CheckInInterval =
  | 15
  | 30
  | 45
  | 60;

export interface JourneyTrustedContact {
  id: string;
  name: string;
}

export interface JourneyLocation {
  latitude: number;
  longitude: number;
}

export interface SafeJourneyConfiguration {
  destination: string;
  destinationLocation?: JourneyLocation | null;
  currentLocation: JourneyLocation;
  expectedArrivalTime: Date;
  trustedContactIds: string[];
  checkInIntervalMinutes: CheckInInterval;
  shareJourney: boolean;
}

export type SafeJourneyStatus =
  | 'active'
  | 'completed'
  | 'cancelled';

export interface StoredSafeJourney {
  id: string;
  userId: string;
  destination: string;
  destinationLocation?: JourneyLocation | null;
  currentLocation: JourneyLocation;
  expectedArrivalTime: Date;
  trustedContactIds: string[];
  checkInIntervalMinutes: CheckInInterval;
  shareJourney: boolean;
  status: SafeJourneyStatus;
  createdAt: Date;
}
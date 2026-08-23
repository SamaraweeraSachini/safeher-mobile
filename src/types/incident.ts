import type { Timestamp } from 'firebase/firestore';

/**
 * The centrally supported incident-category identifiers.
 *
 * Display labels and visual information for these identifiers are stored in
 * constants/incident-categories.ts.
 */
export type IncidentCategoryId =
  | 'harassment'
  | 'stalking'
  | 'poor-lighting'
  | 'unsafe-transport'
  | 'assault'
  | 'suspicious-activity'
  | 'other';

/**
 * Describes the current moderation/display state of an incident.
 */
export type IncidentStatus =
  | 'active'
  | 'resolved'
  | 'removed';

/**
 * Geographic coordinates attached to an incident report.
 */
export interface IncidentCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Shared Incident model used when reading an incident from Firestore.
 */
export interface Incident {
  id: string;
  type: IncidentCategoryId;
  description: string;
  coordinates: IncidentCoordinates;
  anonymous: boolean;
  status: IncidentStatus;
  creatorUid: string;
  createdAt: Timestamp | null;
}

/**
 * Data collected from the Report Incident form before it is written to
 * Firestore.
 *
 * Firestore generates the document ID and server timestamp during submission.
 */
export interface CreateIncidentInput {
  type: IncidentCategoryId;
  description: string;
  coordinates: IncidentCoordinates;
  anonymous: boolean;
}

/**
 * Category information displayed by the user interface.
 */
export interface IncidentCategory {
  id: IncidentCategoryId;
  label: string;
  description: string;
  icon:
    | 'hand-left-outline'
    | 'eye-outline'
    | 'bulb-outline'
    | 'bus-outline'
    | 'alert-circle-outline'
    | 'search-outline'
    | 'ellipsis-horizontal-circle-outline';
  color: string;
  backgroundColor: string;
}
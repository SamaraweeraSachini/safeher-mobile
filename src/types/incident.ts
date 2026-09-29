import type { Timestamp } from 'firebase/firestore';

export type IncidentCategoryId =
  | 'harassment'
  | 'stalking'
  | 'poor-lighting'
  | 'unsafe-transport'
  | 'assault'
  | 'suspicious-activity'
  | 'other';

export type IncidentStatus =
  | 'active'
  | 'under-review'
  | 'resolved'
  | 'removed';

export interface IncidentCoordinates {
  latitude: number;
  longitude: number;
}

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

export interface CreateIncidentInput {
  type: IncidentCategoryId;
  description: string;
  coordinates: IncidentCoordinates;
  anonymous: boolean;
}

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
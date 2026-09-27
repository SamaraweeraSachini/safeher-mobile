import type {
  CheckInInterval,
  JourneyTrustedContact,
} from '@/src/types/safe-journey';

export const CHECK_IN_INTERVALS: CheckInInterval[] = [
  15,
  30,
  45,
  60,
];

/**
 * Temporary reusable contact source until the dedicated
 * Trusted Contacts feature provides persisted contacts.
 */
export const JOURNEY_TRUSTED_CONTACTS: JourneyTrustedContact[] = [
  {
    id: 'contact-1',
    name: 'Primary Contact',
  },
  {
    id: 'contact-2',
    name: 'Secondary Contact',
  },
];
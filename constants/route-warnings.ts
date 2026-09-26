import type { IncidentCategoryId } from '@/src/types/incident';
import type { RouteWarningLevel } from '@/src/types/route';

export const ROUTE_WARNING_RADIUS_METERS = 250;

const HIGH_CONCERN_TYPES: readonly IncidentCategoryId[] = [
  'assault',
  'harassment',
  'stalking',
];

const MODERATE_CONCERN_TYPES: readonly IncidentCategoryId[] = [
  'suspicious-activity',
  'unsafe-transport',
];

export function getWarningLevel(
  incidentType: IncidentCategoryId
): RouteWarningLevel {
  if (HIGH_CONCERN_TYPES.includes(incidentType)) {
    return 'concern';
  }

  if (MODERATE_CONCERN_TYPES.includes(incidentType)) {
    return 'caution';
  }

  return 'info';
}

type WarningLevelIcon =
  | 'information-circle-outline'
  | 'warning-outline'
  | 'alert-circle-outline';

export const ROUTE_WARNING_LEVEL_STYLES: Record<
  RouteWarningLevel,
  {
    label: string;
    color: string;
    backgroundColor: string;
    icon: WarningLevelIcon;
  }
> = {
  info: {
    label: 'Information',
    color: '#2E6DA4',
    backgroundColor: '#E7F1FA',
    icon: 'information-circle-outline',
  },
  caution: {
    label: 'Caution',
    color: '#C47A1A',
    backgroundColor: '#FFF3D6',
    icon: 'warning-outline',
  },
  concern: {
    label: 'Higher concern',
    color: '#B42318',
    backgroundColor: '#FDECEC',
    icon: 'alert-circle-outline',
  },
};

const WARNING_MESSAGE_TEMPLATES: Record<IncidentCategoryId, string> = {
  harassment: 'Harassment reported near this route.',
  stalking: 'Stalking reported near this route.',
  'poor-lighting': 'Poorly lit area reported along this route.',
  'unsafe-transport': 'Unsafe transport experience reported nearby.',
  assault: 'Assault reported near this route.',
  'suspicious-activity': 'Suspicious activity reported nearby.',
  other: 'A safety concern was reported near this route.',
};

export function getWarningMessage(
  incidentType: IncidentCategoryId
): string {
  return WARNING_MESSAGE_TEMPLATES[incidentType];
}

const WARNING_GUIDANCE_TEMPLATES: Record<IncidentCategoryId, string> = {
  harassment:
    'Stay alert and avoid isolated areas where possible.',
  stalking:
    'Stay alert and consider a more public alternative route.',
  'poor-lighting':
    'Consider taking a well-lit alternative route.',
  'unsafe-transport':
    'Use caution around this area.',
  assault:
    'Stay alert and consider an alternative route.',
  'suspicious-activity':
    'Stay aware of your surroundings in this area.',
  other:
    'Stay alert and consider an alternative route if you feel unsafe.',
};

export function getWarningGuidance(
  incidentType: IncidentCategoryId
): string {
  return WARNING_GUIDANCE_TEMPLATES[incidentType];
}
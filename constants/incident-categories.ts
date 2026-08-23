import { Brand } from '@/constants/brand';
import type {
  IncidentCategory,
  IncidentCategoryId,
} from '@/src/types/incident';

export const INCIDENT_CATEGORIES: readonly IncidentCategory[] = [
  {
    id: 'harassment',
    label: 'Harassment',
    description: 'Unwanted, threatening or inappropriate behaviour.',
    icon: 'hand-left-outline',
    color: Brand.burgundy,
    backgroundColor: Brand.blush,
  },
  {
    id: 'stalking',
    label: 'Stalking',
    description: 'Someone repeatedly following or monitoring another person.',
    icon: 'eye-outline',
    color: '#8A3E63',
    backgroundColor: '#F7E9F0',
  },
  {
    id: 'poor-lighting',
    label: 'Poor Lighting',
    description: 'An area that feels unsafe because it is dark or poorly lit.',
    icon: 'bulb-outline',
    color: '#9A6918',
    backgroundColor: '#FFF3D6',
  },
  {
    id: 'unsafe-transport',
    label: 'Unsafe Transport',
    description: 'An unsafe experience involving public or private transport.',
    icon: 'bus-outline',
    color: '#9B4D3F',
    backgroundColor: '#FBEAE6',
  },
  {
    id: 'assault',
    label: 'Assault',
    description: 'Physical violence or an attempted physical attack.',
    icon: 'alert-circle-outline',
    color: '#A63046',
    backgroundColor: '#FCE8EC',
  },
  {
    id: 'suspicious-activity',
    label: 'Suspicious Activity',
    description: 'Behaviour or activity that may place people at risk.',
    icon: 'search-outline',
    color: '#6C4A82',
    backgroundColor: '#F1EAF6',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Another safety concern that does not match the listed types.',
    icon: 'ellipsis-horizontal-circle-outline',
    color: Brand.muted,
    backgroundColor: '#F3EEF0',
  },
] as const;

/**
 * Returns the complete category information for a category ID.
 */
export function getIncidentCategory(
  categoryId: IncidentCategoryId
): IncidentCategory | undefined {
  return INCIDENT_CATEGORIES.find(
    (category) => category.id === categoryId
  );
}

/**
 * Returns the user-facing category label.
 */
export function getIncidentCategoryLabel(
  categoryId: IncidentCategoryId
): string {
  return getIncidentCategory(categoryId)?.label ?? 'Other';
}

/**
 * Checks whether an unknown value is a supported category ID.
 */
export function isIncidentCategoryId(
  value: unknown
): value is IncidentCategoryId {
  return (
    typeof value === 'string' &&
    INCIDENT_CATEGORIES.some(
      (category) => category.id === value
    )
  );
}
import { Brand } from '@/constants/brand';
import type { SafetyLevel } from '@/src/services/safety-score-service';

export const SAFETY_LEVEL_STYLES: Record<
  SafetyLevel,
  {
    label: string;
    color: string;
    backgroundColor: string;
  }
> = {
  'lower-reported-risk': {
    label: 'Lower reported risk',
    color: '#2E7D32',
    backgroundColor: '#E7F5EA',
  },
  'moderate-reported-risk': {
    label: 'Moderate reported risk',
    color: '#9A6918',
    backgroundColor: '#FFF3D6',
  },
  'higher-reported-risk': {
    label: 'Higher reported risk',
    color: Brand.burgundy,
    backgroundColor: Brand.blush,
  },
};
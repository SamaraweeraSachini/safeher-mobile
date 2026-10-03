export const CONTENT_FLAG_REASONS = [
  'False information',
  'Offensive content',
  'Personal information exposed',
  'Duplicate report',
  'Unrelated content',
  'Other',
] as const;

export type ContentFlagReason = (typeof CONTENT_FLAG_REASONS)[number];

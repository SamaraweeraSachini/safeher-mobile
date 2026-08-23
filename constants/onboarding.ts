export type OnboardingSlide = {
  id: 'nearby' | 'report' | 'travel';
  eyebrow: string;
  title: string;
  body: string;
  highlight: string;
};

export const SAFETY_MESSAGE =
  'You deserve to feel safe — every step of the way.';

export const WELCOME_INTRO =
  'SafeHer helps you stay aware of nearby risks, report what you see, and plan safer journeys. Your privacy stays in your hands.';

export const EMERGENCY_DISCLAIMER =
  'SafeHer is a community safety companion, not an emergency service. In an emergency, contact local authorities immediately.';

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'nearby',
    eyebrow: 'Stay aware',
    title: 'Learn about nearby safety concerns',
    body: 'See community reports and safety context around you so you can choose safer streets, venues, and times of day.',
    highlight: 'Alerts are grouped by area, not by your identity.',
  },
  {
    id: 'report',
    eyebrow: 'Speak up safely',
    title: 'Report incidents anonymously',
    body: 'Share what happened in a few taps. We keep reports useful for others without exposing who you are.',
    highlight: 'Anonymous by default. You control what gets shared.',
  },
  {
    id: 'travel',
    eyebrow: 'Move with confidence',
    title: 'Travel using safety information',
    body: 'Use live safety context when you commute, meet someone, or travel somewhere new — so you can plan with more certainty.',
    highlight: 'Built for everyday movement, not just emergencies.',
  },
];

import {
  Redirect,
  type Href,
} from 'expo-router';

export default function OnboardingWelcomeRedirect() {
  return (
    <Redirect
      href={'/(onboarding)/tour' as Href}
    />
  );
}


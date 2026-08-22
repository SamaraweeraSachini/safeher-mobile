import {
  type Href,
  useRouter,
} from 'expo-router';
import { useCallback } from 'react';

export type SessionMode =
  | 'guest'
  | 'account';

export function useFinishOnboarding() {
  const router = useRouter();

  return useCallback(
    async (
      _sessionMode: SessionMode,
      href: Href
    ) => {
      router.replace(href);
    },
    [router]
  );
}


import { useSyncExternalStore } from 'react';

import type { RouteOption } from '@/src/types/route';

export type SelectedRouteReview = {
  originLabel: string;
  destinationLabel: string;
  route: RouteOption;
};

let selectedRouteReview: SelectedRouteReview | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function setSelectedRouteReview(
  review: SelectedRouteReview | null
) {
  selectedRouteReview = review;
  emitChange();
}

export function useSelectedRouteReview(): SelectedRouteReview | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selectedRouteReview,
    () => selectedRouteReview
  );
}

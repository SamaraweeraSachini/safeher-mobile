import { useMemo } from 'react';

import { useActiveIncidents } from '@/src/hooks/useRecentIncidents';
import { getRouteWarnings } from '@/src/services/route-warning-service';

import type { RouteOption, RouteWarning } from '@/src/types/route';

interface UseRouteWarningsResult {
  warnings: RouteWarning[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  incidentCount: number;
}

export function useRouteWarnings(
  route: RouteOption | null
): UseRouteWarningsResult {
  const { incidents, isLoading, error, retry } = useActiveIncidents();

  const warnings = useMemo(() => {
    if (!route) {
      return [];
    }

    return getRouteWarnings(route, incidents);
  }, [route, incidents]);

  return {
    warnings,
    isLoading,
    error,
    retry,
    incidentCount: incidents.length,
  };
}

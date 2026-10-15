import { useCallback, useEffect, useState } from 'react';

import {
  subscribeToReportWithdrawal,
  WithdrawalRequestError,
} from '@/src/services/report-withdrawal-service';

import type { ReportWithdrawalRequest } from '@/src/types/report-withdrawal';

export function useReportWithdrawal(
  userId: string | null,
  reportId: string | null,
  enabled: boolean
) {
  const [request, setRequest] = useState<ReportWithdrawalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const retry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !userId || !reportId) {
      setRequest(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToReportWithdrawal(
      userId,
      reportId,
      (nextRequest) => {
        if (!active) {
          return;
        }

        setRequest(nextRequest);
        setError(null);
        setIsLoading(false);
      },
      (retrievalError: WithdrawalRequestError) => {
        if (!active) {
          return;
        }

        setError(retrievalError.message);
        setIsLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, refreshKey, reportId, userId]);

  return { request, isLoading, error, retry };
}

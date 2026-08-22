import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  analyzeThreat,
  getModelInfo,
  getThreatAnalyticsOverview,
  getThreatCategoryDistribution,
  getThreatInvestigations,
  getThreatRiskDistribution,
  getUsageAnalytics,
} from "./client";
import type {
  ModelInfoResponse,
  RiskLevel,
  ThreatAnalysisResponse,
  ThreatAnalyticsOverviewResponse,
  ThreatCategoryDistributionResponse,
  ThreatInvestigationHistoryResponse,
  ThreatRiskDistributionResponse,
  UsageAnalyticsResponse,
} from "./types";

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export interface ThreatInvestigationQuery {
  page?: number;
  pageSize?: number;
  riskLevel?: RiskLevel;
  category?: string;
}

export interface UseThreatAnalysisResult
  extends AsyncState<ThreatAnalysisResponse> {
  analyze: (text: string, topK?: number) => Promise<ThreatAnalysisResponse>;
  reset: () => void;
}

export interface UseThreatInvestigationsResult
  extends AsyncState<ThreatInvestigationHistoryResponse> {
  refresh: (options?: ThreatInvestigationQuery) => Promise<void>;
}

export interface UseThreatOverviewResult
  extends AsyncState<ThreatAnalyticsOverviewResponse> {
  refresh: () => Promise<void>;
}

export interface UseThreatRiskDistributionResult
  extends AsyncState<ThreatRiskDistributionResponse> {
  refresh: () => Promise<void>;
}

export interface UseThreatCategoryDistributionResult
  extends AsyncState<ThreatCategoryDistributionResponse> {
  refresh: () => Promise<void>;
}

export interface UseModelInfoResult extends AsyncState<ModelInfoResponse> {
  refresh: () => Promise<void>;
}

export interface UseUsageAnalyticsResult
  extends AsyncState<UsageAnalyticsResponse> {
  refresh: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while contacting SentinelAI.";
}

function useAsyncData<T>(
  loader: () => Promise<T>,
): AsyncState<T> & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: true,
  });

  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;

    setState((currentState) => ({
      data: currentState.data,
      error: null,
      isLoading: true,
    }));

    try {
      const data = await loader();

      if (requestIdRef.current !== requestId) {
        return;
      }

      setState({
        data,
        error: null,
        isLoading: false,
      });
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setState((currentState) => ({
        data: currentState.data,
        error: getErrorMessage(error),
        isLoading: false,
      }));
    }
  }, [loader]);

  useEffect(() => {
    void refresh();

    return () => {
      requestIdRef.current += 1;
    };
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}

export function useThreatAnalysis(): UseThreatAnalysisResult {
  const [state, setState] = useState<AsyncState<ThreatAnalysisResponse>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const requestIdRef = useRef(0);

  const analyze = useCallback(
    async (
      text: string,
      topK = 6,
    ): Promise<ThreatAnalysisResponse> => {
      const requestId = requestIdRef.current + 1;

      requestIdRef.current = requestId;

      setState((currentState) => ({
        data: currentState.data,
        error: null,
        isLoading: true,
      }));

      try {
        const result = await analyzeThreat({
          text,
          top_k: topK,
        });

        if (requestIdRef.current === requestId) {
          setState({
            data: result,
            error: null,
            isLoading: false,
          });
        }

        return result;
      } catch (error) {
        if (requestIdRef.current === requestId) {
          setState((currentState) => ({
            data: currentState.data,
            error: getErrorMessage(error),
            isLoading: false,
          }));
        }

        throw error;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;

    setState({
      data: null,
      error: null,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}

export function useThreatInvestigations(
  initialQuery: ThreatInvestigationQuery = {},
): UseThreatInvestigationsResult {
  const queryRef = useRef<ThreatInvestigationQuery>(initialQuery);

  const [state, setState] = useState<
    AsyncState<ThreatInvestigationHistoryResponse>
  >({
    data: null,
    error: null,
    isLoading: true,
  });

  const requestIdRef = useRef(0);

  const refresh = useCallback(
    async (options?: ThreatInvestigationQuery): Promise<void> => {
      if (options) {
        queryRef.current = {
          ...queryRef.current,
          ...options,
        };
      }

      const requestId = requestIdRef.current + 1;

      requestIdRef.current = requestId;

      setState((currentState) => ({
        data: currentState.data,
        error: null,
        isLoading: true,
      }));

      try {
        const data = await getThreatInvestigations(queryRef.current);

        if (requestIdRef.current !== requestId) {
          return;
        }

        setState({
          data,
          error: null,
          isLoading: false,
        });
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setState((currentState) => ({
          data: currentState.data,
          error: getErrorMessage(error),
          isLoading: false,
        }));
      }
    },
    [],
  );

  useEffect(() => {
    void refresh();

    return () => {
      requestIdRef.current += 1;
    };
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}

export function useThreatOverview(): UseThreatOverviewResult {
  const loader = useCallback(
    () => getThreatAnalyticsOverview(),
    [],
  );

  return useAsyncData(loader);
}

export function useThreatRiskDistribution(): UseThreatRiskDistributionResult {
  const loader = useCallback(
    () => getThreatRiskDistribution(),
    [],
  );

  return useAsyncData(loader);
}

export function useThreatCategoryDistribution(): UseThreatCategoryDistributionResult {
  const loader = useCallback(
    () => getThreatCategoryDistribution(),
    [],
  );

  return useAsyncData(loader);
}

export function useModelInfo(): UseModelInfoResult {
  const loader = useCallback(
    () => getModelInfo(),
    [],
  );

  return useAsyncData(loader);
}

export function useUsageAnalytics(): UseUsageAnalyticsResult {
  const loader = useCallback(
    () => getUsageAnalytics(),
    [],
  );

  return useAsyncData(loader);
}
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  analyzeThreat,
  createPrediction,
  getHealth,
  getModelInfo,
  getThreatCategories,
  getThreatOverview,
  getThreatRiskDistribution,
  getThreatSignals,
  getThreatTimeline,
  getUsageAnalytics,
} from "./client";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    staleTime: 15_000,
  });
}

/**
 * Global model metadata.
 *
 * Available from macro zoom because it is lightweight
 * and belongs to the global intelligence layer.
 */
export function useModelInfo(
  enabled = true,
) {
  return useQuery({
    queryKey: ["model-info"],
    queryFn: getModelInfo,
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Global traffic aggregate.
 *
 * Available from macro zoom.
 */
export function useUsageAnalytics(
  enabled = true,
) {
  return useQuery({
    queryKey: ["usage-analytics"],
    queryFn: getUsageAnalytics,
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled
      ? 10_000
      : false,
  });
}

/**
 * Global threat aggregate.
 *
 * Available from macro zoom.
 */
export function useThreatOverview(
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "threat",
      "overview",
    ],
    queryFn: getThreatOverview,
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled
      ? 10_000
      : false,
  });
}

/**
 * Meso-level temporal intelligence.
 */
export function useThreatTimeline(
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "threat",
      "timeline",
    ],
    queryFn: () =>
      getThreatTimeline(),
    enabled,
    staleTime: 10_000,
  });
}
/**
 * Meso-level risk distribution.
 */
export function useThreatRiskDistribution(
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "threat",
      "risk-distribution",
    ],
    queryFn:
      getThreatRiskDistribution,
    enabled,
    staleTime: 10_000,
  });
}

/**
 * Meso-level category distribution.
 */
export function useThreatCategories(
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "threat",
      "categories",
    ],
    queryFn:
      getThreatCategories,
    enabled,
    staleTime: 10_000,
  });
}

/**
 * Micro-level signal intelligence.
 *
 * This is intentionally deferred until micro zoom.
 */
export function useThreatSignals(
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "threat",
      "signals",
    ],
    queryFn:
      getThreatSignals,
    enabled,
    staleTime: 15_000,
  });
}

export function useAnalyzeThreat() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      text,
      topK = 6,
    }: {
      text: string;
      topK?: number;
    }) =>
      analyzeThreat(
        text,
        topK,
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "threat",
            "overview",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "threat",
            "timeline",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "threat",
            "risk-distribution",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "threat",
            "categories",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "threat",
            "signals",
          ],
        }),
      ]);
    },
  });
}

export function useCreatePrediction() {
  return useMutation({
    mutationFn: createPrediction,
  });
}
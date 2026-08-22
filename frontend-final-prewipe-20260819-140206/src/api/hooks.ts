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

import type {
  ZoomLevel,
} from "../canvas/types";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
}

export function useModelInfo(
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["model-info"],
    queryFn: getModelInfo,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useUsageAnalytics(
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      "usage-analytics",
    ],
    queryFn: getUsageAnalytics,
    enabled,
    staleTime: 5_000,
    refetchInterval: enabled
      ? 10_000
      : false,
    refetchOnWindowFocus: false,
  });
}

export function useThreatOverview() {
  return useQuery({
    queryKey: [
      "threat",
      "overview",
    ],
    queryFn: getThreatOverview,
    enabled: true,
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
  });
}

export function useThreatTimeline(
  enabled: boolean,
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
    refetchOnWindowFocus: false,
  });
}

export function useThreatRiskDistribution(
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      "threat",
      "risk",
    ],
    queryFn:
      getThreatRiskDistribution,
    enabled,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}

export function useThreatCategories(
  enabled: boolean,
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
    refetchOnWindowFocus: false,
  });
}

export function useThreatSignals(
  enabled: boolean,
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
    refetchOnWindowFocus: false,
  });
}

export function useSpatialQueries(
  zoomLevel: ZoomLevel,
) {
  const meso =
    zoomLevel === "meso" ||
    zoomLevel === "micro";

  const micro =
    zoomLevel === "micro";

  return {
    overview:
      useThreatOverview(),

    model:
      useModelInfo(meso),

    usage:
      useUsageAnalytics(meso),

    timeline:
      useThreatTimeline(meso),

    risk:
      useThreatRiskDistribution(meso),

    categories:
      useThreatCategories(meso),

    signals:
      useThreatSignals(micro),
  };
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

    onSuccess:
      async () => {
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
              "risk",
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
    mutationFn:
      createPrediction,
  });
}

import type {
  HealthResponse,
  ModelAnalyticsResponse,
  ModelInfoResponse,
  PredictionHistoryResponse,
  PredictionRequest,
  PredictionResponse,
  ThreatAnalysisResponse,
  ThreatAnalyticsOverviewResponse,
  ThreatCategoryDistributionResponse,
  ThreatRiskDistributionResponse,
  ThreatSignalFrequencyResponse,
  ThreatTimelineResponse,
  UsageAnalyticsResponse,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}.`;

    try {
      const body = await response.json();

      if (Array.isArray(body?.detail)) {
        message = body.detail
          .map(
            (item: { msg?: string }) =>
              item.msg ?? "Invalid request.",
          )
          .join(" ");
      } else if (
        typeof body?.detail === "string"
      ) {
        message = body.detail;
      }
    } catch {
      // Keep the HTTP status message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function getModelInfo(): Promise<ModelInfoResponse> {
  return request<ModelInfoResponse>("/model/info");
}

export function getModelAnalytics(): Promise<ModelAnalyticsResponse> {
  return request<ModelAnalyticsResponse>(
    "/analytics/model",
  );
}

export function getUsageAnalytics(): Promise<UsageAnalyticsResponse> {
  return request<UsageAnalyticsResponse>(
    "/analytics/usage",
  );
}

export function createPrediction(
  payload: PredictionRequest,
): Promise<PredictionResponse> {
  return request<PredictionResponse>(
    "/predictions",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getPredictionHistory(
  page = 1,
  pageSize = 20,
  label?: "ham" | "spam",
): Promise<PredictionHistoryResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (label) {
    params.set("label", label);
  }

  return request<PredictionHistoryResponse>(
    `/predictions?${params.toString()}`,
  );
}

export function analyzeThreat(
  text: string,
  topK = 6,
): Promise<ThreatAnalysisResponse> {
  return request<ThreatAnalysisResponse>(
    "/threat/analyze",
    {
      method: "POST",
      body: JSON.stringify({
        text,
        top_k: topK,
      }),
    },
  );
}

export function getThreatOverview(): Promise<ThreatAnalyticsOverviewResponse> {
  return request<ThreatAnalyticsOverviewResponse>(
    "/threat/analytics/overview",
  );
}

export function getThreatRiskDistribution(): Promise<ThreatRiskDistributionResponse> {
  return request<ThreatRiskDistributionResponse>(
    "/threat/analytics/risk-distribution",
  );
}

export function getThreatCategories(): Promise<ThreatCategoryDistributionResponse> {
  return request<ThreatCategoryDistributionResponse>(
    "/threat/analytics/categories",
  );
}

export function getThreatSignals(): Promise<ThreatSignalFrequencyResponse> {
  return request<ThreatSignalFrequencyResponse>(
    "/threat/analytics/signals",
  );
}

export function getThreatTimeline(
  fromDate?: string,
  toDate?: string,
): Promise<ThreatTimelineResponse> {
  const params = new URLSearchParams();

  if (fromDate) {
    params.set("from_date", fromDate);
  }

  if (toDate) {
    params.set("to_date", toDate);
  }

  const query = params.toString();

  return request<ThreatTimelineResponse>(
    `/threat/analytics/timeline${
      query ? `?${query}` : ""
    }`,
  );
}

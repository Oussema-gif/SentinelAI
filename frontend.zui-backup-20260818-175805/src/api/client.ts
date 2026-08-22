import type {
  ModelAnalyticsResponse,
  ModelInfoResponse,
  PredictionHistoryResponse,
  PredictionRequest,
  PredictionResponse,
  ThreatAnalysisResponse,
  ThreatAnalyticsOverview,
  ThreatCategoryDistributionResponse,
  ThreatInvestigationHistoryResponse,
  ThreatRiskDistributionResponse,
  ThreatSignalFrequencyResponse,
  ThreatTimelineResponse,
  UsageAnalyticsResponse,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "/api";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...(options?.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}.`;

    try {
      const body =
        await response.json();

      if (
        Array.isArray(body?.detail)
      ) {
        message =
          body.detail
            .map(
              (
                item: {
                  msg?: string;
                },
              ) =>
                item.msg ??
                "Invalid request.",
            )
            .join(" ");
      } else if (
        typeof body?.detail ===
        "string"
      ) {
        message =
          body.detail;
      }
    } catch {
      // Keep HTTP status fallback.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

/* =========================================================
   PREDICTIONS
   ========================================================= */

export async function createPrediction(
  payload: PredictionRequest,
): Promise<PredictionResponse> {
  return request<PredictionResponse>(
    "/predictions",
    {
      method: "POST",
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function getPredictionHistory(
  page = 1,
  pageSize = 20,
  label?: "ham" | "spam",
): Promise<PredictionHistoryResponse> {
  const params =
    new URLSearchParams({
      page: String(page),
      page_size: String(
        pageSize,
      ),
    });

  if (label) {
    params.set(
      "label",
      label,
    );
  }

  return request<PredictionHistoryResponse>(
    `/predictions?${params.toString()}`,
  );
}

/* =========================================================
   MODEL
   ========================================================= */

export async function getModelInfo(): Promise<ModelInfoResponse> {
  return request<ModelInfoResponse>(
    "/model/info",
  );
}

export async function getModelAnalytics(): Promise<ModelAnalyticsResponse> {
  return request<ModelAnalyticsResponse>(
    "/analytics/model",
  );
}

export async function getUsageAnalytics(): Promise<UsageAnalyticsResponse> {
  return request<UsageAnalyticsResponse>(
    "/analytics/usage",
  );
}

/* =========================================================
   SYSTEM
   ========================================================= */

export async function getHealth(): Promise<{
  status: string;
}> {
  return request<{
    status: string;
  }>("/health");
}

/* =========================================================
   THREAT INTELLIGENCE
   ========================================================= */

export async function analyzeThreat(
  payload: {
    text: string;
    top_k?: number;
  },
): Promise<ThreatAnalysisResponse> {
  return request<ThreatAnalysisResponse>(
    "/threat/analyze",
    {
      method: "POST",
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function getThreatInvestigations(
  page = 1,
  pageSize = 20,
  riskLevel?:
    | "low"
    | "medium"
    | "high"
    | "critical",
  category?: string,
): Promise<ThreatInvestigationHistoryResponse> {
  const params =
    new URLSearchParams({
      page: String(page),
      page_size: String(
        pageSize,
      ),
    });

  if (riskLevel) {
    params.set(
      "risk_level",
      riskLevel,
    );
  }

  if (category) {
    params.set(
      "category",
      category,
    );
  }

  return request<ThreatInvestigationHistoryResponse>(
    `/threat/investigations?${params.toString()}`,
  );
}

export async function getThreatInvestigation(
  investigationId: number,
): Promise<ThreatAnalysisResponse> {
  return request<ThreatAnalysisResponse>(
    `/threat/investigations/${investigationId}`,
  );
}

export async function getThreatAnalyticsOverview(): Promise<ThreatAnalyticsOverview> {
  return request<ThreatAnalyticsOverview>(
    "/threat/analytics/overview",
  );
}

export async function getThreatRiskDistribution(): Promise<ThreatRiskDistributionResponse> {
  return request<ThreatRiskDistributionResponse>(
    "/threat/analytics/risk-distribution",
  );
}

export async function getThreatCategoryDistribution(): Promise<ThreatCategoryDistributionResponse> {
  return request<ThreatCategoryDistributionResponse>(
    "/threat/analytics/categories",
  );
}

export async function getThreatSignalFrequency(): Promise<ThreatSignalFrequencyResponse> {
  return request<ThreatSignalFrequencyResponse>(
    "/threat/analytics/signals",
  );
}

export async function getThreatTimeline(
  fromDate?: string,
  toDate?: string,
): Promise<ThreatTimelineResponse> {
  const params =
    new URLSearchParams();

  if (fromDate) {
    params.set(
      "from_date",
      fromDate,
    );
  }

  if (toDate) {
    params.set(
      "to_date",
      toDate,
    );
  }

  const query =
    params.toString();

  return request<ThreatTimelineResponse>(
    `/threat/analytics/timeline${
      query
        ? `?${query}`
        : ""
    }`,
  );
}
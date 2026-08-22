import type {
  HealthResponse,
  ModelAnalyticsResponse,
  ModelInfoResponse,
  ThreatAnalysisRequest,
  ThreatAnalysisResponse,
  ThreatAnalyticsOverviewResponse,
  ThreatCategoryDistributionResponse,
  ThreatInvestigationHistoryResponse,
  ThreatRiskDistributionResponse,
  ThreatSignalFrequencyResponse,
  ThreatTimelineResponse,
  UsageAnalyticsResponse,
} from "./types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "/api"
).replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | null;

  constructor(
    message: string,
    status: number,
    detail: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

interface ApiErrorPayload {
  detail?: string | Array<{ msg?: string }>;
}

function getErrorDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const { detail } = payload as ApiErrorPayload;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => item?.msg)
      .filter((message): message is string => Boolean(message));

    return messages.length > 0 ? messages.join(". ") : null;
  }

  return null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = getErrorDetail(payload);

    throw new ApiError(
      detail ?? `Request failed with status ${response.status}.`,
      response.status,
      detail,
    );
  }

  return response.json() as Promise<T>;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function analyzeThreat(
  payload: ThreatAnalysisRequest,
): Promise<ThreatAnalysisResponse> {
  return request<ThreatAnalysisResponse>("/threat/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: payload.text,
      top_k: payload.top_k ?? 6,
    }),
  });
}

export function getThreatInvestigations(
  options: {
    page?: number;
    pageSize?: number;
    riskLevel?: "low" | "medium" | "high" | "critical";
    category?: string;
  } = {},
): Promise<ThreatInvestigationHistoryResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(options.page ?? 1));
  searchParams.set("page_size", String(options.pageSize ?? 20));

  if (options.riskLevel) {
    searchParams.set("risk_level", options.riskLevel);
  }

  if (options.category?.trim()) {
    searchParams.set("category", options.category.trim());
  }

  return request<ThreatInvestigationHistoryResponse>(
    `/threat/investigations?${searchParams.toString()}`,
  );
}

export function getThreatInvestigation(
  investigationId: number,
): Promise<ThreatAnalysisResponse> {
  return request<ThreatAnalysisResponse>(
    `/threat/investigations/${investigationId}`,
  );
}

export function getThreatAnalyticsOverview(): Promise<ThreatAnalyticsOverviewResponse> {
  return request<ThreatAnalyticsOverviewResponse>(
    "/threat/analytics/overview",
  );
}

export function getThreatRiskDistribution(): Promise<ThreatRiskDistributionResponse> {
  return request<ThreatRiskDistributionResponse>(
    "/threat/analytics/risk-distribution",
  );
}

export function getThreatCategoryDistribution(): Promise<ThreatCategoryDistributionResponse> {
  return request<ThreatCategoryDistributionResponse>(
    "/threat/analytics/categories",
  );
}

export function getThreatSignalFrequency(): Promise<ThreatSignalFrequencyResponse> {
  return request<ThreatSignalFrequencyResponse>(
    "/threat/analytics/signals",
  );
}

export function getThreatTimeline(
  options: {
    fromDate?: string;
    toDate?: string;
  } = {},
): Promise<ThreatTimelineResponse> {
  const searchParams = new URLSearchParams();

  if (options.fromDate) {
    searchParams.set("from_date", options.fromDate);
  }

  if (options.toDate) {
    searchParams.set("to_date", options.toDate);
  }

  const query = searchParams.toString();

  return request<ThreatTimelineResponse>(
    `/threat/analytics/timeline${query ? `?${query}` : ""}`,
  );
}

export function getModelInfo(): Promise<ModelInfoResponse> {
  return request<ModelInfoResponse>("/model/info");
}

export function getModelAnalytics(): Promise<ModelAnalyticsResponse> {
  return request<ModelAnalyticsResponse>("/analytics/model");
}

export function getUsageAnalytics(): Promise<UsageAnalyticsResponse> {
  return request<UsageAnalyticsResponse>("/analytics/usage");
}
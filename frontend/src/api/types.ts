export type ClassifierLabel = "ham" | "spam" | (string & {});

export type ThreatLabel = string;

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ThreatSignal {
  type: string;
  label: string;
  severity: number;
  evidence: string;
}

export interface ThreatLink {
  url: string;
  host: string;
  shortener: boolean;
  ip_address: boolean;
  suspicious_path: boolean;
}

export interface ThreatAnalysisRequest {
  text: string;
  top_k?: number;
}

export interface ThreatAnalysisResponse {
  classifier_label: ClassifierLabel;
  classifier_decision_score: number | null;

  threat_label: ThreatLabel;
  risk_level: RiskLevel;
  severity: number;
  category: string;

  signals: ThreatSignal[];
  links: ThreatLink[];

  recommendation: string;
  model_version: string;
}

export interface ThreatInvestigationHistoryItem
  extends ThreatAnalysisResponse {
  id: number;
  created_at: string;
}

export interface ThreatInvestigationHistoryResponse {
  items: ThreatInvestigationHistoryItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ThreatAnalyticsOverviewResponse {
  total_investigations: number;

  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;

  critical_percentage: number;
  high_percentage: number;
  medium_percentage: number;
  low_percentage: number;

  average_severity: number;
  max_severity: number;

  malicious_count: number;
  suspicious_count: number;
  benign_count: number;
}

export interface ThreatRiskDistributionItem {
  risk_level: RiskLevel;
  count: number;
  percentage: number;
}

export interface ThreatRiskDistributionResponse {
  items: ThreatRiskDistributionItem[];
}

export interface ThreatCategoryDistributionItem {
  category: string;
  count: number;
  percentage: number;
}

export interface ThreatCategoryDistributionResponse {
  items: ThreatCategoryDistributionItem[];
}

export interface ThreatSignalFrequencyItem {
  signal_type: string;
  count: number;
  percentage: number;
}

export interface ThreatSignalFrequencyResponse {
  items: ThreatSignalFrequencyItem[];
}

export interface ThreatTimelineItem {
  date: string;
  investigations: number;

  critical: number;
  high: number;
  medium: number;
  low: number;

  average_severity: number;

  malicious: number;
  suspicious: number;
  benign: number;
}

export interface ThreatTimelineResponse {
  items: ThreatTimelineItem[];
  from_date: string | null;
  to_date: string | null;
}

export interface ModelInfoResponse {
  model_version: string;
  model_type: string;
  hyperparameters: Record<string, unknown>;
  preprocessing_version: string;
  dataset_sha256: string;
  training_date_utc: string;
  cv_results: Array<Record<string, unknown>>;
  final_test_metrics: Record<string, number>;
  calibration: Record<string, unknown>;
}

export interface ModelAnalyticsResponse {
  model_version: string;
  model_type: string;
  cv_results: Array<Record<string, unknown>>;
  final_test_metrics: Record<string, number>;
  calibration: Record<string, unknown>;
}

export interface UsageAnalyticsResponse {
  total_predictions: number;
  ham_predictions: number;
  spam_predictions: number;
  spam_rate: number;
}

export interface HealthResponse {
  status: "ok" | "degraded" | (string & {});
}
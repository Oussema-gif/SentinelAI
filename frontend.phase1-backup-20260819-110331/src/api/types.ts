export type PredictionLabel = "ham" | "spam";

export interface InfluentialTerm {
  term: string;
  contribution: number;
  direction: PredictionLabel;
}

export interface PredictionRequest {
  text: string;
  top_k?: number;
}

export interface PredictionResponse {
  label: PredictionLabel;
  confidence: number | null;
  confidence_type: string;
  decision_score: number | null;
  influential_terms: InfluentialTerm[];
  model_version: string;
}

export interface PredictionHistoryItem
  extends PredictionResponse {
  id: number;
  created_at: string;
}

export interface PredictionHistoryResponse {
  items: PredictionHistoryItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ModelCvResult {
  model_family: string;
  best_params: Record<string, unknown>;
  mean_precision: number;
  mean_recall: number;
  mean_f1: number;
  mean_pr_auc: number;
  std_f1: number;
  cv_score: number;
}

export interface ModelInfoResponse {
  model_version: string;
  model_type: string;
  hyperparameters: Record<string, unknown>;
  preprocessing_version: string;
  dataset_sha256: string;
  training_date_utc: string;
  cv_results: ModelCvResult[];
  final_test_metrics: Record<string, number>;
  calibration: Record<string, unknown>;
}

export interface ModelAnalyticsResponse {
  model_version: string;
  model_type: string;
  cv_results: ModelCvResult[];
  final_test_metrics: Record<string, number>;
  calibration: Record<string, unknown>;
}

export interface UsageAnalyticsResponse {
  total_predictions: number;
  ham_predictions: number;
  spam_predictions: number;
  spam_rate: number;
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
  risk_level: string;
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

export interface HealthResponse {
  status: string;
}

export interface ThreatAnalysisSignal {
  type: string;
  label: string;
  severity: number;
  evidence: string;
}

export interface ThreatAnalysisLink {
  url: string;
  host: string;
  shortener: boolean;
  ip_address: boolean;
  suspicious_path: boolean;
}

export interface ThreatAnalysisResponse {
  classifier_label: string;
  classifier_decision_score: number;
  threat_label: string;
  risk_level: string;
  severity: number;
  category: string;
  signals: ThreatAnalysisSignal[];
  links: ThreatAnalysisLink[];
  recommendation: string;
  model_version: string;
}


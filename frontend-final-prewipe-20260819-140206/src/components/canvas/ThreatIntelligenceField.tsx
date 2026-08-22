import type {
  Ref,
} from "react";



import type {
  ModelInfoResponse,
  ThreatAnalysisResponse,
  ThreatAnalyticsOverviewResponse,
  ThreatCategoryDistributionResponse,
  ThreatRiskDistributionResponse,
  ThreatSignalFrequencyResponse,
  ThreatTimelineResponse,
  UsageAnalyticsResponse,
} from "../../api/types";

import type {
  CanvasNode,
  ZoomLevel,
} from "../../canvas/types";

import { SpatialNode } from "./SpatialNode";

type Props = {
  node: CanvasNode;
  zoomLevel: ZoomLevel;
  nodeRef?: Ref<HTMLElement>;

  model?: ModelInfoResponse;
  usage?: UsageAnalyticsResponse;
  overview?: ThreatAnalyticsOverviewResponse;
  timeline?: ThreatTimelineResponse;
  risk?: ThreatRiskDistributionResponse;
  categories?: ThreatCategoryDistributionResponse;
  signals?: ThreatSignalFrequencyResponse;

  analysisResult?: ThreatAnalysisResponse;
  analysisPending: boolean;
  analysisError: string | null;

  inputMessage: string;
  setInputMessage: (value: string) => void;
  onAnalyze: () => void;
  onFocus: () => void;
};

function percent(value?: number) {
  if (value === undefined) {
    return "—";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function severityClass(value?: number) {
  if (value === undefined) {
    return "";
  }

  if (value >= 80) {
    return "is-critical";
  }

  if (value >= 50) {
    return "is-warning";
  }

  return "is-safe";
}

function stateClass(
  severity?: number,
  hasOpinion = false,
) {
  if (!hasOpinion || severity === undefined) {
    return "is-neutral";
  }

  if (severity >= 80) {
    return "is-critical";
  }

  if (severity >= 50) {
    return "is-warning";
  }

  return "is-safe";
}

export function ThreatIntelligenceField({
  node,
  zoomLevel,
  nodeRef,
  model,
  usage,
  overview,
  timeline,
  categories,
  signals,
  analysisResult,
  analysisPending,
  analysisError,
  inputMessage,
  setInputMessage,
  onAnalyze,
  onFocus,
}: Props) {
  const macro = zoomLevel === "macro";
  const meso =
    zoomLevel === "meso" ||
    zoomLevel === "micro";
  const micro = zoomLevel === "micro";

  if (node.kind === "message") {
    return (
      <SpatialNode
        node={node}
        nodeRef={nodeRef}
        className={`field-message ${
          analysisResult
            ? stateClass(
                analysisResult.severity,
                true,
              )
            : "is-neutral"
        }`}
        onFocus={onFocus}
      >
        <div className="field-eyebrow">
          MESSAGE FIELD
        </div>

        <h2>Message Intake</h2>

        {macro ? (
          <div className="field-summary">
            <span className="field-status-dot is-active" />
            LIVE MESSAGE ANALYSIS
          </div>
        ) : (
          <>
            <textarea
              value={inputMessage}
              onChange={(event) =>
                setInputMessage(
                  event.target.value,
                )
              }
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              onWheel={(event) =>
                event.stopPropagation()
              }
              placeholder="Paste a message to analyze..."
              rows={7}
            />

            <div className="field-actions">
              <span>
                POST /api/threat/analyze
              </span>

              <button
                type="button"
                disabled={
                  !inputMessage.trim() ||
                  analysisPending
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onAnalyze();
                }}
              >
                {analysisPending
                  ? "ANALYZING..."
                  : "ANALYZE"}
              </button>
            </div>

            {analysisError && (
              <div className="field-error">
                {analysisError}
              </div>
            )}

            {analysisResult && (
              <div
                className={`analysis-summary ${severityClass(
                  analysisResult.severity,
                )}`}
              >
                <div className="analysis-summary-head">
                  <span>
                    {analysisResult.risk_level}
                  </span>

                  <strong>
                    {analysisResult.severity}
                  </strong>
                </div>

                <div className="analysis-summary-category">
                  {analysisResult.category}
                </div>

                {meso && (
                  <div className="analysis-summary-grid">
                    <Metric
                      label="Classifier"
                      value={
                        analysisResult.classifier_label
                      }
                    />

                    <Metric
                      label="Threat"
                      value={
                        analysisResult.threat_label
                      }
                    />
                  </div>
                )}

                {micro && (
                  <>
                    <div className="signal-list">
                      {analysisResult.signals?.map(
                        (signal, index) => (
                          <div
                            key={`${signal.type}-${index}`}
                            className="signal-row"
                          >
                            <span>
                              {signal.label}
                            </span>

                            <strong>
                              {Math.round(
                                signal.severity *
                                  100,
                              )}
                            </strong>

                            <small>
                              {
                                signal.evidence
                              }
                            </small>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="link-list">
                      {analysisResult.links?.map(
                        (link) => (
                          <div
                            key={link.url}
                            className="link-row"
                          >
                            <span>
                              {link.host}
                            </span>

                            <code>
                              {link.url}
                            </code>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="recommendation">
                      {
                        analysisResult.recommendation
                      }
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </SpatialNode>
    );
  }

  if (node.kind === "threat") {
    const severity =
      overview?.average_severity;

    const verdict =
      severity === undefined
        ? "WAITING"
        : severity >= 80
          ? "CRITICAL"
          : severity >= 50
            ? "WARNING"
            : "BENIGN";

    return (
      <SpatialNode
        node={node}
        nodeRef={nodeRef}
        className={`field-threat-rollup ${stateClass(
          severity,
          overview !== undefined,
        )}`}
        onFocus={onFocus}
      >
        <div className="rollup-eyebrow">
          WORLD THREAT STATE
        </div>

        {macro ? (
          <div className="rollup-macro">
            <span>THREAT MATRIX</span>

            <strong>
              {overview?.total_investigations ?? 0}
            </strong>
          </div>
        ) : (
          <>
            <div className="rollup-status-row">
              <div>
                <span className="rollup-label">
                  VERDICT
                </span>

                <strong className="rollup-verdict">
                  {verdict}
                </strong>
              </div>

              <div>
                <span className="rollup-label">
                  INVESTIGATIONS
                </span>

                <strong className="rollup-count">
                  {overview?.total_investigations ?? 0}
                </strong>
              </div>
            </div>

            {micro && (
              <div className="rollup-micro">
                <span>
                  AVG {severity?.toFixed(0) ?? "—"}
                </span>

                <span>
                  MAX {overview?.max_severity ?? "—"}
                </span>
              </div>
            )}
          </>
        )}
      </SpatialNode>
    );
  }

  if (node.kind === "investigation") {
    const latest =
      analysisResult;

    return (
      <SpatialNode
        node={node}
        nodeRef={nodeRef}
        className={`field-investigation ${
          latest
            ? stateClass(
                latest.severity,
                true,
              )
            : "is-neutral"
        }`}
        onFocus={onFocus}
      >
        <div className="field-eyebrow">
          INVESTIGATION FIELD
        </div>

        <h2>Forensic Intelligence</h2>

        {macro ? (
          <div className="field-summary">
            INVESTIGATION SPACE
          </div>
        ) : (
          <>
            <div className="metric-grid">
              <Metric
                label="Risk"
                value={
                  latest?.risk_level ??
                  "—"
                }
              />

              <Metric
                label="Severity"
                value={
                  latest?.severity ??
                  "—"
                }
              />

              <Metric
                label="Category"
                value={
                  latest?.category ??
                  "—"
                }
              />
            </div>

            {micro && latest && (
              <>
                <div className="field-block">
                  <span>Signals</span>

                  {latest.signals?.map(
                    (signal, index) => (
                      <div
                        key={`${signal.type}-${index}`}
                        className="signal-row"
                      >
                        <span>
                          {signal.label}
                        </span>

                        <strong>
                          {Math.round(
                            signal.severity *
                              100,
                          )}
                        </strong>
                      </div>
                    ),
                  )}
                </div>

                <div className="field-block">
                  <span>Recommendation</span>

                  <p>
                    {latest.recommendation}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </SpatialNode>
    );
  }

  if (node.kind === "model") {
    return (
      <SpatialNode
        node={node}
        nodeRef={nodeRef}
        className="field-model"
        onFocus={onFocus}
      >
        {macro ? (
          <>
            <div className="field-eyebrow">
              MODEL FIELD
            </div>

            <div className="field-macro-stat">
              {model?.model_type ?? "MODEL"}
            </div>
          </>
        ) : (
          <>
            <div className="field-eyebrow">
              MODEL INTELLIGENCE
            </div>

            <h2>
              {model?.model_type ?? "MODEL"}
            </h2>

            <div className="field-summary">
              {model?.model_version ?? "—"}
            </div>
          </>
        )}

        {meso && model && (
          <div className="metric-grid">
            <Metric
              label="F1"
              value={percent(
                model.final_test_metrics.f1,
              )}
            />

            <Metric
              label="Recall"
              value={percent(
                model.final_test_metrics.recall,
              )}
            />

            <Metric
              label="PR-AUC"
              value={percent(
                model.final_test_metrics.pr_auc,
              )}
            />

            <Metric
              label="Accuracy"
              value={percent(
                model.final_test_metrics
                  .accuracy,
              )}
            />
          </div>
        )}

        {micro && model && (
          <div className="field-detail-list">
            {model.cv_results.map((item) => (
              <div
                key={item.model_family}
              >
                <span>
                  {item.model_family}
                </span>

                <strong>
                  {percent(item.mean_f1)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </SpatialNode>
    );
  }

  if (node.kind === "archive") {
    return (
      <SpatialNode
        node={node}
        nodeRef={nodeRef}
        className="field-archive"
        onFocus={onFocus}
      >
        {macro ? (
          <>
            <div className="field-eyebrow">
              ARCHIVE FIELD
            </div>

            <div className="field-macro-stat">
              ARCHIVE INDEX
            </div>
          </>
        ) : (
          <>
            <div className="field-eyebrow">
              ARCHIVE / GRAVEYARD
            </div>

            <h2>
              Threat History
            </h2>
          </>
        )}

        {!macro && (
          <div className="timeline-list">
            {timeline?.items
              .slice(-12)
              .map((item) => (
                <div
                  key={item.date}
                  className="timeline-row"
                >
                  <span>
                    {item.date}
                  </span>

                  <strong>
                    {item.investigations}
                  </strong>

                  <em>
                    {item.average_severity.toFixed(
                      1,
                    )}
                  </em>
                </div>
              ))}
          </div>
        )}

        {micro && (
          <div className="metric-grid">
            <Metric
              label="HAM"
              value={
                usage?.ham_predictions ??
                0
              }
            />

            <Metric
              label="SPAM"
              value={
                usage?.spam_predictions ??
                0
              }
            />

            <Metric
              label="Categories"
              value={
                categories?.items.length ??
                0
              }
            />

            <Metric
              label="Signals"
              value={
                signals?.items.length ??
                0
              }
            />
          </div>
        )}
      </SpatialNode>
    );
  }

  return null;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

import {
  useState,
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
  ZoomLevel,
} from "../../canvas/types";

import type {
  SpatialNodeModel,
} from "../../canvas/nodes";

import {
  SpatialNode,
} from "./SpatialNode";

type Props = {
  node: SpatialNodeModel;

  zoomLevel: ZoomLevel;

  model:
    | ModelInfoResponse
    | undefined;

  usage:
    | UsageAnalyticsResponse
    | undefined;

  overview:
    | ThreatAnalyticsOverviewResponse
    | undefined;

  timeline:
    | ThreatTimelineResponse
    | undefined;

  risk:
    | ThreatRiskDistributionResponse
    | undefined;

  categories:
    | ThreatCategoryDistributionResponse
    | undefined;

  signals:
    | ThreatSignalFrequencyResponse
    | undefined;

  macro: boolean;
  meso: boolean;
  micro: boolean;

  onFocus: () => void;

  inputMessage: string;

  setInputMessage: (
    value: string,
  ) => void;

  analysisResult:
    | ThreatAnalysisResponse
    | undefined;

  analysisPending: boolean;

  analysisError:
    | string
    | null;

  onAnalyze: () => void;
};

function percent(
  value:
    | number
    | undefined,
) {
  if (
    value === undefined
  ) {
    return "—";
  }

  return `${(
    value * 100
  ).toFixed(1)}%`;
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "short",
      day: "numeric",
    },
  ).format(
    new Date(value),
  );
}

export function ThreatIntelligenceField(
  props: Props,
) {
  const {
    node,
    zoomLevel,
    model,
    usage,
    overview,
    timeline,
    risk,
    categories,
    signals,
    macro,
    meso,
    micro,
    onFocus,
    inputMessage,
    setInputMessage,
    analysisResult,
    analysisPending,
    analysisError,
    onAnalyze,
  } = props;

  const [
    expandedSignal,
    setExpandedSignal,
  ] = useState<
    string | null
  >(null);

  /*
   * ============================================================
   * OVERVIEW
   * ============================================================
   *
   * Macro:
   *   - total investigations only
   *
   * Meso:
   *   - risk counts
   *   - severity
   *   - malicious count
   *
   * Micro:
   *   - maximum severity
   *   - classification split
   */

  if (
    node.kind ===
    "overview"
  ) {
    return (
      <SpatialNode
        node={node}
        className={`field-overview field-${zoomLevel}`}
        onFocus={onFocus}
      >
        <div className="field-zoom-label">
          {zoomLevel.toUpperCase()}
        </div>

        <div className="overview-hero-number">
          {
            overview
              ?.total_investigations ??
            0
          }
        </div>

        <div className="overview-caption">
          investigations
        </div>

        {meso && (
          <div className="metric-grid">
            <Metric
              label="Critical"
              value={
                overview
                  ?.critical_count ??
                0
              }
            />

            <Metric
              label="High"
              value={
                overview
                  ?.high_count ??
                0
              }
            />

            <Metric
              label="Severity"
              value={
                overview
                  ? `${overview.average_severity.toFixed(
                      1,
                    )} / 100`
                  : "—"
              }
            />

            <Metric
              label="Malicious"
              value={
                overview
                  ?.malicious_count ??
                0
              }
            />
          </div>
        )}

        {micro && (
          <div className="field-detail-grid">
            <Metric
              label="Maximum severity"
              value={
                overview
                  ?.max_severity ??
                "—"
              }
            />

            <Metric
              label="Suspicious"
              value={
                overview
                  ?.suspicious_count ??
                0
              }
            />

            <Metric
              label="Benign"
              value={
                overview
                  ?.benign_count ??
                0
              }
            />

            <Metric
              label="Risk spread"
              value={
                overview
                  ? `${overview.critical_percentage.toFixed(
                      1,
                    )}% critical`
                  : "—"
              }
            />
          </div>
        )}
      </SpatialNode>
    );
  }

  /*
   * ============================================================
   * MODEL
   * ============================================================
   */

  if (
    node.kind ===
    "model"
  ) {
    return (
      <SpatialNode
        node={node}
        className={`field-model field-${zoomLevel}`}
        onFocus={onFocus}
      >
        <div className="field-zoom-label">
          MODEL ·{" "}
          {zoomLevel.toUpperCase()}
        </div>

        <div className="model-name">
          {
            model
              ?.model_type ??
            "Loading…"
          }
        </div>

        <div className="model-version">
          {
            model
              ?.model_version ??
            "—"
          }
        </div>

        {meso && (
          <div className="metric-grid">
            <Metric
              label="F1"
              value={percent(
                model
                  ?.final_test_metrics
                  .f1,
              )}
            />

            <Metric
              label="Recall"
              value={percent(
                model
                  ?.final_test_metrics
                  .recall,
              )}
            />

            <Metric
              label="Accuracy"
              value={percent(
                model
                  ?.final_test_metrics
                  .accuracy,
              )}
            />

            <Metric
              label="PR-AUC"
              value={percent(
                model
                  ?.final_test_metrics
                  .pr_auc,
              )}
            />
          </div>
        )}

        {micro && (
          <div className="field-detail-list">
            {model?.cv_results
              ?.slice(0, 3)
              .map(
                (item) => (
                  <div
                    key={
                      item.model_family
                    }
                  >
                    <span>
                      {
                        item.model_family
                      }
                    </span>

                    <strong>
                      {percent(
                        item.mean_f1,
                      )}
                    </strong>
                  </div>
                ),
              )}

            {model?.calibration && (
              <div>
                <span>
                  calibration
                </span>

                <strong>
                  {model.calibration
                    .available
                    ? "available"
                    : "decision score"}
                </strong>
              </div>
            )}
          </div>
        )}
      </SpatialNode>
    );
  }

  /*
   * ============================================================
   * USAGE
   * ============================================================
   */

  if (
    node.kind ===
    "usage"
  ) {
    return (
      <SpatialNode
        node={node}
        className={`field-usage field-${zoomLevel}`}
        onFocus={onFocus}
      >
        <div className="field-zoom-label">
          TELEMETRY ·{" "}
          {zoomLevel.toUpperCase()}
        </div>

        <div className="usage-number">
          {
            usage
              ?.total_predictions ??
            0
          }
        </div>

        <div className="overview-caption">
          predictions
        </div>

        {meso && (
          <div className="metric-grid">
            <Metric
              label="HAM"
              value={
                usage
                  ?.ham_predictions ??
                0
              }
            />

            <Metric
              label="SPAM"
              value={
                usage
                  ?.spam_predictions ??
                0
              }
            />

            <Metric
              label="Spam rate"
              value={
                usage
                  ? `${(
                      usage.spam_rate *
                      100
                    ).toFixed(1)}%`
                  : "—"
              }
            />
          </div>
        )}

        {micro && (
          <div className="field-detail">
            Live prediction
            telemetry refreshed
            from the production
            usage endpoint.
          </div>
        )}
      </SpatialNode>
    );
  }

  /*
   * ============================================================
   * THREAT OVERVIEW
   * ============================================================
   */

  if (
    node.kind ===
    "threat"
  ) {
    return (
      <SpatialNode
        node={node}
        className={`field-threat field-${zoomLevel}`}
        onFocus={onFocus}
      >
        <div className="field-zoom-label">
          THREAT FIELD ·{" "}
          {zoomLevel.toUpperCase()}
        </div>

        <div className="risk-orb">
          <strong>
            {overview
              ?.average_severity
              .toFixed(0) ??
              "0"}
          </strong>

          <span>
            severity
          </span>
        </div>

        {meso && (
          <div className="risk-strip">
            <RiskValue
              label="CRITICAL"
              value={
                overview
                  ?.critical_percentage ??
                0
              }
            />

            <RiskValue
              label="HIGH"
              value={
                overview
                  ?.high_percentage ??
                0
              }
            />

            <RiskValue
              label="MEDIUM"
              value={
                overview
                  ?.medium_percentage ??
                0
              }
            />

            <RiskValue
              label="LOW"
              value={
                overview
                  ?.low_percentage ??
                0
              }
            />
          </div>
        )}

        {micro && (
          <div className="field-detail-grid">
            <Metric
              label="Max severity"
              value={
                overview
                  ?.max_severity ??
                "—"
              }
            />

            <Metric
              label="Malicious"
              value={
                overview
                  ?.malicious_count ??
                0
              }
            />

            <Metric
              label="Suspicious"
              value={
                overview
                  ?.suspicious_count ??
                0
              }
            />

            <Metric
              label="Benign"
              value={
                overview
                  ?.benign_count ??
                0
              }
            />
          </div>
        )}
      </SpatialNode>
    );
  }

  /*
   * ============================================================
   * TIMELINE
   * ============================================================
   */

  if (
    node.kind ===
    "timeline"
  ) {
    return (
      <SpatialNode
        node={node}
        className={`field-timeline field-${zoomLevel}`}
        onFocus={onFocus}
      >
        {macro && (
          <div className="field-summary">
            Zoom closer to inspect
            investigation activity
            over time.
          </div>
        )}

        {meso && (
          <>
            <div className="timeline-bars">
              {timeline?.items
                ?.slice(-12)
                .map(
                  (item) => (
                    <div
                      key={
                        item.date
                      }
                      className="timeline-bar-column"
                    >
                      <div
                        className="timeline-bar"
                        style={{
                          height: `${Math.max(
                            8,
                            Math.min(
                              100,
                              item.average_severity,
                            ),
                          )}%`,
                        }}
                      />

                      {micro && (
                        <small>
                          {
                            item.investigations
                          }
                        </small>
                      )}
                    </div>
                  ),
                )}
            </div>

            {!timeline?.items
              ?.length && (
              <div className="empty-state">
                No timeline data.
              </div>
            )}
          </>
        )}

        {micro &&
          timeline?.items
            ?.slice(-6)
            .map(
              (item) => (
                <div
                  key={`${item.date}-detail`}
                  className="timeline-detail-row"
                >
                  <span>
                    {formatDate(
                      item.date,
                    )}
                  </span>

                  <strong>
                    {
                      item.investigations
                    }
                  </strong>

                  <small>
                    avg{" "}
                    {item.average_severity.toFixed(
                      1,
                    )}
                  </small>

                  <small>
                    C{" "}
                    {item.critical}
                    {" · "}
                    H{" "}
                    {item.high}
                    {" · "}
                    M{" "}
                    {item.medium}
                    {" · "}
                    L{" "}
                    {item.low}
                  </small>
                </div>
              ),
            )}
      </SpatialNode>
    );
  }

  /*
   * ============================================================
   * RISK DISTRIBUTION
   * ============================================================
   */

  if (
    node.kind ===
    "risk"
  ) {
    return (
      <SpatialNode
        node={node}
        className={`field-risk field-${zoomLevel}`}
        onFocus={onFocus}
      >
        {macro && (
          <div className="field-summary">
            Risk distribution
            activates at Meso
            zoom.
          </div>
        )}

        {meso && (
          <div className="distribution-list">
            {risk?.items?.map(
              (item) => (
                <div
                  key={
                    item.risk_level
                  }
                >
                  <div>
                    <span>
                      {
                        item.risk_level
                      }
                    </span>

                    <strong>
                      {item.count}
                    </strong>
                  </div>

                  <div className="distribution-track">
                    <span
                      style={{
                        width: `${item.percentage}%`,
                      }}
                    />
                  </div>

                  {micro && (
                    <small>
                      {item.percentage.toFixed(
                        1,
                      )}
                      %
                    </small>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </SpatialNode>
    );
  }

  /*
   * ============================================================
   * CATEGORY DISTRIBUTION
   * ============================================================
   */

  if (
    node.kind ===
    "categories"
  ) {
    return (
      <SpatialNode
        node={node}
        className={`field-categories field-${zoomLevel}`}
        onFocus={onFocus}
      >
        {macro && (
          <div className="field-summary">
            Threat categories
            activate at Meso
            zoom.
          </div>
        )}

        {meso && (
          <div className="category-list">
            {categories?.items?.map(
              (item) => (
                <div
                  key={
                    item.category
                  }
                >
                  <span>
                    {
                      item.category
                    }
                  </span>

                  <strong>
                    {item.count}
                  </strong>

                  {micro && (
                    <small>
                      {item.percentage.toFixed(
                        1,
                      )}
                      %
                    </small>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </SpatialNode>
    );
  }

  /*
   * ============================================================
   * SIGNAL FREQUENCY
   * ============================================================
   *
   * This field is intentionally Micro-only.
   * The parent query layer should also keep this query disabled
   * outside Micro zoom.
   */

  if (
    node.kind ===
    "signals"
  ) {
    return (
      <SpatialNode
        node={node}
        className={`field-signals field-${zoomLevel}`}
        onFocus={onFocus}
      >
        {!micro ? (
          <div className="field-summary">
            Zoom to Micro to inspect
            signal frequency.
          </div>
        ) : (
          <>
            <div className="signal-list">
              {signals?.items?.map(
                (item) => {
                  const selected =
                    expandedSignal ===
                    item.signal_type;

                  return (
                    <button
                      key={
                        item.signal_type
                      }
                      type="button"
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        setExpandedSignal(
                          selected
                            ? null
                            : item.signal_type,
                        );
                      }}
                    >
                      <span>
                        {
                          item.signal_type
                        }
                      </span>

                      <strong>
                        {item.count}
                      </strong>
                    </button>
                  );
                },
              )}
            </div>

            {expandedSignal && (
              <div className="field-detail">
                <strong>
                  {expandedSignal}
                </strong>

                <br />

                Signal frequency is
                derived from the
                production threat
                analytics endpoint.
              </div>
            )}

            {!signals?.items?.length && (
              <div className="empty-state">
                No signal data.
              </div>
            )}
          </>
        )}
      </SpatialNode>
    );
  }

  /*
   * ============================================================
   * INPUT / LIVE THREAT ANALYSIS
   * ============================================================
   */

  if (
    node.kind ===
    "input"
  ) {
    return (
      <SpatialNode
        node={node}
        className={`field-input field-${zoomLevel}`}
        onFocus={onFocus}
      >
        <div className="field-zoom-label">
          LIVE ANALYSIS ·{" "}
          {zoomLevel.toUpperCase()}
        </div>

        <textarea
          value={
            inputMessage
          }
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
          placeholder="Paste a message to analyze…"
          rows={
            micro
              ? 8
              : meso
                ? 6
                : 4
          }
        />

        <div className="input-toolbar">
          <span>
            POST /api/threat/analyze
          </span>

          <button
            type="button"
            disabled={
              !inputMessage.trim() ||
              analysisPending
            }
            onClick={(
              event,
            ) => {
              event.stopPropagation();
              onAnalyze();
            }}
          >
            {analysisPending
              ? "ANALYZING…"
              : "ANALYZE"}
          </button>
        </div>

        {analysisError && (
          <div className="error-box">
            {analysisError}
          </div>
        )}

        {analysisPending && (
          <div className="analysis-loading">
            Running classifier,
            threat extraction,
            signal detection, and
            recommendation analysis…
          </div>
        )}

        {analysisResult && (
          <div
            className={`analysis-result analysis-${analysisResult.risk_level}`}
          >
            <div className="result-head">
              <span>
                {
                  analysisResult.risk_level
                }
              </span>

              <strong>
                {
                  analysisResult.severity
                }
              </strong>
            </div>

            <p>
              {
                analysisResult.category
              }
            </p>

            {meso && (
              <div className="analysis-meta-grid">
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

                <Metric
                  label="Signals"
                  value={
                    analysisResult
                      .signals
                      .length
                  }
                />

                <Metric
                  label="Links"
                  value={
                    analysisResult
                      .links
                      .length
                  }
                />
              </div>
            )}

            {micro && (
              <>
                <div className="analysis-detail-list">
                  <Metric
                    label="Decision score"
                    value={
                      analysisResult
                        .classifier_decision_score
                        .toFixed(3)
                    }
                  />

                  <Metric
                    label="Model"
                    value={
                      analysisResult.model_version
                    }
                  />
                </div>

                {analysisResult
                  .signals
                  .length > 0 && (
                  <div className="analysis-signal-stack">
                    <div className="analysis-section-title">
                      Detected signals
                    </div>

                    {analysisResult
                      .signals
                      .map(
                        (
                          signal,
                          index,
                        ) => (
                          <div
                            key={`${signal.type}-${index}`}
                            className="analysis-signal-row"
                          >
                            <span>
                              {
                                signal.label
                              }
                            </span>

                            <strong>
                              {Math.round(
                                signal.severity *
                                  100,
                              )}
                              %
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
                )}

                {analysisResult
                  .links
                  .length > 0 && (
                  <div className="analysis-links">
                    <div className="analysis-section-title">
                      Extracted links
                    </div>

                    {analysisResult
                      .links
                      .map(
                        (link) => (
                          <div
                            key={
                              link.url
                            }
                            className="analysis-link-row"
                          >
                            <span>
                              {
                                link.host
                              }
                            </span>

                            <strong>
                              {link.shortener
                                ? "SHORTENER"
                                : "LINK"}
                            </strong>
                          </div>
                        ),
                      )}
                  </div>
                )}

                <div className="recommendation">
                  {
                    analysisResult.recommendation
                  }
                </div>
              </>
            )}
          </div>
        )}
      </SpatialNode>
    );
  }

  /*
   * ============================================================
   * UNKNOWN NODE
   * ============================================================
   */

  return null;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | number;
}) {
  return (
    <div className="metric">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function RiskValue({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="risk-value">
      <span>
        {label}
      </span>

      <strong>
        {value.toFixed(1)}%
      </strong>
    </div>
  );
}
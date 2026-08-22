import {
  useQuery,
} from "@tanstack/react-query";

import {
  getThreatAnalyticsOverview,
  getThreatCategoryDistribution,
  getThreatInvestigation,
  getThreatInvestigations,
  getThreatRiskDistribution,
  getThreatSignalFrequency,
  getThreatTimeline,
} from "../../api/client";

import type {
  ThreatInvestigationHistoryItem,
  ThreatRiskLevel,
} from "../../api/types";

import {
  getSemanticZoomLevel,
} from "../../zui/semanticZoom";

import type {
  SemanticZoomLevel,
} from "../../zui/semanticZoom";

interface ThreatIntelligenceLayerProps {
  zoom: number;

  selectedInvestigationId:
  | number
  | null;

  onSelectInvestigation: (
    id: number,
  ) => void;
}

function formatThreatLabel(
  label: string,
): string {
  return label
    .replaceAll("_", " ")
    .toUpperCase();
}

function RiskDot({
  risk,
}: {
  risk: ThreatRiskLevel;
}) {
  return (
    <span
      className={[
        "threat-risk-dot",
        `threat-risk-dot--${risk}`,
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

function StrategicOverview({
  total,
  critical,
  high,
  average,
  maxSeverity,
  malicious,
}: {
  total: number;
  critical: number;
  high: number;
  average: number;
  maxSeverity: number;
  malicious: number;
}) {
  return (
    <div className="threat-strategic-overview">
      <div className="threat-total-value">
        {total}
      </div>

      <div className="threat-total-label">
        INVESTIGATIONS
      </div>

      <div className="threat-stat-grid">
        <div>
          <span>CRITICAL</span>
          <strong>
            {critical}
          </strong>
        </div>

        <div>
          <span>HIGH</span>
          <strong>
            {high}
          </strong>
        </div>

        <div>
          <span>MALICIOUS</span>
          <strong>
            {malicious}
          </strong>
        </div>

        <div>
          <span>AVG SEVERITY</span>
          <strong>
            {average.toFixed(1)}
          </strong>
        </div>
      </div>

      <div className="threat-severity-bar">
        <div
          style={{
            width: `${Math.min(
              100,
              Math.max(
                0,
                maxSeverity,
              ),
            )}%`,
          }}
        />
      </div>

      <div className="threat-severity-meta">
        MAX SEVERITY{" "}
        {maxSeverity}
      </div>
    </div>
  );
}

function InvestigationCluster({
  items,
  selectedInvestigationId,
  onSelectInvestigation,
}: {
  items:
  ThreatInvestigationHistoryItem[];

  selectedInvestigationId:
  | number
  | null;

  onSelectInvestigation: (
    id: number,
  ) => void;
}) {
  return (
    <div className="threat-investigation-cluster">
      <div className="threat-cluster-count">
        {items.length}

        <span>
          RECENT CASES
        </span>
      </div>

      <div className="threat-investigation-list">
        {items
          .slice(0, 8)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              className={[
                "threat-investigation-card",
                item.id ===
                  selectedInvestigationId
                  ? "threat-investigation-card--selected"
                  : "",
              ].join(" ")}
              onPointerDown={(
                event,
              ) => {
                event.stopPropagation();
              }}
              onWheel={(
                event,
              ) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();

                onSelectInvestigation(
                  item.id,
                );
              }}
            >
              <div className="threat-card-header">
                <span>
                  INV-
                  {String(
                    item.id,
                  ).padStart(
                    4,
                    "0",
                  )}
                </span>

                <RiskDot
                  risk={
                    item.risk_level
                  }
                />
              </div>

              <strong>
                {formatThreatLabel(
                  item.threat_label,
                )}
              </strong>

              <div className="threat-card-meta">
                <span>
                  {item.category}
                </span>

                <span>
                  {item.severity}
                </span>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

function AnalyticsCluster({
  risk,
  categories,
  signals,
  timeline,
}: {
  risk: Array<{
    risk_level: string;
    count: number;
    percentage: number;
  }>;

  categories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;

  signals: Array<{
    signal_type: string;
    count: number;
    percentage: number;
  }>;

  timeline: Array<{
    date: string;
    investigations: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    average_severity: number;
  }>;
}) {
  const latest =
    timeline.length > 0
      ? timeline[
      timeline.length - 1
      ]
      : null;

  return (
    <div className="threat-analytics-cluster">
      <div className="threat-analytics-grid">
        <div className="threat-analytics-panel">
          <span>
            RISK DISTRIBUTION
          </span>

          {risk.map((item) => (
            <div
              className="threat-distribution-row"
              key={
                item.risk_level
              }
            >
              <div>
                <RiskDot
                  risk={
                    item.risk_level as ThreatRiskLevel
                  }
                />

                <span>
                  {
                    item.risk_level
                  }
                </span>
              </div>

              <strong>
                {item.count}
              </strong>

              <small>
                {item.percentage.toFixed(
                  1,
                )}
                %
              </small>
            </div>
          ))}
        </div>

        <div className="threat-analytics-panel">
          <span>
            CATEGORIES
          </span>

          {categories
            .slice(0, 8)
            .map((item) => (
              <div
                className="threat-category-row"
                key={
                  item.category
                }
              >
                <span>
                  {item.category}
                </span>

                <strong>
                  {item.count}
                </strong>
              </div>
            ))}
        </div>

        <div className="threat-analytics-panel">
          <span>
            SIGNALS
          </span>

          {signals
            .slice(0, 8)
            .map((item) => (
              <div
                className="threat-category-row"
                key={
                  item.signal_type
                }
              >
                <span>
                  {item.signal_type}
                </span>

                <strong>
                  {item.count}
                </strong>
              </div>
            ))}
        </div>

        <div className="threat-analytics-panel threat-timeline-panel">
          <span>
            TIMELINE
          </span>

          {latest ? (
            <>
              <strong className="threat-timeline-date">
                {latest.date}
              </strong>

              <div className="threat-timeline-value">
                {latest.investigations}
              </div>

              <div className="threat-timeline-label">
                CASES ON LATEST DAY
              </div>

              <div className="threat-timeline-bars">
                {timeline
                  .slice(-12)
                  .map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${item.date}-${index}`}
                        className="threat-timeline-bar"
                      >
                        <div
                          style={{
                            height: `${Math.max(
                              6,
                              Math.min(
                                100,
                                item.average_severity,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    ),
                  )}
              </div>
            </>
          ) : (
            <div className="threat-empty-state">
              NO TIMELINE DATA
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceCluster({
  investigationId,
}: {
  investigationId: number;
}) {
  const query =
    useQuery({
      queryKey: [
        "threat-investigation",
        investigationId,
      ],

      queryFn: () =>
        getThreatInvestigation(
          investigationId,
        ),

      enabled:
        investigationId > 0,
    });

  if (
    query.isPending
  ) {
    return (
      <div className="threat-evidence-loading">
        LOADING INVESTIGATION
      </div>
    );
  }

  if (
    query.isError ||
    !query.data
  ) {
    return (
      <div className="threat-empty-state">
        INVESTIGATION UNAVAILABLE
      </div>
    );
  }

  const investigation =
    query.data;

  return (
    <div className="threat-evidence">
      <div className="threat-evidence-header">
        <div>
          <span>
            INVESTIGATION
          </span>

          <strong>
            #
            {String(
              investigationId,
            ).padStart(
              4,
              "0",
            )}
          </strong>
        </div>

        <RiskDot
          risk={
            investigation.risk_level
          }
        />
      </div>

      <div className="threat-evidence-score">
        <span>
          SEVERITY
        </span>

        <strong>
          {investigation.severity}
        </strong>
      </div>

      <div className="threat-evidence-category">
        <span>
          {investigation.category}
        </span>

        <strong>
          {formatThreatLabel(
            investigation.threat_label,
          )}
        </strong>
      </div>

      <div className="threat-evidence-section">
        <span>
          SIGNALS
        </span>

        <div className="threat-evidence-signal-grid">
          {investigation.signals.map(
            (signal) => (
              <div
                key={
                  `${signal.type}-${signal.evidence}`
                }
                className="threat-evidence-signal"
              >
                <strong>
                  {signal.label}
                </strong>

                <small>
                  {signal.evidence}
                </small>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="threat-evidence-section">
        <span>
          LINKS
        </span>

        {investigation.links
          .length > 0 ? (
          investigation.links.map(
            (link) => (
              <div
                className="threat-evidence-link"
                key={link.url}
              >
                {link.url}
              </div>
            ),
          )
        ) : (
          <div className="threat-empty-state">
            NO LINKS EXTRACTED
          </div>
        )}
      </div>

      <div className="threat-evidence-recommendation">
        <span>
          RECOMMENDATION
        </span>

        <p>
          {
            investigation.recommendation
          }
        </p>
      </div>
    </div>
  );
}

export function ThreatIntelligenceLayer({
  zoom,
  selectedInvestigationId,
  onSelectInvestigation,
}: ThreatIntelligenceLayerProps) {
  const semanticZoom:
    SemanticZoomLevel =
    getSemanticZoomLevel(
      zoom,
    );

  const overviewQuery =
    useQuery({
      queryKey: [
        "threat-analytics",
        "overview",
      ],
      queryFn:
        getThreatAnalyticsOverview,
      refetchInterval:
        10_000,
    });

  const riskQuery =
    useQuery({
      queryKey: [
        "threat-analytics",
        "risk",
      ],
      queryFn:
        getThreatRiskDistribution,
      refetchInterval:
        10_000,
    });

  const categoriesQuery =
    useQuery({
      queryKey: [
        "threat-analytics",
        "categories",
      ],
      queryFn:
        getThreatCategoryDistribution,
      refetchInterval:
        10_000,
    });

  const signalsQuery =
    useQuery({
      queryKey: [
        "threat-analytics",
        "signals",
      ],
      queryFn:
        getThreatSignalFrequency,
      refetchInterval:
        10_000,
    });

  const timelineQuery =
    useQuery({
      queryKey: [
        "threat-analytics",
        "timeline",
      ],
      queryFn: () =>
        getThreatTimeline(),
      refetchInterval:
        10_000,
    });

  const investigationsQuery =
    useQuery({
      queryKey: [
        "threat-investigations",
      ],
      queryFn: () =>
        getThreatInvestigations(
          1,
          20,
        ),
      refetchInterval:
        10_000,
    });

  const overview =
    overviewQuery.data;

  const investigations =
    investigationsQuery.data
      ?.items ?? [];

  return (
    <>
      <div
        className={[
          "threat-intelligence-world",
          `threat-intelligence-world--${semanticZoom}`,
        ].join(" ")}
      >
        {/* =================================================
            OVERVIEW SPACE
           ================================================= */}

        <section
          className={[
            "threat-space",
            "threat-space--overview",
            semanticZoom ===
              "strategic"
              ? "threat-space--primary"
              : "",
          ].join(" ")}
          style={{
            left: 4540,
            top: 2600,
          }}
        >
          <div className="threat-space-header">
            <div>
              <span>
                SENTINELAI SPACE / 01
              </span>

              <strong>
                THREAT OVERVIEW
              </strong>
            </div>

            <small>
              {semanticZoom.toUpperCase()}
            </small>
          </div>

          {overview ? (
            <StrategicOverview
              total={
                overview.total_investigations
              }
              critical={
                overview.critical_count
              }
              high={
                overview.high_count
              }
              average={
                overview.average_severity
              }
              maxSeverity={
                overview.max_severity
              }
              malicious={
                overview.malicious_count
              }
            />
          ) : (
            <div className="threat-empty-state">
              LOADING THREAT OVERVIEW
            </div>
          )}
        </section>

        {/* =================================================
            INVESTIGATION FIELD
           ================================================= */}

        <section
          className="threat-space threat-space--investigations"
          style={{
            left: 2200,
            top: 2850,
          }}
        >
          <div className="threat-space-header">
            <div>
              <span>
                SENTINELAI SPACE / 02
              </span>

              <strong>
                INVESTIGATION FIELD
              </strong>
            </div>

            <small>
              {investigationsQuery
                .data?.total ??
                0}{" "}
              CASES
            </small>
          </div>

          {semanticZoom !==
            "strategic" && (
              <InvestigationCluster
                items={
                  investigations
                }
                selectedInvestigationId={
                  selectedInvestigationId
                }
                onSelectInvestigation={
                  onSelectInvestigation
                }
              />
            )}
        </section>

        {/* =================================================
            ANALYTICS FIELD
           ================================================= */}

        <section
          className="threat-space threat-space--analytics"
          style={{
            left: 6800,
            top: 1850,
          }}
        >
          <div className="threat-space-header">
            <div>
              <span>
                SENTINELAI SPACE / 03
              </span>

              <strong>
                THREAT ANALYTICS
              </strong>
            </div>

            <small>
              {semanticZoom.toUpperCase()}
            </small>
          </div>

          {semanticZoom !==
            "strategic" && (
              <AnalyticsCluster
                risk={
                  riskQuery.data
                    ?.items ?? []
                }
                categories={
                  categoriesQuery
                    .data
                    ?.items ?? []
                }
                signals={
                  signalsQuery.data
                    ?.items ?? []
                }
                timeline={
                  timelineQuery
                    .data
                    ?.items ?? []
                }
              />
            )}
        </section>

        {/* =================================================
            EVIDENCE FIELD
           ================================================= */}

        {selectedInvestigationId !==
          null &&
          semanticZoom ===
          "evidence" && (
            <section
              className="threat-space threat-space--evidence"
              style={{
                left: 5350,
                top: 3500,
              }}
            >
              <div className="threat-space-header">
                <div>
                  <span>
                    SENTINELAI SPACE / 04
                  </span>

                  <strong>
                    INVESTIGATION EVIDENCE
                  </strong>
                </div>

                <small>
                  EVIDENCE VIEW
                </small>
              </div>

              <EvidenceCluster
                investigationId={
                  selectedInvestigationId
                }
              />
            </section>
          )}
      </div>

      {semanticZoom ===
        "strategic" && (
          <div className="threat-zoom-hint">
            ZOOM IN TO ENTER
            THREAT INTELLIGENCE
          </div>
        )}
    </>
  );
}
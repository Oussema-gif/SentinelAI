import type { ThreatAnalyticsOverviewResponse } from "../../api/types";
import { getSeverityBandLabel } from "../radar/severityColorScale";

import "./RegionalOverviewPanel.css";

interface RegionalOverviewPanelProps {
  overview: ThreatAnalyticsOverviewResponse | null;
  mostCommonCategory?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

interface OverviewMetricProps {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "clear" | "medium" | "high" | "critical";
}

function OverviewMetric({
  label,
  value,
  detail,
  tone = "clear",
}: OverviewMetricProps) {
  return (
    <div
      className={`regional-overview__metric regional-overview__metric--${tone}`}
    >
      <span className="regional-overview__metric-label">{label}</span>

      <strong className="regional-overview__metric-value">{value}</strong>

      {detail && (
        <span className="regional-overview__metric-detail">{detail}</span>
      )}
    </div>
  );
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatCategoryLabel(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getAverageConditionLabel(averageSeverity: number): string {
  return getSeverityBandLabel(averageSeverity);
}

export function RegionalOverviewPanel({
  overview,
  mostCommonCategory = null,
  isLoading = false,
  error = null,
  onRefresh,
}: RegionalOverviewPanelProps) {
  return (
    <section
      className="regional-overview"
      aria-labelledby="regional-overview-title"
    >
      <header className="regional-overview__header">
        <div>
          <p className="regional-overview__eyebrow">Regional conditions</p>

          <h2 id="regional-overview-title">Threat field overview</h2>
        </div>

        {onRefresh && (
          <button
            className="regional-overview__refresh"
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Refresh"}
          </button>
        )}
      </header>

      {error && (
        <p className="regional-overview__error" role="alert">
          {error}
        </p>
      )}

      {isLoading && !overview && (
        <p className="regional-overview__empty">
          Loading regional conditions...
        </p>
      )}

      {!isLoading && !error && !overview && (
        <p className="regional-overview__empty">
          Analyze a message to establish the first regional conditions reading.
        </p>
      )}

      {overview && (
        <>
          <div className="regional-overview__primary">
            <div className="regional-overview__average">
              <span className="regional-overview__average-label">
                Average conditions
              </span>

              <strong>{overview.average_severity.toFixed(1)}</strong>

              <span>/ 100</span>
            </div>

            <div className="regional-overview__average-copy">
              <span>{getAverageConditionLabel(overview.average_severity)}</span>

              <small className="regional-overview__scan-count">
                {overview.total_investigations.toLocaleString()} scans
              </small>
            </div>
          </div>

          <div className="regional-overview__metrics">
            <OverviewMetric
              label="Clear/Low"
              value={overview.low_count}
              detail={formatPercentage(overview.low_percentage)}
              tone="clear"
            />

            <OverviewMetric
              label="Medium"
              value={overview.medium_count}
              detail={formatPercentage(overview.medium_percentage)}
              tone="medium"
            />

            <OverviewMetric
              label="High"
              value={overview.high_count}
              detail={formatPercentage(overview.high_percentage)}
              tone="high"
            />

            <OverviewMetric
              label="Critical"
              value={overview.critical_count}
              detail={formatPercentage(overview.critical_percentage)}
              tone="critical"
            />
          </div>

          <dl className="regional-overview__secondary">
            <div>
              <dt>Top category</dt>
              <dd>
                {mostCommonCategory
                  ? formatCategoryLabel(mostCommonCategory)
                  : "Not available"}
              </dd>
            </div>

            <div>
              <dt>Maximum severity</dt>
              <dd>{overview.max_severity} / 100</dd>
            </div>

            <div>
              <dt>Malicious</dt>
              <dd>{overview.malicious_count}</dd>
            </div>

            <div>
              <dt>Suspicious</dt>
              <dd>{overview.suspicious_count}</dd>
            </div>

            <div>
              <dt>Benign</dt>
              <dd>{overview.benign_count}</dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}

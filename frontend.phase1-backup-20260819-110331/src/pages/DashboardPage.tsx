import { useQuery } from "@tanstack/react-query";

import {
  getHealth,
  getModelInfo,
  getThreatOverview,
  getThreatTimeline,
  getUsageAnalytics,
} from "../api/client";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { Section } from "../components/Section";

export function DashboardPage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
  });

  const model = useQuery({
    queryKey: ["model-info"],
    queryFn: getModelInfo,
  });

  const usage = useQuery({
    queryKey: ["usage"],
    queryFn: getUsageAnalytics,
  });

  const threat = useQuery({
    queryKey: ["threat-overview"],
    queryFn: getThreatOverview,
  });

  const timeline = useQuery({
    queryKey: ["threat-timeline"],
    queryFn: () => getThreatTimeline(),
  });

  const loading =
    health.isLoading ||
    model.isLoading ||
    usage.isLoading ||
    threat.isLoading ||
    timeline.isLoading;

  const error =
    health.error ??
    model.error ??
    usage.error ??
    threat.error ??
    timeline.error;

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
      />
    );
  }

  const f1 =
    model.data?.final_test_metrics?.f1;

  const timelineItems =
    timeline.data?.items ?? [];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">
            SENTINELAI
          </div>

          <h1>
            Intelligence Dashboard
          </h1>

          <p>
            Temporary API integration
            console.
          </p>
        </div>

        <div
          className={
            health.data?.status ===
            "ok"
              ? "status status-ok"
              : "status"
          }
        >
          API {health.data?.status}
        </div>
      </header>

      <Section title="System">
        <div className="metric-grid">
          <MetricCard
            label="Model"
            value={
              model.data
                ?.model_type ?? "—"
            }
            detail={
              model.data
                ?.model_version
            }
          />

          <MetricCard
            label="Test F1"
            value={
              f1 !== undefined
                ? `${(
                    f1 * 100
                  ).toFixed(2)}%`
                : "—"
            }
          />

          <MetricCard
            label="Predictions"
            value={
              usage.data
                ?.total_predictions ??
              0
            }
          />

          <MetricCard
            label="Spam rate"
            value={
              usage.data
                ? `${(
                    usage.data
                      .spam_rate *
                    100
                  ).toFixed(2)}%`
                : "—"
            }
          />
        </div>
      </Section>

      <Section title="Threat intelligence">
        <div className="metric-grid">
          <MetricCard
            label="Investigations"
            value={
              threat.data
                ?.total_investigations ??
              0
            }
          />

          <MetricCard
            label="Critical"
            value={
              threat.data
                ?.critical_count ?? 0
            }
          />

          <MetricCard
            label="Average severity"
            value={
              threat.data
                ?.average_severity ?? 0
            }
          />

          <MetricCard
            label="Malicious"
            value={
              threat.data
                ?.malicious_count ?? 0
            }
          />
        </div>
      </Section>

      <Section title="Threat timeline">
        {timelineItems.length === 0 ? (
          <div className="empty">
            No threat timeline data.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Investigations</th>
                  <th>Critical</th>
                  <th>High</th>
                  <th>Medium</th>
                  <th>Low</th>
                  <th>Severity</th>
                </tr>
              </thead>

              <tbody>
                {timelineItems.map(
                  (item) => (
                    <tr key={item.date}>
                      <td>
                        {item.date}
                      </td>

                      <td>
                        {item.investigations}
                      </td>

                      <td>
                        {item.critical}
                      </td>

                      <td>
                        {item.high}
                      </td>

                      <td>
                        {item.medium}
                      </td>

                      <td>
                        {item.low}
                      </td>

                      <td>
                        {item.average_severity}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

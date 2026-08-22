import { useQuery } from "@tanstack/react-query";

import {
  getThreatCategories,
  getThreatOverview,
  getThreatRiskDistribution,
  getThreatSignals,
  getThreatTimeline,
} from "../api/client";

import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";

export function ThreatIntelligencePage() {
  const overview = useQuery({
    queryKey: ["threat-overview"],
    queryFn: getThreatOverview,
  });

  const risk = useQuery({
    queryKey: ["threat-risk"],
    queryFn: getThreatRiskDistribution,
  });

  const categories = useQuery({
    queryKey: ["threat-categories"],
    queryFn: getThreatCategories,
  });

  const signals = useQuery({
    queryKey: ["threat-signals"],
    queryFn: getThreatSignals,
  });

  const timeline = useQuery({
    queryKey: ["threat-timeline"],
    queryFn: () => getThreatTimeline(),
  });

  const loading =
    overview.isLoading ||
    risk.isLoading ||
    categories.isLoading ||
    signals.isLoading ||
    timeline.isLoading;

  const error =
    overview.error ??
    risk.error ??
    categories.error ??
    signals.error ??
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

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">
            THREAT INTELLIGENCE
          </div>

          <h1>
            Threat Analytics
          </h1>
        </div>
      </header>

      <div className="result-card">
        <h2>
          Overview
        </h2>

        <pre>
          {JSON.stringify(
            overview.data,
            null,
            2,
          )}
        </pre>
      </div>

      <div className="result-card">
        <h2>
          Risk distribution
        </h2>

        <pre>
          {JSON.stringify(
            risk.data,
            null,
            2,
          )}
        </pre>
      </div>

      <div className="result-card">
        <h2>
          Categories
        </h2>

        <pre>
          {JSON.stringify(
            categories.data,
            null,
            2,
          )}
        </pre>
      </div>

      <div className="result-card">
        <h2>
          Signals
        </h2>

        <pre>
          {JSON.stringify(
            signals.data,
            null,
            2,
          )}
        </pre>
      </div>

      <div className="result-card">
        <h2>
          Timeline
        </h2>

        <pre>
          {JSON.stringify(
            timeline.data,
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}

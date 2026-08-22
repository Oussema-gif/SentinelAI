import { useEffect, useState } from "react";

import type {
  RiskLevel,
  ThreatAnalysisResponse,
} from "../../api/types";
import { getSeverityBandLabel } from "../radar/severityColorScale";
import { AdvisoryBox } from "./AdvisoryBox";
import { ConditionsList } from "./ConditionsList";
import { ExtractedLinks } from "./ExtractedLinks";

import "./ForecastCard.css";

interface ForecastCardProps {
  analysis: ThreatAnalysisResponse | null;
  isResolving?: boolean;
}

function getForecastHeadline(
  analysis: ThreatAnalysisResponse,
): string {
  const severity = analysis.severity;
  const riskLevel = analysis.risk_level;

  if (riskLevel === "critical" || severity >= 80) {
    return "Severe threat warning";
  }

  if (riskLevel === "high" || severity >= 60) {
    return "Storm activity detected";
  }

  if (riskLevel === "medium" || severity >= 40) {
    return "Unsettled conditions";
  }

  if (riskLevel === "low" || severity >= 20) {
    return "Light conditions detected";
  }

  return "Clear conditions";
}

function getRiskLevelLabel(riskLevel: RiskLevel): string {
  return riskLevel.replace(/_/g, " ");
}

function getClassifierLabel(label: string): string {
  return label === "spam" ? "Spam classifier" : "Ham classifier";
}

export function ForecastCard({
  analysis,
  isResolving = false,
}: ForecastCardProps) {
  const [visibleFields, setVisibleFields] = useState(0);

  useEffect(() => {
    if (!analysis || isResolving) {
      setVisibleFields(0);
      return;
    }

    setVisibleFields(1);

    const timers = [
      window.setTimeout(() => setVisibleFields(2), 180),
      window.setTimeout(() => setVisibleFields(3), 360),
      window.setTimeout(() => setVisibleFields(4), 540),
    ];

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [analysis, isResolving]);

  if (!analysis) {
    return (
      <section className="forecast-card forecast-card--empty">
        <p className="forecast-card__eyebrow">Forecast</p>

        <h2>Awaiting atmospheric scan</h2>

        <p>
          Analyze a message to generate a threat forecast and technical
          conditions report.
        </p>
      </section>
    );
  }

  const severity = Math.min(100, Math.max(0, analysis.severity));
  const severityColor = `hsl(${Math.max(0, 205 - severity * 1.9)} 78% ${
    severity >= 80 ? 62 : 68
  }%)`;

  return (
    <section
      className={`forecast-card forecast-card--${analysis.risk_level}`}
      aria-labelledby="forecast-card-title"
      style={{
        "--forecast-color": severityColor,
      } as React.CSSProperties}
    >
      <header
        className={`forecast-card__headline ${
          visibleFields >= 1 ? "forecast-card__field--visible" : ""
        }`}
      >
        <div>
          <p className="forecast-card__eyebrow">Threat forecast</p>

          <h2 id="forecast-card-title">
            {getForecastHeadline(analysis)}
          </h2>
        </div>

        <div className="forecast-card__severity">
          <span>Severity</span>

          <strong>{severity}</strong>

          <small>/ 100</small>
        </div>
      </header>

      <div
        className={`forecast-card__summary ${
          visibleFields >= 2 ? "forecast-card__field--visible" : ""
        }`}
      >
        <div>
          <span className="forecast-card__summary-label">
            Conditions
          </span>

          <strong>{getSeverityBandLabel(severity)}</strong>
        </div>

        <div>
          <span className="forecast-card__summary-label">
            Risk level
          </span>

          <strong>{getRiskLevelLabel(analysis.risk_level)}</strong>
        </div>

        <div>
          <span className="forecast-card__summary-label">
            Category
          </span>

          <strong>{analysis.category}</strong>
        </div>
      </div>

      <div
        className={`forecast-card__technical-summary ${
          visibleFields >= 2 ? "forecast-card__field--visible" : ""
        }`}
      >
        <span>
          {getClassifierLabel(analysis.classifier_label)}
        </span>

        <span>
          Model: <code>{analysis.model_version}</code>
        </span>

        {analysis.classifier_decision_score !== null && (
          <span>
            Decision score:{" "}
            <code>
              {analysis.classifier_decision_score.toFixed(4)}
            </code>
          </span>
        )}
      </div>

      <div
        className={`forecast-card__section ${
          visibleFields >= 3 ? "forecast-card__field--visible" : ""
        }`}
      >
        <ConditionsList signals={analysis.signals} />
      </div>

      <div
        className={`forecast-card__section ${
          visibleFields >= 4 ? "forecast-card__field--visible" : ""
        }`}
      >
        <ExtractedLinks links={analysis.links} />

        <AdvisoryBox
          recommendation={analysis.recommendation}
          riskLevel={analysis.risk_level}
        />
      </div>
    </section>
  );
}
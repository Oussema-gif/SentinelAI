import { useState } from "react";

import type { ThreatSignal } from "../../api/types";

import "./ConditionsList.css";

interface ConditionsListProps {
  signals: ThreatSignal[];
}

function formatConfidence(value: number): string {
  const percentage = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return `${percentage}%`;
}

function getWeatherLabel(signal: ThreatSignal): string {
  const normalized = `${signal.type} ${signal.label}`.toLowerCase();

  if (
    normalized.includes("url") ||
    normalized.includes("link") ||
    normalized.includes("shortener")
  ) {
    return "Unsettled link conditions";
  }

  if (
    normalized.includes("urgency") ||
    normalized.includes("urgent") ||
    normalized.includes("pressure")
  ) {
    return "High-pressure language";
  }

  if (
    normalized.includes("financial") ||
    normalized.includes("money") ||
    normalized.includes("payment") ||
    normalized.includes("prize")
  ) {
    return "Financial pressure front";
  }

  if (
    normalized.includes("credential") ||
    normalized.includes("login") ||
    normalized.includes("account")
  ) {
    return "Credential-seeking activity";
  }

  if (normalized.includes("phone") || normalized.includes("contact")) {
    return "Unusual contact conditions";
  }

  return signal.label || signal.type;
}

function getSignalSeverityClass(severity: number): string {
  if (severity >= 0.8) {
    return "conditions-list__signal--critical";
  }

  if (severity >= 0.6) {
    return "conditions-list__signal--high";
  }

  if (severity >= 0.4) {
    return "conditions-list__signal--medium";
  }

  return "conditions-list__signal--low";
}

export function ConditionsList({ signals }: ConditionsListProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (signals.length === 0) {
    return (
      <section
        className="conditions-list"
        aria-labelledby="conditions-list-title"
      >
        <div className="conditions-list__header">
          <div>
            <p className="conditions-list__eyebrow">Atmospheric indicators</p>

            <h3 id="conditions-list-title">No notable conditions detected</h3>
          </div>
        </div>

        <p className="conditions-list__empty">
          The analysis did not return any signal-level indicators.
        </p>
      </section>
    );
  }

  return (
    <section
      className="conditions-list"
      aria-labelledby="conditions-list-title"
    >
      <div className="conditions-list__header">
        <div>
          <p className="conditions-list__eyebrow">Atmospheric indicators</p>

          <h3 id="conditions-list-title">Conditions detected</h3>
        </div>

        <button
          className="conditions-list__toggle"
          type="button"
          aria-expanded={showTechnicalDetails}
          onClick={() => setShowTechnicalDetails((current) => !current)}
        >
          {showTechnicalDetails
            ? "Hide technical details"
            : "Show technical details"}
        </button>
      </div>

      <ul className="conditions-list__items">
        {signals.map((signal, index) => {
          const severity = Math.min(1, Math.max(0, signal.severity));
          const severityClass = getSignalSeverityClass(severity);

          return (
            <li
              className={`conditions-list__signal ${severityClass}`}
              key={`${signal.type}-${signal.label}-${index}`}
            >
              <div className="conditions-list__signal-marker">
                <span aria-hidden="true" />
              </div>

              <div className="conditions-list__signal-content">
                <div className="conditions-list__signal-heading">
                  <p className="conditions-list__weather-label">
                    {getWeatherLabel(signal)}
                  </p>

                  <span className="conditions-list__confidence">
                    {formatConfidence(severity)}
                  </span>
                </div>

                {showTechnicalDetails && (
                  <dl className="conditions-list__technical">
                    <div>
                      <dt>Signal type</dt>
                      <dd>{signal.type}</dd>
                    </div>

                    <div>
                      <dt>Raw label</dt>
                      <dd>{signal.label}</dd>
                    </div>

                    <div>
                      <dt>Evidence</dt>
                      <dd>{signal.evidence}</dd>
                    </div>

                    <div>
                      <dt>Backend severity</dt>
                      <dd>{signal.severity.toFixed(4)}</dd>
                    </div>
                  </dl>
                )}

                {!showTechnicalDetails && (
                  <p className="conditions-list__signal-hint">
                    <code>{signal.type}</code>
                    <span aria-hidden="true"> · </span>
                    {signal.evidence}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

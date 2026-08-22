import type {
  Ref,
} from "react";

import type {
  ThreatAnalysisResponse,
} from "../../api/types";

export type AnalysisPhase =
  | "idle"
  | "packet_stream"
  | "model_processing"
  | "reveal"
  | "forensics"
  | "complete"
  | "error";

type Props = {
  result?: ThreatAnalysisResponse;
  message: string;
  nodeRef?: Ref<HTMLElement>;
  phase: AnalysisPhase;
};

function stateClass(
  severity?: number,
) {
  if (severity === undefined) {
    return "analysis-field-processing";
  }

  if (severity >= 80) {
    return "analysis-field-critical";
  }

  if (severity >= 50) {
    return "analysis-field-warning";
  }

  return "analysis-field-safe";
}

function StageTick({
  label,
  active,
  complete,
}: {
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div
      className={[
        "analysis-stage-tick",
        active
          ? "is-active"
          : "",
        complete
          ? "is-complete"
          : "",
      ].join(" ")}
    >
      <span className="analysis-stage-dot" />

      <span>
        {label}
      </span>
    </div>
  );
}

export function AnalysisField({
  result,
  message,
  nodeRef,
  phase,
}: Props) {
  const processing =
    phase === "packet_stream" ||
    phase === "model_processing";

  const reveal =
    phase === "reveal" ||
    phase === "forensics" ||
    phase === "complete";

  const showForensics =
    phase === "forensics" ||
    phase === "complete";

  const showRecommendation =
    phase === "complete";

  return (
    <section
      ref={nodeRef}
      className={[
        "analysis-field-spatial",
        stateClass(
          result?.severity,
        ),
        `analysis-phase-${phase}`,
      ].join(" ")}
    >
      <div className="analysis-field-scanline" />

      <div className="analysis-field-header">
        <div>
          <span className="analysis-field-eyebrow">
            LIVE INVESTIGATION / 01
          </span>

          <h2>
            Threat Analysis
          </h2>
        </div>

        <span className="analysis-field-status">
          {processing
            ? "PROCESSING"
            : result
              ? result.risk_level.toUpperCase()
              : "INITIALIZING"}
        </span>
      </div>

      <div className="analysis-sequence-stages">
        <StageTick
          label="INGEST"
          active={
            phase !== "idle"
          }
          complete={
            phase !==
              "packet_stream" &&
            phase !== "idle"
          }
        />

        <StageTick
          label="MODEL"
          active={
            phase ===
              "model_processing" ||
            reveal ||
            showForensics
          }
          complete={
            reveal ||
            showForensics
          }
        />

        <StageTick
          label="THREAT"
          active={
            reveal ||
            showForensics
          }
          complete={
            showForensics
          }
        />

        <StageTick
          label="FORENSICS"
          active={
            showForensics
          }
          complete={
            showRecommendation
          }
        />
      </div>

      <div className="analysis-field-message">
        {message}
      </div>

      {processing && (
        <div className="analysis-processing-core">
          <div className="analysis-processing-ring">
            <span />
          </div>

          <div>
            <span className="processing-label">
              {phase === "packet_stream"
                ? "ROUTING MESSAGE PACKET"
                : "RUNNING CLASSIFIER ENGINE"}
            </span>

            <strong>
              {phase ===
              "packet_stream"
                ? "MESSAGE → ENGINE"
                : "SVM / THREAT CORRELATION"}
            </strong>
          </div>
        </div>
      )}

      {result && (
        <>
          <div
            className={[
              "analysis-field-primary",
              reveal
                ? "reveal-visible"
                : "",
            ].join(" ")}
          >
            <div>
              <span>
                SEVERITY
              </span>

              <strong>
                {result.severity}
              </strong>
            </div>

            <div>
              <span>
                CATEGORY
              </span>

              <strong>
                {result.category}
              </strong>
            </div>

            <div>
              <span>
                CLASSIFIER
              </span>

              <strong>
                {result.classifier_label}
              </strong>
            </div>
          </div>

          <div
            className={[
              "analysis-field-grid",
              reveal
                ? "reveal-visible"
                : "",
            ].join(" ")}
          >
            <div>
              <span>
                THREAT
              </span>

              <strong>
                {result.threat_label}
              </strong>
            </div>

            <div>
              <span>
                MODEL
              </span>

              <strong>
                {result.model_version}
              </strong>
            </div>

            <div>
              <span>
                DECISION SCORE
              </span>

              <strong>
                {result.classifier_decision_score.toFixed(
                  3,
                )}
              </strong>
            </div>
          </div>

          {showForensics &&
            result.signals?.length > 0 && (
              <div className="analysis-field-block forensic-reveal">
                <div className="analysis-field-block-title">
                  SIGNALS
                </div>

                {result.signals.map(
                  (
                    signal,
                    index,
                  ) => (
                    <div
                      className="analysis-signal"
                      key={`${signal.type}-${index}`}
                    >
                      <div>
                        <strong>
                          {
                            signal.label
                          }
                        </strong>

                        <span>
                          {
                            signal.evidence
                          }
                        </span>
                      </div>

                      <em>
                        {Math.round(
                          signal.severity *
                            100,
                        )}
                      </em>
                    </div>
                  ),
                )}
              </div>
            )}

          {showForensics &&
            result.links?.length > 0 && (
              <div className="analysis-field-block forensic-reveal">
                <div className="analysis-field-block-title">
                  EXTRACTED LINKS
                </div>

                {result.links.map(
                  (link) => (
                    <div
                      className="analysis-link"
                      key={link.url}
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
            )}

          {showRecommendation && (
            <div className="analysis-field-recommendation forensic-reveal">
              <span>
                RECOMMENDATION
              </span>

              <p>
                {
                  result.recommendation
                }
              </p>
            </div>
          )}
        </>
      )}

      {phase === "error" && (
        <div className="analysis-error-sequence">
          ANALYSIS REQUEST FAILED
        </div>
      )}
    </section>
  );
}

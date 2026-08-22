import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  analyzeThreat,
  createPrediction,
} from "../api/client";

import type {
  PredictionResponse,
  ThreatAnalysisResponse,
} from "../api/types";

export function PredictionsPage() {
  const [text, setText] = useState("");

  const prediction = useMutation<
    PredictionResponse,
    Error,
    void
  >({
    mutationFn: () =>
      createPrediction({
        text,
        top_k: 6,
      }),
  });

  const threat = useMutation<
    ThreatAnalysisResponse,
    Error,
    void
  >({
    mutationFn: () =>
      analyzeThreat(text, 6),
  });

  const analyzing =
    prediction.isPending ||
    threat.isPending;

  function runAnalysis() {
    if (!text.trim() || analyzing) {
      return;
    }

    prediction.mutate();
    threat.mutate();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">
            SENTINELAI
          </div>

          <h1>
            Message Analysis
          </h1>

          <p>
            Direct backend integration
            test.
          </p>
        </div>
      </header>

      <div className="analysis-form">
        <label htmlFor="message">
          Message
        </label>

        <textarea
          id="message"
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder="Paste an SMS message here..."
          disabled={analyzing}
        />

        <button
          type="button"
          onClick={runAnalysis}
          disabled={
            !text.trim() || analyzing
          }
        >
          {analyzing
            ? "Analyzing..."
            : "Analyze message"}
        </button>
      </div>

      {(prediction.error ||
        threat.error) && (
        <div className="state error-state">
          {prediction.error?.message ??
            threat.error?.message}
        </div>
      )}

      {prediction.data && (
        <div className="result-card">
          <h2>
            Prediction
          </h2>

          <div className="result-grid">
            <div>
              <span>
                Label
              </span>

              <strong>
                {prediction.data.label}
              </strong>
            </div>

            <div>
              <span>
                Decision score
              </span>

              <strong>
                {prediction.data
                  .decision_score ??
                  "—"}
              </strong>
            </div>

            <div>
              <span>
                Model
              </span>

              <strong>
                {
                  prediction.data
                    .model_version
                }
              </strong>
            </div>
          </div>
        </div>
      )}

      {threat.data && (
        <div className="result-card">
          <h2>
            Threat investigation
          </h2>

          <pre>
            {JSON.stringify(
              threat.data,
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

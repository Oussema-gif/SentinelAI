import type { ModelInfoResponse } from "../../api/types";

import "./ModelInfoPanel.css";

interface ModelInfoPanelProps {
  model: ModelInfoResponse | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

function formatMetricName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatMetricValue(value: number): string {
  if (value >= 0 && value <= 1) {
    return `${(value * 100).toFixed(2)}%`;
  }

  return value.toFixed(4);
}

function formatTrainingDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export function ModelInfoPanel({
  model,
  isLoading = false,
  error = null,
  onRefresh,
}: ModelInfoPanelProps) {
  return (
    <section
      className="model-info"
      aria-labelledby="model-info-title"
    >
      <header className="model-info__header">
        <div>
          <p className="model-info__eyebrow">
            Instrument calibration
          </p>

          <h2 id="model-info-title">Model information</h2>
        </div>

        {onRefresh && (
          <button
            className="model-info__refresh"
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Refresh"}
          </button>
        )}
      </header>

      {error && (
        <p className="model-info__error" role="alert">
          {error}
        </p>
      )}

      {isLoading && !model && (
        <p className="model-info__empty">
          Loading model calibration data...
        </p>
      )}

      {!isLoading && !error && !model && (
        <p className="model-info__empty">
          Model information is not currently available.
        </p>
      )}

      {model && (
        <>
          <dl className="model-info__identity">
            <div>
              <dt>Model version</dt>
              <dd>
                <code>{model.model_version}</code>
              </dd>
            </div>

            <div>
              <dt>Model type</dt>
              <dd>{model.model_type}</dd>
            </div>

            <div>
              <dt>Preprocessing</dt>
              <dd>{model.preprocessing_version}</dd>
            </div>

            <div>
              <dt>Training date</dt>
              <dd>{formatTrainingDate(model.training_date_utc)}</dd>
            </div>
          </dl>

          <div className="model-info__metrics">
            <h3>Held-out metrics</h3>

            <dl>
              {Object.entries(model.final_test_metrics).map(
                ([name, value]) => (
                  <div key={name}>
                    <dt>{formatMetricName(name)}</dt>

                    <dd>{formatMetricValue(value)}</dd>
                  </div>
                ),
              )}
            </dl>
          </div>

          <details className="model-info__details">
            <summary>Technical metadata</summary>

            <div className="model-info__details-content">
              <div>
                <h3>Hyperparameters</h3>

                <pre>
                  {JSON.stringify(
                    model.hyperparameters,
                    null,
                    2,
                  )}
                </pre>
              </div>

              <div>
                <h3>Calibration</h3>

                <pre>
                  {JSON.stringify(model.calibration, null, 2)}
                </pre>
              </div>

              <div>
                <h3>Dataset fingerprint</h3>

                <code className="model-info__hash">
                  {model.dataset_sha256}
                </code>
              </div>
            </div>
          </details>

          <p className="model-info__note">
            Classifier decision scores are model evidence, not calibrated
            probabilities. The backend does not approve them for display
            as confidence values.
          </p>
        </>
      )}
    </section>
  );
}
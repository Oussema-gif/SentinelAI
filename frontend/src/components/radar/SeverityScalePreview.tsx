import {
  getSeverityBandLabel,
  getSeverityColor,
} from "./severityColorScale";

import "./SeverityScalePreview.css";

const SEVERITY_VALUES = Array.from(
  { length: 101 },
  (_, index) => index,
);

const REFERENCE_VALUES = [0, 19, 20, 39, 40, 59, 60, 79, 80, 100] as const;

export function SeverityScalePreview() {
  return (
    <section
      className="severity-scale-preview"
      aria-labelledby="severity-scale-preview-title"
    >
      <header className="severity-scale-preview__header">
        <p className="severity-scale-preview__eyebrow">
          Radar color calibration
        </p>

        <h2 id="severity-scale-preview-title">
          Continuous severity scale
        </h2>

        <p>
          The radar cell color is interpolated from the numeric severity
          score, from clear conditions at 0 to severe storm conditions at 100.
        </p>
      </header>

      <div
        className="severity-scale-preview__gradient"
        aria-label="Severity color gradient from 0 to 100"
      >
        {SEVERITY_VALUES.map((severity) => (
          <span
            key={severity}
            className="severity-scale-preview__step"
            style={{
              backgroundColor: getSeverityColor(severity),
            }}
          />
        ))}
      </div>

      <div
        className="severity-scale-preview__markers"
        aria-label="Severity scale reference points"
      >
        {REFERENCE_VALUES.map((severity) => (
          <div
            key={severity}
            className="severity-scale-preview__marker"
            style={{
              left: `${severity}%`,
            }}
          >
            <span className="severity-scale-preview__marker-value">
              {severity}
            </span>

            <span className="severity-scale-preview__marker-label">
              {getSeverityBandLabel(severity)}
            </span>

            <span
              className="severity-scale-preview__marker-swatch"
              style={{
                backgroundColor: getSeverityColor(severity),
              }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>

      <div className="severity-scale-preview__examples">
        {REFERENCE_VALUES.map((severity) => (
          <article
            key={severity}
            className="severity-scale-preview__example"
          >
            <span
              className="severity-scale-preview__example-dot"
              style={{
                backgroundColor: getSeverityColor(severity),
              }}
              aria-hidden="true"
            />

            <div>
              <strong>{severity}</strong>

              <span>{getSeverityBandLabel(severity)}</span>
            </div>

            <code>{getSeverityColor(severity)}</code>
          </article>
        ))}
      </div>
    </section>
  );
}
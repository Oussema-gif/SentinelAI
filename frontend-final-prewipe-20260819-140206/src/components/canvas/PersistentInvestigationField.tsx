import type {
  InvestigationRecord,
} from "../../canvas/investigations";

type Props = {
  investigation: InvestigationRecord;
};

export function PersistentInvestigationField({
  investigation,
}: Props) {
  const {
    result,
    message,
  } = investigation;

  const severityClass =
    result.severity >= 80
      ? "analysis-field-critical"
      : result.severity >= 50
        ? "analysis-field-warning"
        : "analysis-field-safe";

  return (
    <section
      className={`persistent-investigation-field ${severityClass}`}
      style={{
        left:
          investigation.x,
        top:
          investigation.y,
        width: 1050,
      }}
    >
      <div className="persistent-investigation-header">
        <div>
          <span>
            COMPLETED INVESTIGATION
          </span>

          <h3>
            {result.category}
          </h3>
        </div>

        <strong>
          {result.severity}
        </strong>
      </div>

      <div className="persistent-investigation-meta">
        <span>
          {result.risk_level.toUpperCase()}
        </span>

        <span>
          {result.threat_label}
        </span>

        <span>
          {result.model_version}
        </span>
      </div>

      <div className="persistent-investigation-message">
        {message}
      </div>

      <div className="persistent-investigation-signals">
        {result.signals?.map(
          (
            signal,
            index,
          ) => (
            <div
              key={`${signal.type}-${index}`}
            >
              <span>
                {signal.label}
              </span>

              <strong>
                {Math.round(
                  signal.severity * 100,
                )}
              </strong>
            </div>
          ),
        )}
      </div>

      <div className="persistent-investigation-recommendation">
        {result.recommendation}
      </div>
    </section>
  );
}

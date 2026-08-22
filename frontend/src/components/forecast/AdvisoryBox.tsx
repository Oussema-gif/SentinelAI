interface AdvisoryBoxProps {
  recommendation: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
}

import "./AdvisoryBox.css";

export function AdvisoryBox({
  recommendation,
  riskLevel = "medium",
}: AdvisoryBoxProps) {
  const normalizedRecommendation = recommendation.trim();

  if (!normalizedRecommendation) {
    return null;
  }

  return (
    <aside
      className={`advisory-box advisory-box--${riskLevel}`}
      aria-labelledby="advisory-box-title"
    >
      <div className="advisory-box__icon" aria-hidden="true">
        <span />
      </div>

      <div className="advisory-box__content">
        <p className="advisory-box__eyebrow">Advisory</p>

        <h3 id="advisory-box-title">Recommended action</h3>

        <p className="advisory-box__recommendation">
          {normalizedRecommendation}
        </p>
      </div>
    </aside>
  );
}
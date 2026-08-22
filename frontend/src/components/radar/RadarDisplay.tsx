import { useEffect, useId, useMemo, useState } from "react";

import type { RiskLevel } from "../../api/types";
import {
  clampSeverity,
  getSeverityColor,
  isCriticalSeverity,
} from "./severityColorScale";
import { LightningFlash } from "./LightningFlash";
import { StormCell } from "./StormCell";

import "./RadarDisplay.css";
import "./StormCell.css";

interface RadarDisplayProps {
  severity?: number | null;
  riskLevel?: RiskLevel | null;
  isAnalyzing?: boolean;
  hasResult?: boolean;
}

const RADAR_SIZE = 300;
const RADAR_CENTER = RADAR_SIZE / 2;
const RANGE_RINGS = [42, 76, 110, 144];
const SAFE_DEFAULT_SEVERITY = 0;

function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updatePreference = () => {
      setReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return reducedMotion;
}

function getAnimationDuration(
  severity: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) {
    return 0;
  }

  if (severity >= 80) {
    return 3_500;
  }

  if (severity >= 60) {
    return 2_900;
  }

  if (severity >= 40) {
    return 2_400;
  }

  return 1_650;
}

function getRiskLabel(
  severity: number,
  riskLevel: RiskLevel | null | undefined,
): string {
  if (riskLevel) {
    return riskLevel.replace(/_/g, " ");
  }

  if (severity >= 80) {
    return "critical";
  }

  if (severity >= 60) {
    return "high";
  }

  if (severity >= 40) {
    return "medium";
  }

  return "low";
}

export function RadarDisplay({
  severity = null,
  riskLevel = null,
  isAnalyzing = false,
  hasResult = false,
}: RadarDisplayProps) {
  const reducedMotion = useReducedMotion();
  const radarTitleId = useId();
  const gradientId = useId().replace(/:/g, "");

  const targetSeverity = clampSeverity(severity ?? SAFE_DEFAULT_SEVERITY);

  const [displayedSeverity, setDisplayedSeverity] = useState(targetSeverity);
  const [isResolving, setIsResolving] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  const targetColor = getSeverityColor(targetSeverity);
  const critical = isCriticalSeverity(targetSeverity);
  const animationDuration = getAnimationDuration(targetSeverity, reducedMotion);

  useEffect(() => {
    if (isAnalyzing) {
      setIsResolving(true);
      setFlashActive(false);

      if (reducedMotion) {
        setDisplayedSeverity(targetSeverity);
      } else {
        setDisplayedSeverity(0);
      }

      return;
    }

    if (!hasResult) {
      setIsResolving(false);
      setFlashActive(false);
      setDisplayedSeverity(targetSeverity);
      return;
    }

    if (reducedMotion || animationDuration === 0) {
      setDisplayedSeverity(targetSeverity);
      setIsResolving(false);
      setFlashActive(false);
      return;
    }

    setIsResolving(true);
    setFlashActive(false);
    setDisplayedSeverity(0);

    const startTime = window.performance.now();
    let frameId = 0;

    function animate(currentTime: number) {
      const progress = Math.min(
        1,
        (currentTime - startTime) / animationDuration,
      );

      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayedSeverity(targetSeverity * easedProgress);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
        return;
      }

      setDisplayedSeverity(targetSeverity);
      setIsResolving(false);

      if (critical) {
        setFlashActive(true);

        window.setTimeout(() => {
          setFlashActive(false);
        }, 1_650);
      }
    }

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    animationDuration,
    critical,
    hasResult,
    isAnalyzing,
    reducedMotion,
    targetSeverity,
  ]);

  const rangeRingElements = useMemo(
    () =>
      RANGE_RINGS.map((radius) => (
        <circle
          key={radius}
          className="radar-display__range-ring"
          cx={RADAR_CENTER}
          cy={RADAR_CENTER}
          r={radius}
        />
      )),
    [],
  );

  const displayedColor = getSeverityColor(displayedSeverity);
  const riskLabel = getRiskLabel(targetSeverity, riskLevel);

  return (
    <section
      className={`radar-display ${
        isAnalyzing ? "radar-display--analyzing" : ""
      } ${hasResult ? "radar-display--has-result" : ""}`}
      aria-labelledby={radarTitleId}
    >
      <div className="radar-display__heading">
        <div>
          <p className="radar-display__eyebrow">Atmospheric radar</p>

          <h2 id={radarTitleId}>Threat intensity</h2>
        </div>
      </div>

      <div
        className="radar-display__stage"
        style={
          {
            "--radar-color": targetColor,
          } as React.CSSProperties
        }
      >
        <div className="radar-display__atmosphere" aria-hidden="true" />

        <svg
          className="radar-display__svg"
          viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
          role="img"
          aria-label={`Threat radar showing severity ${Math.round(
            displayedSeverity,
          )} out of 100`}
        >
          <defs>
            <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={displayedColor} stopOpacity="0.2" />

              <stop
                offset="75%"
                stopColor={displayedColor}
                stopOpacity="0.045"
              />

              <stop offset="100%" stopColor={displayedColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle
            className="radar-display__background"
            cx={RADAR_CENTER}
            cy={RADAR_CENTER}
            r={RADAR_CENTER - 2}
            fill={`url(#${gradientId})`}
          />

          <g className="radar-display__range-rings">{rangeRingElements}</g>

          <path
            className="radar-display__crosshair"
            d={`M ${RADAR_CENTER} 8 V ${RADAR_SIZE - 8} M 8 ${RADAR_CENTER} H ${
              RADAR_SIZE - 8
            }`}
          />

          <circle
            className="radar-display__center-point"
            cx={RADAR_CENTER}
            cy={RADAR_CENTER}
            r="2.5"
            fill={displayedColor}
          />

          <g
            className={`radar-display__sweep ${
              isAnalyzing ? "radar-display__sweep--active" : ""
            }`}
          >
            <path
              d={`M ${RADAR_CENTER} ${RADAR_CENTER} L ${RADAR_CENTER} 10`}
            />

            <path
              d={`M ${RADAR_CENTER} ${RADAR_CENTER} L ${
                RADAR_CENTER
              } 10 L 265 58 Z`}
            />
          </g>

          <StormCell
            severity={displayedSeverity}
            isResolving={isResolving}
            isActive={isAnalyzing || isResolving}
            size={RADAR_SIZE}
          />
        </svg>

        <LightningFlash
          active={flashActive}
          critical={critical}
          reducedMotion={reducedMotion}
        />

        <div className="radar-display__status">
          <span
            className="radar-display__status-dot"
            style={{
              backgroundColor: displayedColor,
            }}
            aria-hidden="true"
          />

          <span>
            {isAnalyzing
              ? "Scanning"
              : hasResult
                ? `${riskLabel} conditions`
                : "Radar idle"}
          </span>
        </div>
      </div>
    </section>
  );
}

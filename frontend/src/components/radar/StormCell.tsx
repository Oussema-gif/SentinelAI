import { useId } from "react";

import {
  clampSeverity,
  getSeverityCellRadius,
  getSeverityColor,
  isCriticalSeverity,
} from "./severityColorScale";

interface StormCellProps {
  severity: number;
  isResolving?: boolean;
  isActive?: boolean;
  size?: number;
}

const RADAR_CENTER = 150;

export function StormCell({
  severity,
  isResolving = false,
  isActive = false,
  size = 300,
}: StormCellProps) {
  const gradientId = useId().replace(/:/g, "");
  const normalizedSeverity = clampSeverity(severity);
  const color = getSeverityColor(normalizedSeverity);
  const radius = getSeverityCellRadius(normalizedSeverity);
  const critical = isCriticalSeverity(normalizedSeverity);

  const resolvingRadius = isResolving
    ? Math.max(8, radius * 0.14)
    : radius;

  const opacity = isResolving ? 0.42 : 0.86;
  const pulseClass = isActive
    ? "storm-cell__group--active"
    : "";

  return (
    <g
      className={`storm-cell__group ${pulseClass}`}
      aria-label={`Storm cell severity ${normalizedSeverity} out of 100`}
    >
      <defs>
        <radialGradient
          id={gradientId}
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop
            offset="0%"
            stopColor={critical ? "#FFFFFF" : color}
            stopOpacity={critical ? 0.88 : 0.78}
          />

          <stop
            offset="42%"
            stopColor={color}
            stopOpacity={0.68}
          />

          <stop
            offset="82%"
            stopColor={color}
            stopOpacity={0.24}
          />

          <stop
            offset="100%"
            stopColor={color}
            stopOpacity={0}
          />
        </radialGradient>
      </defs>

      <circle
        className="storm-cell__outer-glow"
        cx={RADAR_CENTER}
        cy={RADAR_CENTER}
        r={resolvingRadius * 1.45}
        fill={color}
        opacity={opacity * 0.36}
      />

      <circle
        className="storm-cell__body"
        cx={RADAR_CENTER}
        cy={RADAR_CENTER}
        r={resolvingRadius}
        fill={`url(#${gradientId})`}
        opacity={opacity}
      />

      <circle
        className="storm-cell__core"
        cx={RADAR_CENTER}
        cy={RADAR_CENTER}
        r={Math.max(3, resolvingRadius * 0.24)}
        fill={critical ? "#FFFFFF" : color}
        opacity={isResolving ? 0.54 : 0.82}
      />

      {critical && !isResolving && (
        <g
          className="storm-cell__lightning"
          aria-hidden="true"
        >
          <path
            d="M151 118 L139 151 L150 148 L143 181 L165 143 L153 146 Z"
            fill="#FFFFFF"
            opacity="0.86"
          />

          <path
            d="M111 142 L104 155 L111 154 L108 166 L118 151 L112 153 Z"
            fill="#FFFFFF"
            opacity="0.5"
          />
        </g>
      )}

      <circle
        className="storm-cell__severity-outline"
        cx={RADAR_CENTER}
        cy={RADAR_CENTER}
        r={resolvingRadius * 0.94}
        fill="none"
        stroke={color}
        strokeWidth={Math.max(1, size / 300)}
        opacity={isActive ? 0.9 : 0.5}
      />
    </g>
  );
}
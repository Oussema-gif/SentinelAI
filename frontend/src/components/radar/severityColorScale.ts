export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

export interface SeverityColorStop {
  severity: number;
  color: string;
}

export const SEVERITY_COLOR_STOPS: readonly SeverityColorStop[] = [
  { severity: 0, color: "#4FC3F7" },
  { severity: 19, color: "#4FC3F7" },
  { severity: 20, color: "#81C7B4" },
  { severity: 39, color: "#81C7B4" },
  { severity: 40, color: "#F4D35E" },
  { severity: 59, color: "#F4D35E" },
  { severity: 60, color: "#F0A050" },
  { severity: 79, color: "#F0A050" },
  { severity: 80, color: "#FF4655" },
  { severity: 100, color: "#FF4655" },
] as const;

export const LIGHTNING_ACCENT_COLOR = "#FFFFFF";

export function clampSeverity(severity: number): number {
  if (!Number.isFinite(severity)) {
    return 0;
  }

  return Math.min(100, Math.max(0, severity));
}

export function hexToRgb(hex: string): RgbColor {
  const normalized = hex.replace("#", "");

  if (!/^[\da-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected a six-digit hex color, received ${hex}.`);
  }

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex(color: RgbColor): string {
  const toHex = (value: number) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`.toUpperCase();
}

export function interpolateColor(
  start: RgbColor,
  end: RgbColor,
  progress: number,
): RgbColor {
  const boundedProgress = Math.min(1, Math.max(0, progress));

  return {
    red: start.red + (end.red - start.red) * boundedProgress,
    green: start.green + (end.green - start.green) * boundedProgress,
    blue: start.blue + (end.blue - start.blue) * boundedProgress,
  };
}

function findColorBounds(
  severity: number,
): {
  lower: SeverityColorStop;
  upper: SeverityColorStop;
} {
  const normalizedSeverity = clampSeverity(severity);

  for (let index = 0; index < SEVERITY_COLOR_STOPS.length - 1; index += 1) {
    const lower = SEVERITY_COLOR_STOPS[index];
    const upper = SEVERITY_COLOR_STOPS[index + 1];

    if (
      normalizedSeverity >= lower.severity &&
      normalizedSeverity <= upper.severity
    ) {
      return {
        lower,
        upper,
      };
    }
  }

  const lastStop = SEVERITY_COLOR_STOPS.at(-1);

  if (!lastStop) {
    throw new Error("Severity color scale must contain at least one stop.");
  }

  return {
    lower: lastStop,
    upper: lastStop,
  };
}

export function getSeverityColor(severity: number): string {
  const normalizedSeverity = clampSeverity(severity);
  const { lower, upper } = findColorBounds(normalizedSeverity);

  if (lower.severity === upper.severity) {
    return upper.color;
  }

  const progress =
    (normalizedSeverity - lower.severity) /
    (upper.severity - lower.severity);

  return rgbToHex(
    interpolateColor(
      hexToRgb(lower.color),
      hexToRgb(upper.color),
      progress,
    ),
  );
}

export function getSeverityBandLabel(severity: number): string {
  const normalizedSeverity = clampSeverity(severity);

  if (normalizedSeverity <= 19) {
    return "Clear sky";
  }

  if (normalizedSeverity <= 39) {
    return "Light cloud";
  }

  if (normalizedSeverity <= 59) {
    return "Overcast";
  }

  if (normalizedSeverity <= 79) {
    return "Storm forming";
  }

  return "Severe storm";
}

export function getSeverityCellRadius(
  severity: number,
  options: {
    minimum?: number;
    maximum?: number;
  } = {},
): number {
  const minimum = options.minimum ?? 10;
  const maximum = options.maximum ?? 82;
  const normalizedSeverity = clampSeverity(severity) / 100;

  return minimum + (maximum - minimum) * normalizedSeverity;
}

export function isCriticalSeverity(severity: number): boolean {
  return clampSeverity(severity) >= 80;
}
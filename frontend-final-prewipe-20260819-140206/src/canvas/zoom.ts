import type {
  ZoomLevel,
} from "./types";

/*
 * Semantic zoom bands:
 *
 * MACRO:
 *   zoom < 0.62
 *
 * MESO:
 *   0.62 <= zoom < 1.10
 *
 * MICRO:
 *   zoom >= 1.10
 *
 * Hysteresis prevents rapid representation flicker
 * when the camera hovers around a threshold.
 */
export const ZOOM_THRESHOLDS = {
  macroMax: 0.62,
  mesoMax: 1.10,

  /*
   * Re-entering a lower band requires moving
   * slightly farther away from the boundary.
   */
  macroReentry: 0.56,
  mesoReentry: 1.04,

  /*
   * Entering a higher band requires moving
   * slightly farther into that band.
   */
  macroExit: 0.68,
  mesoExit: 1.16,
} as const;

export function getZoomLevel(
  zoom: number,
): ZoomLevel {
  if (
    zoom <
    ZOOM_THRESHOLDS.macroMax
  ) {
    return "macro";
  }

  if (
    zoom <
    ZOOM_THRESHOLDS.mesoMax
  ) {
    return "meso";
  }

  return "micro";
}

/**
 * Apply hysteresis against the previous semantic band.
 *
 * Example:
 * - currently macro
 * - camera moves to 0.64
 * - remain macro
 * - camera reaches 0.68
 * - enter meso
 *
 * Likewise at the meso/micro boundary.
 */
export function resolveHystereticZoomLevel(
  zoom: number,
  previous: ZoomLevel,
): ZoomLevel {
  switch (previous) {
    case "macro":
      if (
        zoom <
        ZOOM_THRESHOLDS.macroExit
      ) {
        return "macro";
      }

      if (
        zoom <
        ZOOM_THRESHOLDS.mesoMax
      ) {
        return "meso";
      }

      return "micro";

    case "meso":
      if (
        zoom <
        ZOOM_THRESHOLDS.macroReentry
      ) {
        return "macro";
      }

      if (
        zoom <
        ZOOM_THRESHOLDS.mesoExit
      ) {
        return "meso";
      }

      return "micro";

    case "micro":
      if (
        zoom >=
        ZOOM_THRESHOLDS.mesoReentry
      ) {
        return "micro";
      }

      if (
        zoom >=
        ZOOM_THRESHOLDS.macroMax
      ) {
        return "meso";
      }

      return "macro";
  }
}

export function isMacro(
  zoom: number,
): boolean {
  return (
    getZoomLevel(zoom) ===
    "macro"
  );
}

export function isMeso(
  zoom: number,
): boolean {
  return (
    getZoomLevel(zoom) ===
    "meso"
  );
}

export function isMicro(
  zoom: number,
): boolean {
  return (
    getZoomLevel(zoom) ===
    "micro"
  );
}

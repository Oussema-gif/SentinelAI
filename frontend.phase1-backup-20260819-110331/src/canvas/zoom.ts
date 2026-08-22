import type { ZoomLevel } from "./types";

export const ZOOM_THRESHOLDS = {
  macroMax: 0.65,
  mesoMax: 1.1,
};

export function getZoomLevel(
  zoom: number,
): ZoomLevel {
  if (
    zoom < ZOOM_THRESHOLDS.macroMax
  ) {
    return "macro";
  }

  if (
    zoom < ZOOM_THRESHOLDS.mesoMax
  ) {
    return "meso";
  }

  return "micro";
}

export function isAtLeastMeso(
  zoom: number,
): boolean {
  return (
    getZoomLevel(zoom) !==
    "macro"
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

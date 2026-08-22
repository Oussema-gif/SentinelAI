export type SemanticZoomLevel =
  | "strategic"
  | "operational"
  | "analytical"
  | "evidence";

export function getSemanticZoomLevel(
  zoom: number,
): SemanticZoomLevel {
  if (zoom < 0.55) {
    return "strategic";
  }

  if (zoom < 0.85) {
    return "operational";
  }

  if (zoom < 1.2) {
    return "analytical";
  }

  return "evidence";
}

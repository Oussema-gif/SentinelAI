import type {
  CSSProperties,
} from "react";

import type {
  Camera,
} from "./types";

type Props = {
  camera: Camera;
};

export function AdaptiveGrid({
  camera,
}: Props) {
  const macroOpacity = Math.min(
    1,
    Math.max(
      0.18,
      camera.zoom * 1.35,
    ),
  );

  const microOpacity = Math.min(
    1,
    Math.max(
      0,
      (camera.zoom - 0.55) / 0.9,
    ),
  );

  const style = {
    "--grid-x": `${camera.x}px`,
    "--grid-y": `${camera.y}px`,
    "--zoom": camera.zoom,
    "--macro-opacity":
      macroOpacity,
    "--micro-opacity":
      microOpacity,
  } as CSSProperties;

  return (
    <div
      className="adaptive-grid"
      style={style}
      aria-hidden="true"
    >
      <div className="adaptive-grid__major" />
      <div className="adaptive-grid__minor" />
      <div className="adaptive-grid__dots" />

      <div className="adaptive-grid__crosshair adaptive-grid__crosshair--x" />
      <div className="adaptive-grid__crosshair adaptive-grid__crosshair--y" />
    </div>
  );
}

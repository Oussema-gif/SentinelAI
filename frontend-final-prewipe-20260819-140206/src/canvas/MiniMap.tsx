import type { CSSProperties } from "react";

import type { ThreatAnalysisResponse } from "../api/types";
import type {
  Camera,
  CanvasNode,
  ViewportSize,
} from "./types";

import { WORLD } from "./nodes";
import { clamp } from "./geometry";

type Props = {
  camera: Camera;
  viewportSize: ViewportSize;
  nodes: CanvasNode[];
  analysisResult?: ThreatAnalysisResponse;
  onFocusNode?: (node: CanvasNode) => void;
};

const MINIMAP_WIDTH = 240;
const MINIMAP_HEIGHT = 150;

function nodeClass(
  kind: CanvasNode["kind"],
) {
  return `minimap-node minimap-node-${kind}`;
}

export function MiniMap({
  camera,
  viewportSize,
  nodes,
  analysisResult,
  onFocusNode,
}: Props) {
  const worldScale = Math.min(
    MINIMAP_WIDTH / WORLD.width,
    MINIMAP_HEIGHT / WORLD.height,
  );

  const renderedWorldWidth =
    WORLD.width * worldScale;

  const renderedWorldHeight =
    WORLD.height * worldScale;

  const offsetX =
    (MINIMAP_WIDTH -
      renderedWorldWidth) /
    2;

  const offsetY =
    (MINIMAP_HEIGHT -
      renderedWorldHeight) /
    2;

  const visibleWorldWidth =
    viewportSize.width /
    camera.zoom;

  const visibleWorldHeight =
    viewportSize.height /
    camera.zoom;

  const viewportWorldX =
    -camera.x /
    camera.zoom;

  const viewportWorldY =
    -camera.y /
    camera.zoom;

  const viewportX = clamp(
    viewportWorldX,
    0,
    Math.max(
      0,
      WORLD.width -
        visibleWorldWidth,
    ),
  );

  const viewportY = clamp(
    viewportWorldY,
    0,
    Math.max(
      0,
      WORLD.height -
        visibleWorldHeight,
    ),
  );

  const viewportWidth = clamp(
    visibleWorldWidth *
      worldScale,
    8,
    renderedWorldWidth,
  );

  const viewportHeight = clamp(
    visibleWorldHeight *
      worldScale,
    8,
    renderedWorldHeight,
  );

  const viewportStyle: CSSProperties = {
    left:
      offsetX +
      viewportX *
        worldScale,
    top:
      offsetY +
      viewportY *
        worldScale,
    width:
      viewportWidth,
    height:
      viewportHeight,
  };

  const activeThreat =
    analysisResult?.severity ?? 0;

  return (
    <aside
      className={`zui-minimap ${
        activeThreat >= 80
          ? "has-critical-threat"
          : activeThreat >= 50
            ? "has-warning-threat"
            : ""
      }`}
      aria-label="Spatial world map"
    >
      <div className="zui-minimap-header">
        <div>
          <span className="zui-minimap-eyebrow">
            SPATIAL RADAR
          </span>

          <strong>
            SENTINELAI / WORLD
          </strong>
        </div>

        <span className="zui-minimap-zoom">
          {Math.round(
            camera.zoom * 100,
          )}
          %
        </span>
      </div>

      <div className="zui-minimap-viewport">
        <div
          className="zui-minimap-world"
          style={{
            width:
              renderedWorldWidth,
            height:
              renderedWorldHeight,
            left:
              offsetX,
            top:
              offsetY,
          }}
        >
          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={nodeClass(
                node.kind,
              )}
              style={{
                left:
                  node.x *
                  worldScale,
                top:
                  node.y *
                  worldScale,
                width:
                  Math.max(
                    3,
                    node.width *
                      worldScale,
                  ),
                height:
                  Math.max(
                    3,
                    node.height *
                      worldScale,
                  ),
              }}
              onClick={() =>
                onFocusNode?.(node)
              }
              aria-label={`Focus ${node.kind} field`}
            />
          ))}

          <span
            className="zui-minimap-crosshair"
            style={viewportStyle}
          />

          {analysisResult && (
            <span
              className="zui-minimap-threat-ping"
              style={{
                left:
                  4350 *
                  worldScale,
                top:
                  2500 *
                  worldScale,
              }}
            />
          )}
        </div>
      </div>

      <div className="zui-minimap-footer">
        <span>
          {nodes.length} FIELDS
        </span>

        <span
          className={
            activeThreat >= 80
              ? "is-critical"
              : activeThreat >= 50
                ? "is-warning"
                : "is-safe"
          }
        >
          {analysisResult
            ? `${analysisResult.risk_level.toUpperCase()} / ${analysisResult.severity}`
            : "NO ACTIVE THREAT"}
        </span>
      </div>
    </aside>
  );
}

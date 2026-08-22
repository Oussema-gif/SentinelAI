import {
  useMemo,
} from "react";

import type {
  Camera,
  ZoomLevel,
  ViewportSize,
} from "./types";

import type {
  ThreatAnalysisResponse,
} from "../api/types";

import {
  WORLD,
  getVisibleWorldRect,
  intersects,
} from "./canvas";

import {
  SPATIAL_NODES,
  type SpatialNodeModel,
} from "./nodes";

import {
  useModelInfo,
  useThreatCategories,
  useThreatOverview,
  useThreatRiskDistribution,
  useThreatSignals,
  useThreatTimeline,
  useUsageAnalytics,
} from "../api/hooks";

import {
  ThreatIntelligenceField,
} from "../components/canvas/ThreatIntelligenceField";

type Props = {
  camera: Camera;
  zoomLevel: ZoomLevel;
  viewportSize: ViewportSize;

  onFocusNode: (
    node: SpatialNodeModel,
  ) => void;

  inputMessage: string;

  setInputMessage: (
    value: string,
  ) => void;

  analysisResult:
  | ThreatAnalysisResponse
  | undefined;

  analysisPending: boolean;

  analysisError: string | null;

  onAnalyze: () => void;
};

export function SpatialDataLayer({
  camera,
  zoomLevel,
  viewportSize,
  onFocusNode,
  inputMessage,
  setInputMessage,
  analysisResult,
  analysisPending,
  analysisError,
  onAnalyze,
}: Props) {
  /*
   * =========================================================
   * SEMANTIC ZOOM POLICY
   * =========================================================
   */

  const isMacro =
    zoomLevel === "macro";

  const isMeso =
    zoomLevel === "meso" ||
    zoomLevel === "micro";

  const isMicro =
    zoomLevel === "micro";

  /*
   * =========================================================
   * PROGRESSIVE QUERY POLICY
   *
   * Macro:
   *   - model
   *   - usage
   *   - threat overview
   *
   * Meso:
   *   + timeline
   *   + risk distribution
   *   + categories
   *
   * Micro:
   *   + signals
   * =========================================================
   */

  const model =
    useModelInfo(
      isMacro ||
        isMeso,
    );

  const usage =
    useUsageAnalytics(
      isMacro ||
        isMeso,
    );

  const overview =
    useThreatOverview(
      isMacro ||
        isMeso,
    );

  const timeline =
    useThreatTimeline(
      isMeso,
    );

  const risk =
    useThreatRiskDistribution(
      isMeso,
    );

  const categories =
    useThreatCategories(
      isMeso,
    );

  const signals =
    useThreatSignals(
      isMicro,
    );

  /*
   * =========================================================
   * VIEWPORT VIRTUALIZATION
   * =========================================================
   */

  const visibleRect =
    useMemo(
      () =>
        getVisibleWorldRect(
          camera,
          viewportSize,
        ),
      [
        camera,
        viewportSize,
      ],
    );

  const visibleNodes =
    useMemo(
      () =>
        SPATIAL_NODES.filter(
          (node) =>
            intersects(
              node,
              visibleRect,
            ),
        ),
      [visibleRect],
    );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div
      className="zui-world"
      style={{
        width:
          WORLD.width,

        height:
          WORLD.height,

        transform:
          `translate3d(${camera.x}px, ${camera.y}px, 0) ` +
          `scale(${camera.zoom})`,
      }}
    >
      <div className="zui-world-axis" />

      {visibleNodes.map(
        (node) => (
          <ThreatIntelligenceField
            key={node.id}
            node={node}
            zoomLevel={
              zoomLevel
            }

            model={
              model.data
            }

            usage={
              usage.data
            }

            overview={
              overview.data
            }

            timeline={
              timeline.data
            }

            risk={
              risk.data
            }

            categories={
              categories.data
            }

            signals={
              signals.data
            }

            macro={
              isMacro
            }

            meso={
              isMeso
            }

            micro={
              isMicro
            }

            onFocus={() =>
              onFocusNode(
                node,
              )
            }

            inputMessage={
              inputMessage
            }

            setInputMessage={
              setInputMessage
            }

            analysisResult={
              analysisResult
            }

            analysisPending={
              analysisPending
            }

            analysisError={
              analysisError
            }

            onAnalyze={
              onAnalyze
            }
          />
        ),
      )}

      <div
        className="zui-world-coordinates"
        style={{
          left: 3150,
          top: 2500,
        }}
      >
        SENTINELAI /
        SPATIAL THREAT
        INTELLIGENCE
      </div>
    </div>
  );
}
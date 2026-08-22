import {
  useEffect,
  useRef,
  useState,
} from "react";


import {
  useSpatialQueries,
} from "../api/hooks";

import {
  ThreatIntelligenceField,
} from "../components/canvas/ThreatIntelligenceField";

import {
  AnalysisField,
} from "../components/canvas/AnalysisField";

import {
  PersistentInvestigationField,
} from "../components/canvas/PersistentInvestigationField";

import {
  CanvasConnections,
} from "./CanvasConnections";


import {
  SPATIAL_NODES,
  WORLD,
} from "./nodes";

import type {
  CanvasNode,
} from "./types";

import {
  resolveHystereticZoomLevel,
} from "./zoom";

import { MiniMap } from "./MiniMap";

import type {
  Camera,
  ViewportSize,
  ZoomLevel,
} from "./types";

import type {
  InvestigationRecord,
} from "./investigations";

type Props = {
  camera: Camera;
  viewportSize: ViewportSize;
  onFocusNode: (
    node: CanvasNode,
  ) => void;
  inputMessage: string;
  setInputMessage: (
    value: string,
  ) => void;
  analysisResult?: import("../api/types").ThreatAnalysisResponse;

  investigations:
    InvestigationRecord[];

  analysisPhase:
    | "idle"
    | "packet_stream"
    | "model_processing"
    | "reveal"
    | "forensics"
    | "complete"
    | "error";
  analysisPending: boolean;
  analysisError: string | null;
  onAnalyze: () => void;
};

function useSemanticZoomLevel(
  zoom: number,
  delay = 100,
): ZoomLevel {
  const [
    level,
    setLevel,
  ] = useState<ZoomLevel>(
    resolveHystereticZoomLevel(
      zoom,
      "meso",
    ),
  );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setLevel(
          (current) =>
            resolveHystereticZoomLevel(
              zoom,
              current,
            ),
        );
      }, delay);

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [
    zoom,
    delay,
  ]);

  return level;
}

export function SpatialDataLayer({
  camera,
  viewportSize,
  onFocusNode,
  inputMessage,
  setInputMessage,
  analysisResult,
  investigations,
  analysisPhase,
  analysisPending,
  analysisError,
  onAnalyze,
}: Props) {
  const zoomLevel =
    useSemanticZoomLevel(
      camera.zoom,
      100,
    );

  const queries =
    useSpatialQueries(
      zoomLevel,
    );

  /*
   * Persistent top-level spatial anchors.
   * Do not unmount these during camera traversal.
   */
  const visibleNodes =
    SPATIAL_NODES;

  const nodeRefs =
    useRef<
      Record<
        string,
        HTMLElement | null
      >
    >({});

  const analysisRef =
    useRef<HTMLElement | null>(
      null,
    );

  return (
    <div
      className="zui-world"
      style={{
        width: WORLD.width,
        height: WORLD.height,
        "--zoom": camera.zoom,
        "--inverse-zoom":
          camera.zoom > 0
            ? 1 / camera.zoom
            : 1,
      } as React.CSSProperties}
      data-zoom-level={
        zoomLevel
      }
      data-visible-node-count={
        visibleNodes.length
      }
    >
      {(analysisPhase !== "idle" ||
        analysisResult) && (
        <CanvasConnections
          zoom={camera.zoom}
        camera={camera}
        viewportSize={
          viewportSize
        }
        sourceRef={
          {
            current:
              nodeRefs.current[
                "message-field"
              ] ?? null,
          }
        }
        targetRef={
          analysisRef
        }
        analysisActive={
          analysisPhase !==
            "idle" &&
          analysisPhase !==
            "error"
        }
        analysisPhase={
          analysisPhase
        }
        analysisSeverity={
          analysisResult?.severity ?? 0
        }
        />

      )}

      <div
        className="zui-world-axis"
        aria-hidden="true"
      />

      {analysisPhase !== "idle" && (
        <AnalysisField
          result={analysisResult}
          message={inputMessage}
          nodeRef={
            analysisRef
          }
          phase={
            analysisPhase
          }
        />
      )}

      {investigations.map(
        (investigation) => (
          <PersistentInvestigationField
            key={
              investigation.id
            }
            investigation={
              investigation
            }
          />
        ),
      )}

      {visibleNodes.map(
        (node) => (
          <ThreatIntelligenceField
            key={node.id}
            node={node}
            nodeRef={(element) => {
              nodeRefs.current[
                node.id
              ] = element;
            }}
            zoomLevel={zoomLevel}
            model={
              queries.model.data
            }
            usage={
              queries.usage.data
            }
            overview={
              queries.overview.data
            }
            timeline={
              queries.timeline.data
            }
            risk={
              queries.risk.data
            }
            categories={
              queries.categories.data
            }
            signals={
              queries.signals.data
            }
            onFocus={() =>
              onFocusNode(node)
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
        SENTINELAI / SPATIAL
        THREAT INTELLIGENCE
      </div>

      <MiniMap
        camera={camera}
        viewportSize={viewportSize}
        nodes={visibleNodes}
        onFocusNode={onFocusNode}
      />
    </div>
  );
}

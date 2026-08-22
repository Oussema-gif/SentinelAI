import {
  useEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import type {
  Camera,
  CanvasNode,
  ViewportSize,
} from "./types";

import {
  SPATIAL_NODES,
  WORLD,
} from "./nodes";

type Props = {
  zoom?: number;
  camera: Camera;
  viewportSize: ViewportSize;

  sourceRef: RefObject<
    HTMLElement | null
  >;

  targetRef: RefObject<
    HTMLElement | null
  >;

  analysisActive?: boolean;

  analysisPhase?:
    | "idle"
    | "packet_stream"
    | "model_processing"
    | "reveal"
    | "forensics"
    | "complete"
    | "error";

  analysisSeverity?: number;
};

type Point = {
  x: number;
  y: number;
};

type Anchors = {
  source: Point;
  analysis: Point;
};

const INFORMATION =
  "#7AA7FF";

const WARNING =
  "#FFB800";

const CRITICAL =
  "#FF3366";

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(min, value),
  );
}

function rightCenter(
  node: CanvasNode,
): Point {
  return {
    x:
      node.x +
      node.width,
    y:
      node.y +
      node.height / 2,
  };
}

function leftCenter(
  node: CanvasNode,
): Point {
  return {
    x: node.x,
    y:
      node.y +
      node.height / 2,
  };
}

function topCenter(
  node: CanvasNode,
): Point {
  return {
    x:
      node.x +
      node.width / 2,
    y: node.y,
  };
}

function bottomCenter(
  node: CanvasNode,
): Point {
  return {
    x:
      node.x +
      node.width / 2,
    y:
      node.y +
      node.height,
  };
}

function pathBetween(
  from: Point,
  to: Point,
): string {
  const dx =
    Math.abs(to.x - from.x);

  const dy =
    Math.abs(to.y - from.y);

  const horizontal =
    dx >= dy;

  const curve = clamp(
    Math.max(
      dx,
      dy,
    ) * 0.28,
    120,
    420,
  );

  if (horizontal) {
    const direction =
      to.x >= from.x
        ? 1
        : -1;

    return [
      `M ${from.x} ${from.y}`,
      `C ${
        from.x +
        curve * direction
      } ${from.y},`,
      `  ${
        to.x -
        curve * direction
      } ${to.y},`,
      `  ${to.x} ${to.y}`,
    ].join(" ");
  }

  const direction =
    to.y >= from.y
      ? 1
      : -1;

  return [
    `M ${from.x} ${from.y}`,
    `C ${from.x} ${
      from.y +
      curve * direction
    },`,
    `  ${to.x} ${
      to.y -
      curve * direction
    },`,
    `  ${to.x} ${to.y}`,
  ].join(" ");
}

function findNode(
  id: string,
): CanvasNode | undefined {
  return SPATIAL_NODES.find(
    (node) => node.id === id,
  );
}

function severityColor(
  active: boolean,
  severity: number,
) {
  if (!active) {
    return INFORMATION;
  }

  if (severity >= 80) {
    return CRITICAL;
  }

  if (severity >= 50) {
    return WARNING;
  }

  return INFORMATION;
}

export function CanvasConnections({
  zoom = 1,
  camera,
  viewportSize,
  sourceRef,
  targetRef,
  analysisActive = false,
  analysisPhase = "idle",
  analysisSeverity = 0,
}: Props) {
  const [
    anchors,
    setAnchors,
  ] = useState<Anchors | null>(
    null,
  );

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      const viewport =
        document.querySelector(
          ".zui-viewport",
        );

      const source =
        sourceRef.current;

      if (
        !(viewport instanceof
          HTMLElement) ||
        !source
      ) {
        setAnchors(null);
        return;
      }

      const viewportRect =
        viewport.getBoundingClientRect();

      const sourceRect =
        source.getBoundingClientRect();

      const sourceScreen = {
        x:
          sourceRect.right,
        y:
          sourceRect.top +
          sourceRect.height / 2,
      };

      const sourceWorld = {
        x:
          (sourceScreen.x -
            viewportRect.left -
            camera.x) /
          camera.zoom,

        y:
          (sourceScreen.y -
            viewportRect.top -
            camera.y) /
          camera.zoom,
      };

      let analysisWorld: Point = {
        x: 3525,
        y: 2560,
      };

      const analysis =
        targetRef.current;

      if (analysis) {
        const analysisRect =
          analysis.getBoundingClientRect();

        const targetScreen = {
          x:
            analysisRect.left,
          y:
            analysisRect.top +
            analysisRect.height / 2,
        };

        analysisWorld = {
          x:
            (targetScreen.x -
              viewportRect.left -
              camera.x) /
            camera.zoom,

          y:
            (targetScreen.y -
              viewportRect.top -
              camera.y) /
            camera.zoom,
        };
      }

      setAnchors({
        source: sourceWorld,
        analysis: analysisWorld,
      });
    };

    const schedule = () => {
      cancelAnimationFrame(
        frame,
      );

      frame =
        requestAnimationFrame(
          measure,
        );
    };

    schedule();

    window.addEventListener(
      "resize",
      schedule,
    );

    return () => {
      cancelAnimationFrame(
        frame,
      );

      window.removeEventListener(
        "resize",
        schedule,
      );
    };
  }, [
    camera,
    viewportSize,
    sourceRef,
    targetRef,
  ]);

  const message =
    findNode(
      "message-field",
    );

  const threat =
    findNode(
      "threat-field",
    );

  const investigation =
    findNode(
      "investigation-field",
    );

  const model =
    findNode(
      "model-field",
    );

  const archive =
    findNode(
      "archive-field",
    );

  if (
    !message ||
    !threat ||
    !investigation ||
    !model ||
    !archive
  ) {
    return null;
  }

  const analysisPath =
    anchors
      ? pathBetween(
          anchors.source,
          anchors.analysis,
        )
      : pathBetween(
          rightCenter(message),
          leftCenter(
            investigation,
          ),
        );

  const edges = [
    {
      id: "message-threat",
      from:
        rightCenter(message),
      to:
        leftCenter(threat),
    },

    {
      id: "threat-investigation",
      from:
        rightCenter(threat),
      to:
        leftCenter(
          investigation,
        ),
    },

    {
      id: "investigation-model",
      from:
        rightCenter(
          investigation,
        ),
      to:
        leftCenter(model),
    },

    {
      id: "threat-archive",
      from:
        bottomCenter(threat),
      to:
        topCenter(archive),
    },
  ];

  const activeColor =
    severityColor(
      analysisActive,
      analysisSeverity,
    );

  const showPacket =
    analysisActive &&
    (
      analysisPhase ===
        "packet_stream" ||
      analysisPhase ===
        "model_processing"
    );

  const sharedStyle: CSSProperties = {
    "--connection-color":
      activeColor,
  } as CSSProperties;

  return (
    <svg
      className="canvas-connections-svg"
      width={WORLD.width}
      height={WORLD.height}
      viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
      aria-hidden="true"
      data-zoom={zoom}
    >
      <defs>
        <filter
          id="sentinel-connection-glow"
          x="-200%"
          y="-200%"
          width="400%"
          height="400%"
        >
          <feGaussianBlur
            stdDeviation="4"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <marker
          id="sentinel-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill={
              INFORMATION
            }
            opacity="0.45"
          />
        </marker>
      </defs>

      {edges.map(
        (edge) => {
          const path =
            pathBetween(
              edge.from,
              edge.to,
            );

          return (
            <path
              key={edge.id}
              className="canvas-edge-main"
              d={path}
              fill="none"
              stroke={
                INFORMATION
              }
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="5 14"
              opacity="0.38"
              vectorEffect="non-scaling-stroke"
              markerEnd="url(#sentinel-arrow)"
            />
          );
        },
      )}

      <path
        className={[
          "canvas-edge-main",
          analysisActive
            ? "is-active"
            : "",
        ].join(" ")}
        d={analysisPath}
        fill="none"
        stroke={activeColor}
        strokeWidth={
          analysisActive
            ? 2.5
            : 1.5
        }
        strokeLinecap="round"
        strokeDasharray="6 12"
        opacity={
          analysisActive
            ? 0.82
            : 0.42
        }
        vectorEffect="non-scaling-stroke"
        style={sharedStyle}
        markerEnd="url(#sentinel-arrow)"
      />

      {analysisActive && (
        <path
          className="canvas-edge-flow"
          d={analysisPath}
          fill="none"
          stroke={activeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 30"
          opacity="0.95"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {showPacket && (
        <>
          <circle
            className="analysis-packet"
            r="8"
            fill={activeColor}
            filter="url(#sentinel-connection-glow)"
          >
            <animateMotion
              dur={
                analysisPhase ===
                "packet_stream"
                  ? "850ms"
                  : "1250ms"
              }
              repeatCount="indefinite"
              path={analysisPath}
            />
          </circle>

          <circle
            className="analysis-packet-core"
            r="2.5"
            fill="#FFFFFF"
          >
            <animateMotion
              dur={
                analysisPhase ===
                "packet_stream"
                  ? "850ms"
                  : "1250ms"
              }
              repeatCount="indefinite"
              path={analysisPath}
            />
          </circle>
        </>
      )}
    </svg>
  );
}

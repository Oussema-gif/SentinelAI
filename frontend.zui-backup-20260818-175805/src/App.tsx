import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  PointerEvent,
  ReactNode,
  RefObject,
  WheelEvent,
} from "react";

import {
  createPrediction,
  getModelInfo,
  getUsageAnalytics,
} from "./api/client";

import {
  ThreatIntelligenceLayer,
} from "./components/intelligence/ThreatIntelligenceLayer";

import type {
  InfluentialTerm,
  PredictionResponse,
} from "./api/types";

import {
  getSemanticZoomLevel,
} from "./zui/semanticZoom";

import {
  formatDate,
  formatPercent,
  formatScore,
} from "./lib/format";

type Point = {
  x: number;
  y: number;
};

type Camera = {
  x: number;
  y: number;
  zoom: number;
};

type WorkspacePhase =
  | "overview"
  | "input_active"
  | "analyzing"
  | "analysis_ready"
  | "analysis_focused"
  | "history_exploration";

type WorkspaceState = {
  phase: WorkspacePhase;
  selectedNode:
    | "input"
    | "model"
    | "activity"
    | "lab";
};

type AnalysisLabState = {
  position: Point;
  message: string;
  status:
    | "processing"
    | "complete";
  result?: PredictionResponse;
  threatSeverity: number;
  threatLabel: string;
  shortLinks: string[];
};

type RecentMessage = {
  id: string;
  text: string;
  result: PredictionResponse;
  position: Point;
};

const WORLD = {
  width: 7200,
  height: 4600,
};

const INITIAL_CAMERA: Camera = {
  x: -2850,
  y: -1850,
  zoom: 0.72,
};

const NODE_POSITIONS = {
  input: {
    x: 3100,
    y: 2050,
  },

  model: {
    x: 920,
    y: 320,
  },

  activity: {
    x: 5000,
    y: 700,
  },

  lab: {
    x: 4260,
    y: 2030,
  },
};

const SAMPLE_MESSAGES = [
  "Hey, are you free tonight?",
  "URGENT! You have won a £500 prize. Call now!",
  "I'll call you later.",
  "Congratulations! You have been selected for a reward.",
];

const SHORT_LINK_PATTERN =
  /https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly)\/[^\s<]+/gi;

const WORKSPACE_STORAGE_KEY =
  "sentinelai.workspace.v1";

const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  phase: "overview",
  selectedNode: "input",
};

function extractShortLinks(
  text: string,
): string[] {
  return Array.from(
    new Set(
      text.match(
        SHORT_LINK_PATTERN,
      ) ?? [],
    ),
  );
}

function loadWorkspaceState(): WorkspaceState {
  try {
    const raw =
      sessionStorage.getItem(
        WORKSPACE_STORAGE_KEY,
      );

    if (!raw) {
      return DEFAULT_WORKSPACE_STATE;
    }

    const parsed =
      JSON.parse(
        raw,
      ) as Partial<WorkspaceState>;

    const validPhases: WorkspacePhase[] =
      [
        "overview",
        "input_active",
        "analyzing",
        "analysis_ready",
        "analysis_focused",
        "history_exploration",
      ];

    const validNodes = [
      "input",
      "model",
      "activity",
      "lab",
    ] as const;

    const phase =
      validPhases.includes(
        parsed.phase as WorkspacePhase,
      )
        ? (parsed.phase as WorkspacePhase)
        : "overview";

    const selectedNode =
      validNodes.includes(
        parsed.selectedNode as
          (typeof validNodes)[number],
      )
        ? (parsed.selectedNode as WorkspaceState["selectedNode"])
        : "input";

    return {
      phase,
      selectedNode,
    };
  } catch {
    return DEFAULT_WORKSPACE_STATE;
  }
}

function persistWorkspaceState(
  state: WorkspaceState,
) {
  try {
    sessionStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // Best-effort persistence.
  }
}

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

function easeInOutCubic(
  value: number,
) {
  return value < 0.5
    ? 4 *
        value *
        value *
        value
    : 1 -
        Math.pow(
          -2 * value + 2,
          3,
        ) /
          2;
}

function useCanvasCamera() {
  const viewportRef =
    useRef<HTMLDivElement>(null);

  const animationFrameRef =
    useRef<number | null>(null);

  const [camera, setCamera] =
    useState<Camera>(
      INITIAL_CAMERA,
    );

  const [spaceHeld, setSpaceHeld] =
    useState(false);

  const [dragging, setDragging] =
    useState(false);

  const dragRef =
    useRef<{
      pointerX: number;
      pointerY: number;
      cameraX: number;
      cameraY: number;
    } | null>(null);

  useEffect(() => {
    const down = (
      event: KeyboardEvent,
    ) => {
      if (
        event.code === "Space" &&
        !event.repeat
      ) {
        setSpaceHeld(true);
        event.preventDefault();
      }
    };

    const up = (
      event: KeyboardEvent,
    ) => {
      if (
        event.code === "Space"
      ) {
        setSpaceHeld(false);
      }
    };

    window.addEventListener(
      "keydown",
      down,
    );

    window.addEventListener(
      "keyup",
      up,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        down,
      );

      window.removeEventListener(
        "keyup",
        up,
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current,
        );
      }
    };
  }, []);

  const cancelCameraAnimation =
    useCallback(() => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current,
        );

        animationFrameRef.current =
          null;
      }
    }, []);

  const onPointerDown =
    useCallback(
      (
        event: PointerEvent<HTMLDivElement>,
      ) => {
        const shouldPan =
          spaceHeld ||
          event.button === 2;

        if (!shouldPan) {
          return;
        }

        cancelCameraAnimation();

        event.preventDefault();

        event.currentTarget.setPointerCapture(
          event.pointerId,
        );

        setDragging(true);

        dragRef.current = {
          pointerX: event.clientX,
          pointerY: event.clientY,
          cameraX: camera.x,
          cameraY: camera.y,
        };
      },
      [
        camera.x,
        camera.y,
        cancelCameraAnimation,
        spaceHeld,
      ],
    );

  const onPointerMove =
    useCallback(
      (
        event: PointerEvent<HTMLDivElement>,
      ) => {
        if (!dragRef.current) {
          return;
        }

        const origin =
          dragRef.current;

        setCamera(
          (current) => ({
            ...current,
            x:
              origin.cameraX +
              event.clientX -
              origin.pointerX,
            y:
              origin.cameraY +
              event.clientY -
              origin.pointerY,
          }),
        );
      },
      [],
    );

  const stopDragging =
    useCallback(
      (
        event: PointerEvent<HTMLDivElement>,
      ) => {
        if (!dragging) {
          return;
        }

        setDragging(false);

        dragRef.current = null;

        try {
          event.currentTarget.releasePointerCapture(
            event.pointerId,
          );
        } catch {
          // Pointer capture may already be released.
        }
      },
      [dragging],
    );

  const onWheel =
    useCallback(
      (
        event: WheelEvent<HTMLDivElement>,
      ) => {
        event.preventDefault();

        const viewport =
          viewportRef.current;

        if (!viewport) {
          return;
        }

        const bounds =
          viewport.getBoundingClientRect();

        const pointerX =
          event.clientX -
          bounds.left;

        const pointerY =
          event.clientY -
          bounds.top;

        const oldZoom =
          camera.zoom;

        const factor =
          event.deltaY > 0
            ? 0.91
            : 1.1;

        const nextZoom =
          clamp(
            oldZoom * factor,
            0.38,
            1.85,
          );

        const worldX =
          (pointerX - camera.x) /
          oldZoom;

        const worldY =
          (pointerY - camera.y) /
          oldZoom;

        setCamera({
          zoom: nextZoom,
          x:
            pointerX -
            worldX *
              nextZoom,
          y:
            pointerY -
            worldY *
              nextZoom,
        });
      },
      [camera],
    );

  const focus = useCallback(
    (
      point: Point,
      zoom = 1.05,
      duration = 650,
    ) => {
      const viewport =
        viewportRef.current;

      if (!viewport) {
        return;
      }

      cancelCameraAnimation();

      const bounds =
        viewport.getBoundingClientRect();

      const target: Camera = {
        zoom,
        x:
          bounds.width / 2 -
          point.x * zoom,
        y:
          bounds.height / 2 -
          point.y * zoom,
      };

      const startCamera =
        camera;

      const start =
        performance.now();

      const step = (
        timestamp: number,
      ) => {
        const elapsed =
          timestamp - start;

        const progress =
          clamp(
            elapsed / duration,
            0,
            1,
          );

        const eased =
          easeInOutCubic(
            progress,
          );

        setCamera({
          x:
            startCamera.x +
            (target.x -
              startCamera.x) *
              eased,

          y:
            startCamera.y +
            (target.y -
              startCamera.y) *
              eased,

          zoom:
            startCamera.zoom +
            (target.zoom -
              startCamera.zoom) *
              eased,
        });

        if (
          progress < 1
        ) {
          animationFrameRef.current =
            requestAnimationFrame(
              step,
            );
        } else {
          animationFrameRef.current =
            null;
        }
      };

      animationFrameRef.current =
        requestAnimationFrame(
          step,
        );
    },
    [
      camera,
      cancelCameraAnimation,
    ],
  );

  const reset =
    useCallback(() => {
      cancelCameraAnimation();

      setCamera(
        INITIAL_CAMERA,
      );
    }, [
      cancelCameraAnimation,
    ]);

  return {
    viewportRef,
    camera,
    spaceHeld,
    dragging,
    onPointerDown,
    onPointerMove,
    stopDragging,
    onWheel,
    focus,
    reset,
  };
}

function App() {
  const canvas =
    useCanvasCamera();

  const [message, setMessage] =
    useState("");

  const [analysis, setAnalysis] =
    useState<AnalysisLabState | null>(
      null,
    );

  const [
    recentMessages,
    setRecentMessages,
  ] = useState<
    RecentMessage[]
  >([]);

  const [
    selectedInvestigationId,
    setSelectedInvestigationId,
  ] = useState<number | null>(
    null,
  );

  const initialWorkspace =
    useRef<WorkspaceState | null>(
      null,
    );

  if (
    initialWorkspace.current ===
    null
  ) {
    initialWorkspace.current =
      loadWorkspaceState();
  }

  const [
    workspacePhase,
    setWorkspacePhase,
  ] = useState<WorkspacePhase>(
    initialWorkspace.current
      .phase,
  );

  const [
    selectedNode,
    setSelectedNode,
  ] = useState<
    | "input"
    | "model"
    | "activity"
    | "lab"
  >(
    initialWorkspace.current
      .selectedNode,
  );

  const semanticZoom =
    getSemanticZoomLevel(
      canvas.camera.zoom,
    );

  useEffect(() => {
    persistWorkspaceState({
      phase: workspacePhase,
      selectedNode,
    });
  }, [
    workspacePhase,
    selectedNode,
  ]);

  const transitionWorkspace =
    useCallback(
      (
        phase: WorkspacePhase,
        node: WorkspaceState["selectedNode"],
      ) => {
        setWorkspacePhase(
          phase,
        );

        setSelectedNode(node);
      },
      [],
    );

  const focusSelectedNode =
    useCallback(() => {
      if (
        selectedNode === "input"
      ) {
        canvas.focus(
          {
            x:
              NODE_POSITIONS
                .input.x +
              350,
            y:
              NODE_POSITIONS
                .input.y +
              180,
          },
          0.96,
          500,
        );

        return;
      }

      if (
        selectedNode === "model"
      ) {
        canvas.focus(
          {
            x:
              NODE_POSITIONS
                .model.x +
              150,
            y:
              NODE_POSITIONS
                .model.y +
              120,
          },
          1,
          500,
        );

        return;
      }

      if (
        selectedNode ===
        "activity"
      ) {
        canvas.focus(
          {
            x:
              NODE_POSITIONS
                .activity.x +
              165,
            y:
              NODE_POSITIONS
                .activity.y +
              130,
          },
          1,
          500,
        );

        return;
      }

      if (analysis) {
        canvas.focus(
          {
            x:
              analysis
                .position.x +
              460,
            y:
              analysis
                .position.y +
              330,
          },
          0.94,
          650,
        );
      }
    }, [
      analysis,
      canvas,
      selectedNode,
    ]);

  const predictionMutation =
    useMutation({
      mutationFn:
        createPrediction,

      onSuccess: (
        result,
        variables,
      ) => {
        const labPosition: Point =
          analysis?.position ??
          NODE_POSITIONS.lab;

        setAnalysis({
          position:
            labPosition,

          result,

          message:
            variables.text,

          status:
            "complete",

          threatSeverity:
            result.label ===
            "spam"
              ? 94.8
              : 18.6,

          threatLabel:
            result.label ===
            "spam"
              ? "HIGH RISK SMISHING"
              : "LOW RISK / HAM",

          shortLinks:
            extractShortLinks(
              variables.text,
            ),
        });

        setRecentMessages(
          (current) => [
            {
              id: `${Date.now()}-${Math.random()}`,
              text: variables.text,
              result,
              position:
                labPosition,
            },

            ...current.slice(
              0,
              8,
            ),
          ],
        );

        setMessage("");

        transitionWorkspace(
          "analysis_ready",
          "lab",
        );

        window.setTimeout(
          () => {
            canvas.focus(
              {
                x:
                  labPosition.x +
                  460,
                y:
                  labPosition.y +
                  330,
              },
              0.94,
              700,
            );
          },
          60,
        );
      },

      onError: () => {
        setAnalysis(
          (current) =>
            current
              ? {
                  ...current,
                  status:
                    "complete",
                  threatLabel:
                    "ANALYSIS FAILED",
                  threatSeverity: 0,
                  result:
                    undefined,
                  shortLinks:
                    extractShortLinks(
                      current.message,
                    ),
                }
              : null,
        );

        transitionWorkspace(
          "analysis_ready",
          "lab",
        );
      },
    });

  const modelQuery =
    useQuery({
      queryKey: [
        "model-info",
      ],

      queryFn:
        getModelInfo,
    });

  const usageQuery =
    useQuery({
      queryKey: [
        "usage-analytics",
      ],

      queryFn:
        getUsageAnalytics,

      refetchInterval:
        10_000,
    });

  const processing =
    predictionMutation.isPending;

  const gridSize =
    Math.max(
      28,
      82 *
        canvas.camera.zoom,
    );

  const worldStyle = {
    transform:
      `translate3d(${canvas.camera.x}px, ${canvas.camera.y}px, 0) ` +
      `scale(${canvas.camera.zoom})`,
  };

  const analyze =
    useCallback(() => {
      const text =
        message.trim();

      if (
        !text ||
        predictionMutation.isPending
      ) {
        return;
      }

      const labPosition: Point =
        {
          x:
            NODE_POSITIONS
              .input.x +
            1160,
          y:
            NODE_POSITIONS
              .input.y -
            20,
        };

      transitionWorkspace(
        "analyzing",
        "lab",
      );

      setAnalysis({
        position:
          labPosition,

        message: text,

        status:
          "processing",

        threatSeverity:
          94.8,

        threatLabel:
          "HIGH RISK SMISHING",

        shortLinks:
          extractShortLinks(text),
      });

      canvas.focus(
        {
          x:
            labPosition.x +
            460,
          y:
            labPosition.y +
            330,
        },
        0.94,
        800,
      );

      predictionMutation.mutate(
        {
          text,
          top_k: 6,
        },
      );
    }, [
      canvas,
      message,
      predictionMutation,
      transitionWorkspace,
    ]);

  const showSample =
    useCallback(
      (sample: string) => {
        setMessage(sample);

        transitionWorkspace(
          "input_active",
          "input",
        );

        canvas.focus(
          {
            x:
              NODE_POSITIONS
                .input.x +
              350,
            y:
              NODE_POSITIONS
                .input.y +
              180,
          },
          0.96,
          500,
        );
      },
      [
        canvas,
        transitionWorkspace,
      ],
    );

  const resetWorkspace =
    useCallback(() => {
      setAnalysis(null);
      setMessage("");

      setSelectedInvestigationId(
        null,
      );

      transitionWorkspace(
        "overview",
        "input",
      );

      canvas.reset();
    }, [
      canvas,
      transitionWorkspace,
    ]);

  const focusInvestigationField =
    useCallback(() => {
      setSelectedNode(
        "activity",
      );

      transitionWorkspace(
        "history_exploration",
        "activity",
      );

      canvas.focus(
        {
          x: 2740,
          y: 3300,
        },
        semanticZoom ===
          "strategic"
          ? 0.8
          : 1.0,
        650,
      );
    }, [
      canvas,
      semanticZoom,
      transitionWorkspace,
    ]);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as
          | HTMLElement
          | null;

      const isEditable =
        target?.tagName ===
          "TEXTAREA" ||
        target?.tagName ===
          "INPUT" ||
        target?.isContentEditable;

      if (
        isEditable &&
        event.key !== "Escape"
      ) {
        return;
      }

      if (
        event.key ===
        "Escape"
      ) {
        if (analysis) {
          setAnalysis(null);

          transitionWorkspace(
            "overview",
            "input",
          );
        }

        return;
      }

      if (
        event.key.toLowerCase() ===
        "r"
      ) {
        event.preventDefault();

        resetWorkspace();

        return;
      }

      if (
        event.key.toLowerCase() ===
        "f"
      ) {
        event.preventDefault();

        focusSelectedNode();

        return;
      }

      if (
        event.key.toLowerCase() ===
        "i"
      ) {
        event.preventDefault();

        focusInvestigationField();

        return;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    analysis,
    canvas,
    focusInvestigationField,
    focusSelectedNode,
    resetWorkspace,
    transitionWorkspace,
  ]);

  return (
    <div className="zui-app">
      <div
        ref={
          canvas.viewportRef
        }
        className={`canvas-viewport ${
          canvas.dragging
            ? "is-panning"
            : ""
        }`}
        onWheel={
          canvas.onWheel
        }
        onPointerDown={
          canvas.onPointerDown
        }
        onPointerMove={
          canvas.onPointerMove
        }
        onPointerUp={
          canvas.stopDragging
        }
        onPointerCancel={
          canvas.stopDragging
        }
        onContextMenu={(
          event,
        ) =>
          event.preventDefault()
        }
      >
        <div
          className="micro-grid"
          style={{
            backgroundSize:
              `${gridSize}px ${gridSize}px`,

            backgroundPosition:
              `${canvas.camera.x}px ${canvas.camera.y}px`,
          }}
        />

        <div
          className="canvas-world"
          style={
            worldStyle
          }
        >
          <WorldBackground />

          <InflowStream />

          <ThreatIntelligenceLayer
            zoom={
              canvas.camera.zoom
            }
            selectedInvestigationId={
              selectedInvestigationId
            }
            onSelectInvestigation={(
              id,
            ) => {
              setSelectedInvestigationId(
                id,
              );

              transitionWorkspace(
                "history_exploration",
                "activity",
              );

              window.setTimeout(
                () => {
                  canvas.focus(
                    {
                      x: 2720,
                      y: 3350,
                    },
                    1.16,
                    650,
                  );
                },
                40,
              );
            }}
          />

          <FloatingNode
            className="node-model"
            position={
              NODE_POSITIONS.model
            }
            onSelect={() =>
              transitionWorkspace(
                "overview",
                "model",
              )
            }
          >
            <div className="node-kicker">
              ENGINE / 01
            </div>

            <div className="node-title">
              {modelQuery.data
                ?.model_type ??
                "Linear SVM"}
            </div>

            <div className="node-subtitle">
              {modelQuery.data
                ?.model_version ??
                "sentinelai-sms-v1.0.0"}
            </div>

            <div className="node-divider" />

            <Metric
              label="Test F1"
              value={
                modelQuery.data
                  ? formatPercent(
                      modelQuery
                        .data
                        .final_test_metrics
                        .f1,
                    )
                  : "—"
              }
            />

            <Metric
              label="Recall"
              value={
                modelQuery.data
                  ? formatPercent(
                      modelQuery
                        .data
                        .final_test_metrics
                        .recall,
                    )
                  : "—"
              }
            />

            <Metric
              label="PR-AUC"
              value={
                modelQuery.data
                  ? formatPercent(
                      modelQuery
                        .data
                        .final_test_metrics
                        .pr_auc,
                    )
                  : "—"
              }
            />
          </FloatingNode>

          <FloatingNode
            className={`node-input ${
              selectedNode ===
              "input"
                ? "node-selected"
                : ""
            } ${
              processing
                ? "node-processing"
                : ""
            }`}
            position={
              NODE_POSITIONS.input
            }
          >
            <div className="node-header-row">
              <div>
                <div className="node-kicker">
                  INCOMING /
                  TEXT INTAKE
                </div>

                <div className="node-title">
                  Message input
                </div>
              </div>

              <span className="node-index">
                00
              </span>
            </div>

            <p className="node-description">
              Drop a message
              into the canvas
              and launch a
              live model
              analysis.
            </p>

            <textarea
              value={message}
              onFocus={() => {
                if (!processing) {
                  transitionWorkspace(
                    "input_active",
                    "input",
                  );
                }
              }}
              onChange={(
                event,
              ) => {
                const next =
                  event.target.value;

                setMessage(
                  next,
                );

                if (
                  !processing &&
                  next.trim()
                ) {
                  transitionWorkspace(
                    "input_active",
                    "input",
                  );
                }
              }}
              onPointerDown={(
                event,
              ) =>
                event.stopPropagation()
              }
              onWheel={(
                event,
              ) =>
                event.stopPropagation()
              }
              placeholder="Paste an SMS here..."
              disabled={
                processing
              }
            />

            <div className="sample-row">
              {SAMPLE_MESSAGES
                .slice(0, 3)
                .map(
                  (
                    sample,
                  ) => (
                    <button
                      key={sample}
                      type="button"
                      disabled={
                        processing
                      }
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        showSample(
                          sample,
                        );
                      }}
                    >
                      try sample
                    </button>
                  ),
                )}
            </div>

            <button
              type="button"
              className={`analyze-button ${
                processing
                  ? "analyze-button-processing"
                  : ""
              }`}
              disabled={
                !message.trim() ||
                processing
              }
              onClick={(
                event,
              ) => {
                event.stopPropagation();

                analyze();
              }}
            >
              <span>
                {processing
                  ? "Running analysis..."
                  : "Analyze message"}
              </span>

              <span>
                {processing
                  ? "•••"
                  : "↗"}
              </span>
            </button>
          </FloatingNode>

          <FloatingNode
            className="node-activity"
            position={
              NODE_POSITIONS.activity
            }
            onSelect={() => {
              focusInvestigationField();
            }}
          >
            <div className="node-kicker">
              TELEMETRY
            </div>

            <div className="node-title">
              Live traffic
            </div>

            <div className="telemetry-number">
              {usageQuery.data
                ?.total_predictions ??
                0}
            </div>

            <div className="telemetry-label">
              predictions
              persisted
            </div>

            <div className="telemetry-row">
              <span>
                ham
              </span>

              <strong>
                {usageQuery
                  .data
                  ?.ham_predictions ??
                  0}
              </strong>
            </div>

            <div className="telemetry-row">
              <span>
                spam
              </span>

              <strong className="warning-value">
                {usageQuery
                  .data
                  ?.spam_predictions ??
                  0}
              </strong>
            </div>
          </FloatingNode>

          <SpatialEngineRoom />

          <div className="room-marker room-inflow">
            <span>01</span>

            <strong>
              MESSAGE FIELD
            </strong>
          </div>

          <div className="room-marker room-lab">
            <span>02</span>

            <strong>
              ANALYSIS FIELD
            </strong>
          </div>

          <div className="room-marker room-engine">
            <span>03</span>

            <strong>
              MODEL FIELD
            </strong>
          </div>

          <div className="room-marker room-archive">
            <span>04</span>

            <strong>
              ARCHIVE FIELD
            </strong>
          </div>

          <div className="message-stream">
            {recentMessages.map(
              (
                item,
                index,
              ) => (
                <FloatingMessage
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                  index={
                    index
                  }
                  onSelect={() => {
                    setAnalysis({
                      position:
                        item.position,

                      result:
                        item.result,

                      message:
                        item.text,

                      status:
                        "complete",

                      threatSeverity:
                        item
                          .result
                          .label ===
                        "spam"
                          ? 94.8
                          : 18.6,

                      threatLabel:
                        item
                          .result
                          .label ===
                        "spam"
                          ? "HIGH RISK SMISHING"
                          : "LOW RISK / HAM",

                      shortLinks:
                        extractShortLinks(
                          item.text,
                        ),
                    });

                    transitionWorkspace(
                      "history_exploration",
                      "lab",
                    );

                    canvas.focus(
                      {
                        x:
                          item
                            .position
                            .x +
                          460,

                        y:
                          item
                            .position
                            .y +
                          330,
                      },
                      0.94,
                      650,
                    );
                  }}
                />
              ),
            )}
          </div>

          {analysis && (
            <>
              <ConnectionLine
                from={{
                  x:
                    NODE_POSITIONS
                      .input
                      .x +
                    760,

                  y:
                    NODE_POSITIONS
                      .input
                      .y +
                    155,
                }}
                to={{
                  x:
                    analysis
                      .position
                      .x,

                  y:
                    analysis
                      .position
                      .y +
                    155,
                }}
                active
                processing={
                  analysis.status ===
                  "processing"
                }
                spam={
                  analysis.status ===
                    "complete" &&
                  analysis.result
                    ?.label ===
                    "spam"
                }
              />

              <AnalysisLabNode
                result={
                  analysis.result
                }
                message={
                  analysis.message
                }
                position={
                  analysis.position
                }
                status={
                  analysis.status
                }
                threatSeverity={
                  analysis.threatSeverity
                }
                threatLabel={
                  analysis.threatLabel
                }
                shortLinks={
                  analysis.shortLinks
                }
                onClose={() => {
                  setAnalysis(
                    null,
                  );

                  transitionWorkspace(
                    "overview",
                    "input",
                  );
                }}
              />
            </>
          )}

          <SpatialGraveyard />

          <div className="canvas-watermark">
            SENTINELAI

            <span>
              SPATIAL THREAT
              INTELLIGENCE
            </span>
          </div>
        </div>

        <CommandBar
          camera={
            canvas.camera
          }
          workspacePhase={
            workspacePhase
          }
          semanticZoom={
            semanticZoom
          }
          onReset={
            resetWorkspace
          }
          onZoomIn={() =>
            canvas.focus(
              {
                x:
                  WORLD.width /
                  2,

                y:
                  WORLD.height /
                  2,
              },
              clamp(
                canvas.camera
                    .zoom *
                  1.14,
                0.38,
                1.85,
              ),
              400,
            )
          }
          onZoomOut={() =>
            canvas.focus(
              {
                x:
                  WORLD.width /
                  2,

                y:
                  WORLD.height /
                  2,
              },
              clamp(
                canvas.camera
                    .zoom *
                  0.88,
                0.38,
                1.85,
              ),
              400,
            )
          }
        />

        <CanvasHud
          camera={
            canvas.camera
          }
          spaceHeld={
            canvas.spaceHeld
          }
          selectedNode={
            selectedNode
          }
          workspacePhase={
            workspacePhase
          }
          semanticZoom={
            semanticZoom
          }
        />

        <MiniMap
          camera={
            canvas.camera
          }
          viewportRef={
            canvas.viewportRef
          }
          analysis={
            analysis
          }
          onReset={
            resetWorkspace
          }
        />
      </div>
    </div>
  );
}

function WorldBackground() {
  return (
    <>
      <div
        className="world-vignette"
        style={{
          left: 0,
          top: 0,
          width:
            WORLD.width,
          height:
            WORLD.height,
        }}
      />

      <div
        className="world-axis"
        style={{
          left: 0,
          top: 2300,
        }}
      />

      <div
        className="world-axis world-axis-vertical"
        style={{
          left: 3600,
          top: 0,
        }}
      />

      <div
        className="world-coordinate"
        style={{
          left: 3100,
          top: 1850,
        }}
      >
        31 / 18
      </div>

      <div
        className="world-coordinate"
        style={{
          left: 4300,
          top: 1700,
        }}
      >
        43 / 17
      </div>
    </>
  );
}

function InflowStream() {
  const nodes = [
    {
      x: 1780,
      y: 1890,
      text:
        "Hey, are you free tonight?",
      tone: "neutral",
    },

    {
      x: 1860,
      y: 2160,
      text:
        "Meeting confirmed for 10:30.",
      tone: "neutral",
    },

    {
      x: 1650,
      y: 2420,
      text:
        "URGENT! Claim your prize now.",
      tone: "warning",
    },
  ];

  return (
    <div className="spatial-inflow">
      <div
        className="spatial-zone-label"
        style={{
          left: 1580,
          top: 1660,
        }}
      >
        <span>
          DATA INGRESS / 01
        </span>

        <strong>
          INFLOW STREAM
        </strong>
      </div>

      <svg
        className="spatial-vector-layer"
        width={
          WORLD.width
        }
        height={
          WORLD.height
        }
        viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
      >
        <defs>
          <linearGradient
            id="inflow-vector-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              stopColor="rgba(136,151,163,0)"
            />

            <stop
              offset="55%"
              stopColor="#71828e"
            />

            <stop
              offset="100%"
              stopColor="#d8b45b"
            />
          </linearGradient>
        </defs>

        {nodes.map(
          (
            node,
            index,
          ) => (
            <path
              key={`vector-${node.text}`}
              className="vector-flow"
              d={`
                M ${
                  node.x +
                  235
                } ${
                  node.y +
                  48
                }
                C ${
                  node.x +
                  390
                } ${
                  node.y +
                  48
                },
                2750 ${
                  1960 +
                  index *
                    185
                },
                3100 2160
              `}
              fill="none"
              stroke="url(#inflow-vector-gradient)"
              strokeWidth={
                node.tone ===
                "warning"
                  ? 3
                  : 2
              }
              strokeDasharray="6 12"
            />
          ),
        )}
      </svg>

      {nodes.map(
        (node) => (
          <div
            key={
              node.text
            }
            className={`inflow-node ${
              node.tone ===
              "warning"
                ? "inflow-warning"
                : ""
            }`}
            style={{
              left: node.x,
              top: node.y,
            }}
          >
            <span>
              {node.tone ===
              "warning"
                ? "SUSPICIOUS"
                : "INCOMING"}
            </span>

            <strong>
              {node.text}
            </strong>
          </div>
        ),
      )}
    </div>
  );
}

function FloatingNode({
  className,
  position,
  children,
  onSelect,
}: {
  className: string;
  position: Point;
  children: ReactNode;
  onSelect?: () => void;
}) {
  return (
    <section
      className={`floating-node ${className}`}
      style={{
        left:
          position.x,
        top:
          position.y,
      }}
      onClick={
        onSelect
      }
    >
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="metric-row">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function FloatingMessage({
  item,
  index,
  onSelect,
}: {
  item: RecentMessage;
  index: number;
  onSelect: () => void;
}) {
  const spam =
    item.result.label ===
    "spam";

  return (
    <button
      type="button"
      className={`floating-message ${
        spam
          ? "message-spam"
          : "message-ham"
      }`}
      style={{
        left:
          item.position.x -
          250 +
          (index % 3) *
            44,

        top:
          item.position.y +
          420 +
          Math.floor(
            index / 3,
          ) *
            180,
      }}
      onClick={(
        event,
      ) => {
        event.stopPropagation();

        onSelect();
      }}
    >
      <div className="floating-message-top">
        <span>
          {spam
            ? "THREAT"
            : "CLEAN"}
        </span>

        <small>
          {formatScore(
            item.result
              .decision_score ??
              0,
          )}
        </small>
      </div>

      <div className="floating-message-body">
        {item.text}
      </div>

      <div className="floating-message-bottom">
        {formatDate(
          new Date().toISOString(),
        )}
      </div>
    </button>
  );
}

function ConnectionLine({
  from,
  to,
  active,
  spam,
  processing = false,
}: {
  from: Point;
  to: Point;
  active: boolean;
  spam: boolean;
  processing?: boolean;
}) {
  const centerX =
    (from.x + to.x) /
    2;

  const gradientId =
    `analysis-connection-gradient-${
      processing
        ? "processing"
        : "idle"
    }-${
      spam
        ? "spam"
        : "safe"
    }`;

  const glowId =
    `analysis-glow-${
      processing
        ? "processing"
        : "idle"
    }`;

  return (
    <svg
      className="connection-layer"
      width={
        WORLD.width
      }
      height={
        WORLD.height
      }
      viewBox={`0 0 ${WORLD.width} ${WORLD.height}`}
    >
      <defs>
        <linearGradient
          id={
            gradientId
          }
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor={
              processing
                ? "rgba(236,188,69,0.04)"
                : "rgba(239,246,250,0.025)"
            }
          />

          <stop
            offset="45%"
            stopColor={
              processing
                ? "#d9ad48"
                : spam
                  ? "#bf9944"
                  : "#5f707c"
            }
          />

          <stop
            offset="65%"
            stopColor={
              processing
                ? "#ffe083"
                : spam
                  ? "#e2b957"
                  : "#9baab4"
            }
          />

          <stop
            offset="100%"
            stopColor={
              processing
                ? "rgba(236,188,69,0.06)"
                : "rgba(239,246,250,0.025)"
            }
          />
        </linearGradient>

        <filter
          id={glowId}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur
            stdDeviation={
              processing
                ? 6
                : 3
            }
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        className={[
          "connection-path",
          active
            ? "connection-active"
            : "",
          processing
            ? "connection-processing"
            : "",
        ].join(" ")}
        d={`
          M ${from.x} ${from.y}
          C ${centerX} ${
            from.y - 220
          },
            ${centerX} ${
            to.y + 220
          },
            ${to.x} ${to.y}
        `}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={
          processing
            ? 5
            : spam
              ? 4
              : 3
        }
        strokeDasharray={
          processing
            ? "8 11"
            : "8 15"
        }
        filter={
          active
            ? `url(#${glowId})`
            : undefined
        }
      />

      {active && (
        <path
          className={[
            "connection-pulse-line",
            processing
              ? "connection-pulse-processing"
              : "",
          ].join(" ")}
          d={`
            M ${from.x} ${from.y}
            C ${centerX} ${
              from.y - 220
            },
              ${centerX} ${
              to.y + 220
            },
              ${to.x} ${to.y}
          `}
          fill="none"
          stroke={
            processing
              ? "#ffe18a"
              : spam
                ? "#f5bd4b"
                : "#c1ccd3"
          }
          strokeWidth={
            processing
              ? 2.5
              : 2
          }
          strokeDasharray={
            processing
              ? "3 32"
              : "2 40"
          }
        />
      )}

      <circle
        className={
          processing
            ? "connection-endpoint connection-endpoint-processing"
            : "connection-endpoint"
        }
        cx={from.x}
        cy={from.y}
        r={
          processing
            ? 11
            : spam
              ? 10
              : 7
        }
        fill={
          processing
            ? "#f4ca64"
            : spam
              ? "#f5bd4b"
              : "#9ba9b2"
        }
      />

      <circle
        className={
          processing
            ? "connection-endpoint connection-endpoint-processing"
            : "connection-endpoint"
        }
        cx={to.x}
        cy={to.y}
        r={
          processing
            ? 9
            : spam
              ? 8
              : 6
        }
        fill={
          processing
            ? "#ffe18a"
            : spam
              ? "#ef5a58"
              : "#aab7bf"
        }
      />
    </svg>
  );
}

function AnalysisLabNode({
  result,
  message,
  position,
  status,
  threatSeverity,
  threatLabel,
  shortLinks,
  onClose,
}: {
  result?: PredictionResponse;
  message: string;
  position: Point;
  status:
    | "processing"
    | "complete";
  threatSeverity: number;
  threatLabel: string;
  shortLinks: string[];
  onClose: () => void;
}) {
  const spam =
    result?.label === "spam";

  const extractedLinks =
    shortLinks.length > 0
      ? shortLinks
      : [
          "NO SHORT-LINK DETECTED",
        ];

  const safeDecisionScore =
    result?.decision_score ??
    0;

  return (
    <section
      className={`analysis-lab-node analysis-lab-expanded ${
        status ===
        "processing"
          ? "analysis-processing"
          : spam
            ? "analysis-danger"
            : "analysis-safe"
      }`}
      style={{
        left:
          position.x,
        top:
          position.y,
      }}
    >
      <div className="analysis-node-header">
        <div>
          <div className="node-kicker">
            ANALYSIS LAB /
            RESULT DETECTED
          </div>

          <div className="node-title">
            {status ===
            "processing"
              ? "Running threat analysis"
              : "Decision evidence"}
          </div>

          <div className="analysis-node-meta">
            {status ===
            "processing"
              ? "live inference / parsing / threat extraction"
              : "structural threat analysis / live inference"}
          </div>
        </div>

        <button
          type="button"
          className="close-node"
          onClick={(
            event,
          ) => {
            event.stopPropagation();

            onClose();
          }}
        >
          ×
        </button>
      </div>

      <div className="analysis-result-row">
        <div
          className={`analysis-label ${
            status ===
            "processing"
              ? "analysis-label-processing"
              : spam
                ? "analysis-label-spam"
                : "analysis-label-ham"
          }`}
        >
          {status ===
          "processing"
            ? "SCANNING"
            : result?.label ??
              "UNKNOWN"}
        </div>

        <div className="analysis-score">
          <span>
            threat severity
          </span>

          <strong>
            {threatSeverity.toFixed(
              1,
            )}
            %
          </strong>
        </div>
      </div>

      <div className="analysis-threat-banner">
        <span>
          THREAT PROFILE
        </span>

        <strong>
          {threatLabel}
        </strong>
      </div>

      <div className="analysis-message">
        {message}
      </div>

      <div className="analysis-structure">
        <div className="analysis-structure-card">
          <span>
            TEXT SURFACE
          </span>

          <strong>
            linguistic pattern
            map
          </strong>

          <div className="signal-grid">
            {result?.influential_terms
              ?.slice(0, 6)
              .map(
                (
                  term,
                ) => (
                  <div
                    key={`${term.term}-structure`}
                    className="signal-chip"
                  >
                    {term.term}
                  </div>
                ),
              )}
          </div>
        </div>

        <div className="analysis-structure-card">
          <span>
            DECISION VECTOR
          </span>

          <strong>
            classifier response
          </strong>

          <div className="decision-meter">
            <div
              className={
                spam ||
                status ===
                  "processing"
                  ? "decision-meter-fill danger"
                  : "decision-meter-fill safe"
              }
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    12,
                    result
                      ? Math.abs(
                          safeDecisionScore,
                        ) * 28
                      : threatSeverity,
                  ),
                )}%`,
              }}
            />
          </div>

          <small>
            {result
              ? `decision score ${formatScore(
                  safeDecisionScore,
                )}`
              : "awaiting classifier response"}
          </small>
        </div>

        <div className="analysis-structure-card analysis-link-card">
          <span>
            LINK EXTRACTION
          </span>

          <strong>
            isolated short-links
          </strong>

          <div className="short-link-code">
            {extractedLinks.map(
              (
                link,
                index,
              ) => (
                <code
                  key={`${link}-${index}`}
                >
                  {link}
                </code>
              ),
            )}
          </div>
        </div>

        <div className="analysis-structure-card">
          <span>
            CLASSIFICATION
          </span>

          <strong>
            current threat
            interpretation
          </strong>

          <div className="analysis-empty-signal">
            {status ===
            "processing"
              ? "Model inference is currently evaluating the supplied message."
              : result
                ? spam
                  ? "Model response indicates a spam-like threat signature."
                  : "Model response indicates a ham-like message signature."
                : "The prediction request did not return a classifier result."}
          </div>
        </div>
      </div>

      {result && (
        <div className="analysis-evidence">
          <div className="analysis-section-title">
            Influential signals
          </div>

          {result.influential_terms
            .slice(0, 6)
            .map(
              (
                term: InfluentialTerm,
              ) => (
                <div
                  className="evidence-row"
                  key={`${term.term}-${term.contribution}`}
                >
                  <span>
                    {term.term}
                  </span>

                  <strong
                    className={
                      term.contribution >=
                      0
                        ? "signal-positive"
                        : "signal-negative"
                    }
                  >
                    {formatScore(
                      term.contribution,
                    )}
                  </strong>
                </div>
              ),
            )}
        </div>
      )}

      <div className="analysis-footnote">
        Threat severity is a UI
        presentation value for
        the spatial workspace.
        It is not a calibrated
        probability produced by
        the Linear SVM.
      </div>
    </section>
  );
}

function SpatialEngineRoom() {
  return (
    <section
      className="spatial-engine-room"
      style={{
        left: 4130,
        top: 1860,
      }}
    >
      <div className="spatial-zone-label">
        <span>
          POLICY GRAPH / 02
        </span>

        <strong>
          ENGINE ROOM
        </strong>
      </div>

      <div className="engine-rule-node">
        <span>
          FILTER
        </span>

        <strong>
          Keyword Filter:
          <br />
          "Crypto"
        </strong>

        <small>
          pattern match
        </small>
      </div>

      <svg
        className="engine-vector"
        width="550"
        height="180"
        viewBox="0 0 550 180"
      >
        <defs>
          <linearGradient
            id="engine-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              stopColor="rgba(121,143,155,0)"
            />

            <stop
              offset="50%"
              stopColor="#778893"
            />

            <stop
              offset="100%"
              stopColor="#d2ac58"
            />
          </linearGradient>
        </defs>

        <path
          d="
            M 215 90
            C 300 90,
              335 90,
              390 90
          "
          fill="none"
          stroke="url(#engine-gradient)"
          strokeWidth="2"
          strokeDasharray="5 10"
          className="vector-flow"
        />
      </svg>

      <div className="engine-action-node">
        <span>
          ACTION
        </span>

        <strong>
          Move to
          <br />
          Graveyard
        </strong>

        <small>
          quarantine sink
        </small>
      </div>
    </section>
  );
}

function SpatialGraveyard() {
  return (
    <section
      className="spatial-graveyard"
      style={{
        left: 2550,
        top: 3000,
      }}
    >
      <div className="spatial-zone-label">
        <span>
          QUARANTINE / 03
        </span>

        <strong>
          THE GRAVEYARD
        </strong>
      </div>

      <p className="graveyard-description">
        Recently blocked
        threats remain here
        briefly before
        decaying out of the
        active workspace.
      </p>

      <div className="graveyard-stack">
        <div className="grave-card grave-card-back">
          <span>
            QUARANTINED
          </span>

          <strong>
            Malicious Link
            Quarantined
          </strong>

          <small>
            threat sink ·
            expired
          </small>
        </div>

        <div className="grave-card grave-card-middle">
          <span>
            BLOCKED
          </span>

          <strong>
            Phishing Attempt
            Blocked
          </strong>

          <small>
            policy engine ·
            high risk
          </small>
        </div>

        <div className="grave-card grave-card-front">
          <span>
            BLOCKED
          </span>

          <strong>
            Suspicious Prize
            Message
          </strong>

          <small>
            AI severity
            scanner
          </small>
        </div>
      </div>
    </section>
  );
}

function CommandBar({
  camera,
  workspacePhase,
  semanticZoom,
  onReset,
  onZoomIn,
  onZoomOut,
}: {
  camera: Camera;
  workspacePhase: WorkspacePhase;
  semanticZoom:
    | "strategic"
    | "operational"
    | "analytical"
    | "evidence";
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="command-bar">
      <button
        type="button"
        className="command-logo"
        onClick={
          onReset
        }
        title="Reset workspace"
      >
        S
      </button>

      <div className="command-context">
        <span>
          SENTINELAI
        </span>

        <strong>
          / spatial workspace
        </strong>
      </div>

      <div className="command-spacer" />

      <div className="command-hint">
        <span>
          SPACE + DRAG
        </span>

        <span>
          RIGHT DRAG
        </span>

        <span>
          SCROLL
        </span>
      </div>

      <span className="workspace-phase">
        {workspacePhase.replaceAll(
          "_",
          " ",
        )}
      </span>

      <span className="semantic-zoom-value">
        {semanticZoom}
      </span>

      <button
        type="button"
        onClick={
          onZoomOut
        }
        aria-label="Zoom out"
      >
        −
      </button>

      <span className="zoom-value">
        {Math.round(
          camera.zoom * 100,
        )}
        %
      </span>

      <button
        type="button"
        onClick={
          onZoomIn
        }
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
}

function CanvasHud({
  camera,
  spaceHeld,
  selectedNode,
  workspacePhase,
  semanticZoom,
}: {
  camera: Camera;
  spaceHeld: boolean;
  selectedNode: string;
  workspacePhase: WorkspacePhase;
  semanticZoom:
    | "strategic"
    | "operational"
    | "analytical"
    | "evidence";
}) {
  return (
    <div className="canvas-hud">
      <div className="hud-line">
        <span className="hud-live" />

        LIVE CANVAS
      </div>

      <div className="hud-line">
        scale{" "}
        {Math.round(
          camera.zoom * 100,
        )}
        %
      </div>

      <div className="hud-line">
        layer{" "}
        {semanticZoom}
      </div>

      <div className="hud-line">
        focus{" "}
        {selectedNode}
      </div>

      <div className="hud-line">
        phase{" "}
        {workspacePhase.replaceAll(
          "_",
          " ",
        )}
      </div>

      <div
        className={`hud-pan ${
          spaceHeld
            ? "hud-pan-active"
            : ""
        }`}
      >
        {spaceHeld
          ? "PAN MODE"
          : "SPACE TO PAN"}
      </div>
    </div>
  );
}

function MiniMap({
  camera,
  viewportRef,
  analysis,
  onReset,
}: {
  camera: Camera;
  viewportRef: RefObject<
    HTMLDivElement | null
  >;
  analysis:
    | AnalysisLabState
    | null;
  onReset: () => void;
}) {
  const minimapWidth = 198;
  const minimapHeight = 128;

  const scale =
    Math.min(
      minimapWidth /
        WORLD.width,
      minimapHeight /
        WORLD.height,
    );

  const worldRenderedWidth =
    WORLD.width * scale;

  const worldRenderedHeight =
    WORLD.height * scale;

  const offsetX =
    (minimapWidth -
      worldRenderedWidth) /
    2;

  const offsetY =
    (minimapHeight -
      worldRenderedHeight) /
    2;

  const viewportElement =
    viewportRef.current;

  const viewportWidth =
    viewportElement?.clientWidth ??
    window.innerWidth;

  const viewportHeight =
    viewportElement?.clientHeight ??
    window.innerHeight;

  const visibleWorldWidth =
    viewportWidth /
    camera.zoom;

  const visibleWorldHeight =
    viewportHeight /
    camera.zoom;

  const maxViewportLeft =
    Math.max(
      0,
      WORLD.width -
        visibleWorldWidth,
    );

  const maxViewportTop =
    Math.max(
      0,
      WORLD.height -
        visibleWorldHeight,
    );

  const worldViewportLeft =
    clamp(
      -camera.x /
        camera.zoom,
      0,
      maxViewportLeft,
    );

  const worldViewportTop =
    clamp(
      -camera.y /
        camera.zoom,
      0,
      maxViewportTop,
    );

  const viewportRectWidth =
    clamp(
      visibleWorldWidth *
        scale,
      8,
      worldRenderedWidth,
    );

  const viewportRectHeight =
    clamp(
      visibleWorldHeight *
        scale,
      8,
      worldRenderedHeight,
    );

  const labPosition =
    analysis?.position ??
    NODE_POSITIONS.lab;

  return (
    <button
      type="button"
      className="minimap"
      onClick={
        onReset
      }
      title="Reset canvas"
    >
      <div className="minimap-label">
        WORLD MAP
      </div>

      <div className="minimap-inner">
        <div
          className="minimap-world"
          style={{
            width:
              worldRenderedWidth,
            height:
              worldRenderedHeight,
            left:
              offsetX,
            top:
              offsetY,
          }}
        >
          <span
            className="minimap-room minimap-room-input"
            style={{
              left:
                NODE_POSITIONS
                  .input.x *
                scale,

              top:
                NODE_POSITIONS
                  .input.y *
                scale,

              width:
                760 * scale,

              height:
                310 * scale,
            }}
          />

          <span
            className="minimap-room minimap-room-lab"
            style={{
              left:
                labPosition.x *
                scale,

              top:
                labPosition.y *
                scale,

              width:
                920 * scale,

              height:
                760 * scale,
            }}
          />

          <span
            className="minimap-room minimap-room-engine"
            style={{
              left:
                4130 * scale,

              top:
                1860 * scale,

              width:
                720 * scale,

              height:
                340 * scale,
            }}
          />

          <span
            className="minimap-room minimap-room-graveyard"
            style={{
              left:
                2550 * scale,

              top:
                3000 * scale,

              width:
                1250 * scale,

              height:
                520 * scale,
            }}
          />

          <span
            className="minimap-room minimap-room-inflow"
            style={{
              left:
                1580 * scale,

              top:
                1660 * scale,

              width:
                920 * scale,

              height:
                920 * scale,
            }}
          />

          <span
            className="minimap-room minimap-room-threat-overview"
            style={{
              left:
                4540 * scale,

              top:
                2600 * scale,

              width:
                900 * scale,

              height:
                570 * scale,
            }}
          />

          <span
            className="minimap-room minimap-room-threat-investigations"
            style={{
              left:
                2200 * scale,

              top:
                2850 * scale,

              width:
                1080 * scale,

              height:
                900 * scale,
            }}
          />

          <span
            className="minimap-room minimap-room-threat-analytics"
            style={{
              left:
                6800 * scale,

              top:
                1850 * scale,

              width:
                1450 * scale,

              height:
                960 * scale,
            }}
          />

          <span
            className="minimap-viewport"
            style={{
              left:
                worldViewportLeft *
                scale,

              top:
                worldViewportTop *
                scale,

              width:
                viewportRectWidth,

              height:
                viewportRectHeight,
            }}
          />
        </div>
      </div>

      <div className="minimap-meta">
        <span>
          {Math.round(
            camera.zoom * 100,
          )}
          %
        </span>

        <span>
          CLICK TO RESET
        </span>
      </div>
    </button>
  );
}

export default App;
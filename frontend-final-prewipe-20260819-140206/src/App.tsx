import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AdaptiveGrid,
} from "./canvas/AdaptiveGrid";

import {
  CanvasViewport,
} from "./canvas/CanvasViewport";

import {
  MiniMap,
} from "./canvas/MiniMap";

import {
  useCanvasEngine,
} from "./canvas/canvas";

import {
  SpatialDataLayer,
} from "./canvas/SpatialDataLayer";

import type {
  CanvasNode,
} from "./canvas/types";

import { SPATIAL_NODES } from "./canvas/nodes";

import {
  useAnalyzeThreat,
  useHealth,
} from "./api/hooks";

import type {
  ThreatAnalysisResponse,
} from "./api/types";

import type {
  InvestigationRecord,
} from "./canvas/investigations";

import "./App.css";

function App() {
  const canvas = useCanvasEngine();

  const health = useHealth();
  const analyze = useAnalyzeThreat();

  const [inputMessage, setInputMessage] =
    useState("");

  const [analysisResult, setAnalysisResult] =
    useState<
      ThreatAnalysisResponse | undefined
    >(undefined);

  const [
    investigations,
    setInvestigations,
  ] = useState<
    InvestigationRecord[]
  >([]);

  const [analysisPhase, setAnalysisPhase] =
    useState<
      | "idle"
      | "packet_stream"
      | "model_processing"
      | "reveal"
      | "forensics"
      | "complete"
      | "error"
    >("idle");

  const analysisTimers =
    useRef<number[]>([]);

  const clearAnalysisTimers =
    useCallback(() => {
      for (
        const timer of
        analysisTimers.current
      ) {
        window.clearTimeout(
          timer,
        );
      }

      analysisTimers.current = [];
    }, []);

  useEffect(() => {
    return () => {
      clearAnalysisTimers();
    };
  }, [
    clearAnalysisTimers,
  ]);

  const analysisError =
    analyze.error instanceof Error
      ? analyze.error.message
      : null;

  const worldCenter = useMemo(
    () => ({
      x: 4100,
      y: 2800,
    }),
    [],
  );

  const focusNode =
    useCallback(
      (node: CanvasNode) => {
        canvas.focus(
          {
            x:
              node.x +
              node.width / 2,
            y:
              node.y +
              node.height / 2,
          },
          node.kind === "message"
            ? 1.12
            : 0.92,
          700,
        );
      },
      [canvas],
    );

  const handleAnalyze =
    useCallback(() => {
      const text =
        inputMessage.trim();

      if (
        !text ||
        analyze.isPending
      ) {
        return;
      }

      clearAnalysisTimers();

      setAnalysisResult(
        undefined,
      );

      /*
       * PHASE 1 — packet leaves Message Field.
       */
      setAnalysisPhase(
        "packet_stream",
      );

      /*
       * Begin the smooth camera traversal immediately.
       * The Analysis Field is always positioned at this
       * deterministic world-space destination.
       */
      canvas.focus(
        {
          x: 3525,
          y: 2560,
        },
        1.08,
        900,
      );

      /*
       * PHASE 2 — model processing.
       */
      const processingTimer =
        window.setTimeout(() => {
          setAnalysisPhase(
            "model_processing",
          );
        }, 420);

      analysisTimers.current.push(
        processingTimer,
      );

      analyze.mutate(
        {
          text,
          topK: 6,
        },
        {
          onSuccess: (
            result,
          ) => {
            setAnalysisResult(
              result,
            );

            const investigationId =
              `investigation-${Date.now()}`;

            setInvestigations(
              (current) => [
                ...current,
                {
                  id:
                    investigationId,
                  result,
                  message: text,
                  x:
                    3000 +
                    current.length * 1250,
                  y:
                    2250 +
                    (current.length % 2) * 850,
                  createdAt:
                    Date.now(),
                },
              ],
            );

            /*
             * PHASE 3 — reveal core verdict.
             */
            setAnalysisPhase(
              "reveal",
            );

            const forensicTimer =
              window.setTimeout(() => {
                setAnalysisPhase(
                  "forensics",
                );
              }, 700);

            /*
             * PHASE 4 — complete forensic reveal.
             */
            const completeTimer =
              window.setTimeout(() => {
                setAnalysisPhase(
                  "complete",
                );
              }, 1800);

            analysisTimers.current.push(
              forensicTimer,
              completeTimer,
            );
          },

          onError: () => {
            setAnalysisPhase(
              "error",
            );
          },
        },
      );
    }, [
      analyze,
      canvas,
      clearAnalysisTimers,
      inputMessage,
    ]);

  useEffect(() => {
    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key.toLowerCase() !==
        "0"
      ) {
        return;
      }

      const target =
        event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      canvas.focus(
        worldCenter,
        0.58,
        700,
      );
    };

    window.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown,
      );
  }, [
    canvas,
    worldCenter,
  ]);

  return (
    <main
      className="sentinel-app"
      data-analysis-state={
        analysisResult
          ? analysisResult.risk_level
          : "idle"
      }
    >
      <CanvasViewport
        camera={
          canvas.camera
        }
        viewportRef={
          canvas.viewportRef
        }
        isPanning={
          canvas.isPanning
        }
        spaceHeld={
          canvas.spaceHeld
        }
        onPointerDown={
          canvas.onPointerDown
        }
        onPointerMove={
          canvas.onPointerMove
        }
        onPointerUp={
          canvas.onPointerUp
        }
        onWheel={
          canvas.onWheel
        }
      >
        <AdaptiveGrid
          camera={
            canvas.camera
          }
        />
<SpatialDataLayer
          camera={
            canvas.camera
          }
          viewportSize={
            canvas.viewportSize
          }
          onFocusNode={
            focusNode
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
          investigations={
            investigations
          }
          analysisPhase={
            analysisPhase
          }
          analysisPending={
            analyze.isPending
          }
          analysisError={
            analysisError
          }
          onAnalyze={
            handleAnalyze
          }
        />
      </CanvasViewport>

      <header className="top-hud">
        <button
          type="button"
          className="brand-orbit"
          onClick={() =>
            canvas.focus(
              worldCenter,
              0.58,
              700,
            )
          }
          aria-label="Recenter SentinelAI world"
        >
          S
        </button>

        <div className="brand-copy">
          <div className="brand-name">
            SENTINELAI
          </div>

          <div className="brand-subtitle">
            SPATIAL THREAT INTELLIGENCE
          </div>
        </div>

        <div className="top-hud-divider" />

        <div className="hud-status">
          <span
            className={`status-dot ${
              health.data?.status ===
              "ok"
                ? "is-online"
                : ""
            }`}
          />

          <span>
            {health.data?.status ===
            "ok"
              ? "SYSTEM ONLINE"
              : "CONNECTING"}
          </span>
        </div>

        <div className="top-hud-spacer" />

        <div className="telemetry-chip">
          <span>ZOOM</span>
          <strong>
            {Math.round(
              canvas.camera.zoom *
                100,
            )}
            %
          </strong>
        </div>

        <div className="telemetry-chip">
          <span>MODE</span>
          <strong>
            SPATIAL
          </strong>
        </div>
      </header>

      <div className="left-hud">
        <div className="hud-label">
          WORLD STATE
        </div>

        <div className="hud-value">
          {analysisResult
            ? "INVESTIGATION ACTIVE"
            : "MONITORING"}
        </div>

        <div className="hud-line" />

        <div className="hud-meta">
          <span>
            PAN
          </span>

          <strong>
            SPACE + DRAG
          </strong>
        </div>

        <div className="hud-meta">
          <span>
            ZOOM
          </span>

          <strong>
            SCROLL
          </strong>
        </div>

        <div className="hud-meta">
          <span>
            RESET
          </span>

          <strong>
            0
          </strong>
        </div>
      </div>

      {analysisResult && (
        <div
          className={`analysis-alert analysis-alert-${analysisResult.risk_level}`}
        >
          <div className="analysis-alert-top">
            <span>
              THREAT DETECTED
            </span>

            <strong>
              {analysisResult.severity}
            </strong>
          </div>

          <div className="analysis-alert-body">
            <span>
              {analysisResult.category}
            </span>

            <span>
              {analysisResult.threat_label}
            </span>
          </div>
        </div>
      )}

      <MiniMap
        camera={
          canvas.camera
        }
        viewportSize={
          canvas.viewportSize
        }
        nodes={
          SPATIAL_NODES
        }
        onFocusNode={
          focusNode
        }
        analysisResult={
          analysisResult
        }
      />

      <div className="bottom-hud">
        <span>
          SENTINELAI
        </span>

        <span className="bottom-hud-divider" />

        <span>
          REAL-TIME THREAT ANALYSIS
        </span>

        <span className="bottom-hud-divider" />

        <span>
          v1.0
        </span>
      </div>
    </main>
  );
}

export default App;

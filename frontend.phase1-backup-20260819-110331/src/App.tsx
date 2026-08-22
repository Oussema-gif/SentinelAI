import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { CanvasViewport } from "./canvas/CanvasViewport";
import {
  useCanvasEngine,
} from "./canvas/canvas";
import {
  getZoomLevel,
} from "./canvas/zoom";
import type {
  SpatialNodeModel,
} from "./canvas/nodes";
import type {
  ViewportSize,
} from "./canvas/types";
import {
  SpatialDataLayer,
} from "./canvas/SpatialDataLayer";
import {
  useAnalyzeThreat,
  useHealth,
} from "./api/hooks";
import type {
  ThreatAnalysisResponse,
} from "./api/types";

import "./App.css";

function App() {
  const canvas =
    useCanvasEngine();

  const health =
    useHealth();

  const analyze =
    useAnalyzeThreat();

  const [
    inputMessage,
    setInputMessage,
  ] = useState("");

  const [
    analysisResult,
    setAnalysisResult,
  ] = useState<
    ThreatAnalysisResponse | undefined
  >(undefined);

  const [
    viewportSize,
    setViewportSize,
  ] = useState<ViewportSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const zoomLevel =
    getZoomLevel(
      canvas.camera.zoom,
    );

  useEffect(() => {
    const update = () => {
      setViewportSize({
        width:
          window.innerWidth,
        height:
          window.innerHeight,
      });
    };

    window.addEventListener(
      "resize",
      update,
    );

    return () =>
      window.removeEventListener(
        "resize",
        update,
      );
  }, []);

  const focusNode =
    useCallback(
      (
        node: SpatialNodeModel,
      ) => {
        canvas.focus(
          {
            x:
              node.x +
              node.width / 2,
            y:
              node.y +
              node.height / 2,
          },
          node.kind ===
            "input"
            ? 1.18
            : 0.95,
          550,
        );
      },
      [canvas],
    );

  const handleAnalyze =
    useCallback(() => {
      const text =
        inputMessage.trim();

      if (!text || analyze.isPending) {
        return;
      }

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

            canvas.focus(
              {
                x: 3460,
                y: 3050,
              },
              1.28,
              650,
            );
          },
        },
      );
    }, [
      analyze,
      canvas,
      inputMessage,
    ]);

  const error =
    analyze.error instanceof Error
      ? analyze.error.message
      : null;

  return (
    <main className="app-shell">
      <CanvasViewport
        camera={
          canvas.camera
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
        <SpatialDataLayer
          camera={
            canvas.camera
          }
          zoomLevel={
            zoomLevel
          }
          viewportSize={
            viewportSize
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
          analysisPending={
            analyze.isPending
          }
          analysisError={
            error
          }
          onAnalyze={
            handleAnalyze
          }
        />

        <header className="zui-command-bar">
          <div className="brand-mark">
            S
          </div>

          <div>
            <strong>
              SENTINELAI
            </strong>

            <span>
              spatial threat intelligence
            </span>
          </div>

          <div className="command-spacer" />

          <span
            className={`health-pill ${
              health.data?.status ===
              "ok"
                ? "online"
                : ""
            }`}
          >
            <i />

            {health.data?.status ===
            "ok"
              ? "API ONLINE"
              : "API CHECKING"}
          </span>

          <span className="zoom-pill">
            {zoomLevel.toUpperCase()}{" "}
            ·{" "}
            {Math.round(
              canvas.camera
                .zoom * 100,
            )}
            %
          </span>

          <button
            type="button"
            onClick={
              canvas.zoomOut
            }
          >
            −
          </button>

          <button
            type="button"
            onClick={
              canvas.zoomIn
            }
          >
            +
          </button>

          <button
            type="button"
            onClick={
              canvas.reset
            }
          >
            RESET
          </button>
        </header>

        <div className="zui-help">
          <span>
            SPACE + DRAG
          </span>

          <span>
            RIGHT DRAG
          </span>

          <span>
            WHEEL = ZOOM
          </span>

          <span>
            DOUBLE CLICK = FOCUS
          </span>
        </div>

        <div className="zui-zoom-legend">
          <div>
            <strong>
              MACRO
            </strong>

            <span>
              aggregates
            </span>
          </div>

          <div>
            <strong>
              MESO
            </strong>

            <span>
              analytics
            </span>
          </div>

          <div>
            <strong>
              MICRO
            </strong>

            <span>
              evidence
            </span>
          </div>
        </div>
      </CanvasViewport>
    </main>
  );
}

export default App;
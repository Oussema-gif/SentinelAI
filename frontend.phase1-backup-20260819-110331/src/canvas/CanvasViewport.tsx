import type {
  ReactNode,
} from "react";

import type {
  Camera,
} from "./types";

type Props = {
  camera: Camera;
  isPanning: boolean;
  spaceHeld: boolean;
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onWheel: React.WheelEventHandler<HTMLDivElement>;
  children: ReactNode;
};

export function CanvasViewport({
  camera,
  isPanning,
  spaceHeld,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  children,
}: Props) {
  return (
    <div
      className={[
        "zui-viewport",
        isPanning
          ? "is-panning"
          : "",
        spaceHeld
          ? "space-held"
          : "",
      ].join(" ")}
      onPointerDown={
        onPointerDown
      }
      onPointerMove={
        onPointerMove
      }
      onPointerUp={
        onPointerUp
      }
      onPointerCancel={
        onPointerUp
      }
      onWheel={onWheel}
      onContextMenu={(event) =>
        event.preventDefault()
      }
    >
      <div
        className="zui-grid"
        style={{
          backgroundSize:
            `${Math.max(
              28,
              78 * camera.zoom,
            )}px ${Math.max(
              28,
              78 * camera.zoom,
            )}px`,
          backgroundPosition:
            `${camera.x}px ${camera.y}px`,
        }}
      />

      {children}
    </div>
  );
}

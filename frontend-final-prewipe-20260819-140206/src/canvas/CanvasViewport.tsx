import type {
  CSSProperties,
  ReactNode,
} from "react";

import type {
  Camera,
} from "./types";

type Props = {
  camera: Camera;
  viewportRef?: React.RefObject<
    HTMLDivElement | null
  >;
  isPanning: boolean;
  spaceHeld: boolean;
  onPointerDown:
    React.PointerEventHandler<HTMLDivElement>;
  onPointerMove:
    React.PointerEventHandler<HTMLDivElement>;
  onPointerUp:
    React.PointerEventHandler<HTMLDivElement>;
  onWheel:
    React.WheelEventHandler<HTMLDivElement>;
  children: ReactNode;
};

export function CanvasViewport({
  camera,
  viewportRef,
  isPanning,
  spaceHeld,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  children,
}: Props) {
  const style: CSSProperties = {
    "--zoom":
      camera.zoom,
    "--inverse-zoom":
      camera.zoom > 0
        ? 1 / camera.zoom
        : 1,
    "--camera-x":
      `${camera.x}px`,
    "--camera-y":
      `${camera.y}px`,
  } as CSSProperties;

  return (
    <main
      ref={viewportRef}
      className={[
        "zui-viewport",
        isPanning
          ? "is-panning"
          : "",
        spaceHeld
          ? "space-held"
          : "",
      ].join(" ")}
      style={style}
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
        className="zui-camera-layer"
        style={{
          transform:
            "translate3d(" +
            "var(--camera-x), " +
            "var(--camera-y), 0) " +
            "scale(var(--zoom))",
        }}
      >
        {children}
      </div>
    </main>
  );
}

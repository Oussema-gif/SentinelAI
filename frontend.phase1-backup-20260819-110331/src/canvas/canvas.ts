import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Camera,
  Point,
  Rect,
  ViewportSize,
} from "./types";

export const WORLD = {
  width: 7200,
  height: 4600,
};

export const CAMERA_LIMITS = {
  minZoom: 0.38,
  maxZoom: 1.85,
};

export const INITIAL_CAMERA: Camera = {
  x: -2550,
  y: -1575,
  zoom: 0.62,
};

export function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(
    max,
    Math.max(min, value),
  );
}

export function screenToWorld(
  point: Point,
  camera: Camera,
): Point {
  return {
    x:
      (point.x - camera.x) /
      camera.zoom,
    y:
      (point.y - camera.y) /
      camera.zoom,
  };
}

export function getVisibleWorldRect(
  camera: Camera,
  viewport: ViewportSize,
  overscan = 420,
): Rect {
  const x =
    -camera.x / camera.zoom -
    overscan;

  const y =
    -camera.y / camera.zoom -
    overscan;

  const width =
    viewport.width / camera.zoom +
    overscan * 2;

  const height =
    viewport.height / camera.zoom +
    overscan * 2;

  return {
    x,
    y,
    width,
    height,
  };
}

export function intersects(
  a: Rect,
  b: Rect,
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function easeInOutCubic(
  value: number,
): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 -
        Math.pow(
          -2 * value + 2,
          3,
        ) /
          2;
}

export function useCanvasEngine() {
  const viewportRef =
    useRef<HTMLDivElement>(null);

  const animationRef =
    useRef<number | null>(null);

  const dragRef =
    useRef<{
      pointerX: number;
      pointerY: number;
      cameraX: number;
      cameraY: number;
    } | null>(null);

  const [camera, setCamera] =
    useState<Camera>(
      INITIAL_CAMERA,
    );

  const [spaceHeld, setSpaceHeld] =
    useState(false);

  const [isPanning, setIsPanning] =
    useState(false);

  const cancelAnimation =
    useCallback(() => {
      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current,
        );

        animationRef.current = null;
      }
    }, []);

  useEffect(() => {
    const down = (
      event: KeyboardEvent,
    ) => {
      if (
        event.code === "Space" &&
        !event.repeat
      ) {
        setSpaceHeld(true);
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

      cancelAnimation();
    };
  }, [cancelAnimation]);

  const onPointerDown =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>,
      ) => {
        const shouldPan =
          spaceHeld ||
          event.button === 1 ||
          event.button === 2;

        if (!shouldPan) {
          return;
        }

        cancelAnimation();

        event.currentTarget.setPointerCapture(
          event.pointerId,
        );

        dragRef.current = {
          pointerX: event.clientX,
          pointerY: event.clientY,
          cameraX: camera.x,
          cameraY: camera.y,
        };

        setIsPanning(true);
      },
      [
        camera.x,
        camera.y,
        cancelAnimation,
        spaceHeld,
      ],
    );

  const onPointerMove =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>,
      ) => {
        const drag =
          dragRef.current;

        if (!drag) {
          return;
        }

        setCamera(
          (current) => ({
            ...current,
            x:
              drag.cameraX +
              event.clientX -
              drag.pointerX,
            y:
              drag.cameraY +
              event.clientY -
              drag.pointerY,
          }),
        );
      },
      [],
    );

  const onPointerUp =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>,
      ) => {
        dragRef.current =
          null;

        setIsPanning(false);

        try {
          event.currentTarget.releasePointerCapture(
            event.pointerId,
          );
        } catch {
          // Pointer capture already released.
        }
      },
      [],
    );

  const zoomAt =
    useCallback(
      (
        screenPoint: Point,
        nextZoom: number,
      ) => {
        setCamera(
          (current) => {
            const worldPoint =
              screenToWorld(
                screenPoint,
                current,
              );

            const zoom = clamp(
              nextZoom,
              CAMERA_LIMITS.minZoom,
              CAMERA_LIMITS.maxZoom,
            );

            return {
              zoom,
              x:
                screenPoint.x -
                worldPoint.x *
                  zoom,
              y:
                screenPoint.y -
                worldPoint.y *
                  zoom,
            };
          },
        );
      },
      [],
    );

  const onWheel =
    useCallback(
      (
        event: React.WheelEvent<HTMLDivElement>,
      ) => {
        const viewport =
          viewportRef.current;

        if (!viewport) {
          return;
        }

        const rect =
          viewport.getBoundingClientRect();

        const point = {
          x:
            event.clientX -
            rect.left,
          y:
            event.clientY -
            rect.top,
        };

        const factor =
          event.deltaY > 0
            ? 0.9
            : 1.1;

        zoomAt(
          point,
          camera.zoom * factor,
        );
      },
      [camera.zoom, zoomAt],
    );

  const focus =
    useCallback(
      (
        point: Point,
        zoom = 0.95,
        duration = 550,
      ) => {
        const viewport =
          viewportRef.current;

        if (!viewport) {
          return;
        }

        cancelAnimation();

        const rect =
          viewport.getBoundingClientRect();

        const targetZoom =
          clamp(
            zoom,
            CAMERA_LIMITS.minZoom,
            CAMERA_LIMITS.maxZoom,
          );

        const target: Camera = {
          zoom: targetZoom,
          x:
            rect.width / 2 -
            point.x * targetZoom,
          y:
            rect.height / 2 -
            point.y * targetZoom,
        };

        const startCamera =
          camera;

        const start =
          performance.now();

        const frame = (
          timestamp: number,
        ) => {
          const progress = clamp(
            (timestamp - start) /
              duration,
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

          if (progress < 1) {
            animationRef.current =
              requestAnimationFrame(
                frame,
              );
          } else {
            animationRef.current =
              null;
          }
        };

        animationRef.current =
          requestAnimationFrame(
            frame,
          );
      },
      [
        camera,
        cancelAnimation,
      ],
    );

  const reset =
    useCallback(() => {
      cancelAnimation();
      setCamera(
        INITIAL_CAMERA,
      );
    }, [cancelAnimation]);

  const zoomIn =
    useCallback(() => {
      const viewport =
        viewportRef.current;

      if (!viewport) {
        return;
      }

      focus(
        {
          x:
            WORLD.width / 2,
          y:
            WORLD.height / 2,
        },
        clamp(
          camera.zoom * 1.18,
          CAMERA_LIMITS.minZoom,
          CAMERA_LIMITS.maxZoom,
        ),
        350,
      );
    }, [camera.zoom, focus]);

  const zoomOut =
    useCallback(() => {
      const viewport =
        viewportRef.current;

      if (!viewport) {
        return;
      }

      focus(
        {
          x:
            WORLD.width / 2,
          y:
            WORLD.height / 2,
        },
        clamp(
          camera.zoom * 0.84,
          CAMERA_LIMITS.minZoom,
          CAMERA_LIMITS.maxZoom,
        ),
        350,
      );
    }, [camera.zoom, focus]);

  return {
    viewportRef,
    camera,
    spaceHeld,
    isPanning,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    focus,
    reset,
    zoomIn,
    zoomOut,
  };
}

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Camera,
  Point,
} from "./types";

export const INITIAL_CAMERA: Camera = {
  x: -390,
  y: -10,
  zoom: 0.82,
  vx: 0,
  vy: 0,
};

const MIN_ZOOM = 0.42;
const MAX_ZOOM = 1.85;

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
  t: number,
) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 -
        Math.pow(
          -2 * t + 2,
          3,
        ) /
          2;
}

export function useCanvasEngine() {
  const viewportRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    camera,
    setCamera,
  ] = useState<Camera>(
    INITIAL_CAMERA,
  );

  const cameraRef =
    useRef<Camera>(
      INITIAL_CAMERA,
    );

  const [
    viewportSize,
    setViewportSize,
  ] = useState({
    width:
      window.innerWidth,
    height:
      window.innerHeight,
  });

  const [
    spaceHeld,
    setSpaceHeld,
  ] = useState(false);

  const [
    isPanning,
    setIsPanning,
  ] = useState(false);

  const dragRef =
    useRef<{
      pointerId: number;
      lastX: number;
      lastY: number;
      vx: number;
      vy: number;
      active: boolean;
    } | null>(null);

  const animationRef =
    useRef<number | null>(
      null,
    );

  const focusRef =
    useRef<{
      started: number;
      duration: number;
      from: Camera;
      to: Camera;
    } | null>(null);

  const pendingDeltaRef =
    useRef({
      x: 0,
      y: 0,
    });

  useEffect(() => {
    cameraRef.current =
      camera;
  }, [camera]);

  const stopAnimation =
    useCallback(() => {
      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current,
        );

        animationRef.current =
          null;
      }

      focusRef.current =
        null;
    }, []);

  const commitCamera =
    useCallback(
      (
        next: Camera,
      ) => {
        cameraRef.current =
          next;

        setCamera(next);
      },
      [],
    );

  const runMotion =
    useCallback(() => {
      if (
        animationRef.current !==
        null
      ) {
        return;
      }

      const tick = (
        timestamp: number,
      ) => {
        const focus =
          focusRef.current;

        if (focus) {
          const progress =
            clamp(
              (timestamp -
                focus.started) /
                focus.duration,
              0,
              1,
            );

          const eased =
            easeInOutCubic(
              progress,
            );

          const next: Camera = {
            x:
              focus.from.x +
              (focus.to.x -
                focus.from.x) *
                eased,
            y:
              focus.from.y +
              (focus.to.y -
                focus.from.y) *
                eased,
            zoom:
              focus.from.zoom +
              (focus.to.zoom -
                focus.from.zoom) *
                eased,
            vx: 0,
            vy: 0,
          };

          commitCamera(next);

          if (
            progress < 1
          ) {
            animationRef.current =
              requestAnimationFrame(
                tick,
              );

            return;
          }

          focusRef.current =
            null;

          animationRef.current =
            null;

          return;
        }

        const pending =
          pendingDeltaRef.current;

        const inertia =
          Math.abs(
            cameraRef.current.vx,
          ) > 0.01 ||
          Math.abs(
            cameraRef.current.vy,
          ) > 0.01;

        const hasPending =
          Math.abs(
            pending.x,
          ) > 0 ||
          Math.abs(
            pending.y,
          ) > 0;

        if (
          hasPending ||
          inertia
        ) {
          const current =
            cameraRef.current;

          const nextVx =
            current.vx * 0.91 +
            pending.x * 0.14;

          const nextVy =
            current.vy * 0.91 +
            pending.y * 0.14;

          pendingDeltaRef.current =
            {
              x: 0,
              y: 0,
            };

          commitCamera({
            x:
              current.x +
              nextVx,
            y:
              current.y +
              nextVy,
            zoom:
              current.zoom,
            vx: nextVx,
            vy: nextVy,
          });

          animationRef.current =
            requestAnimationFrame(
              tick,
            );

          return;
        }

        animationRef.current =
          null;
      };

      animationRef.current =
        requestAnimationFrame(
          tick,
        );
    }, [commitCamera]);

  useEffect(() => {
    const keyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.code === "Space"
      ) {
        event.preventDefault();
        setSpaceHeld(true);
      }
    };

    const keyUp = (
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
      keyDown,
    );

    window.addEventListener(
      "keyup",
      keyUp,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        keyDown,
      );

      window.removeEventListener(
        "keyup",
        keyUp,
      );

      stopAnimation();
    };
  }, [stopAnimation]);

  useEffect(() => {
    const viewport =
      viewportRef.current;

    if (!viewport) {
      return;
    }

    const observer =
      new ResizeObserver(
        (entries) => {
          const entry =
            entries[0];

          if (!entry) {
            return;
          }

          setViewportSize({
            width:
              entry.contentRect.width,
            height:
              entry.contentRect.height,
          });
        },
      );

    observer.observe(
      viewport,
    );

    return () =>
      observer.disconnect();
  }, []);

  const onPointerDown =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>,
      ) => {
        if (
          event.button !== 0 &&
          event.button !== 1
        ) {
          return;
        }

        if (
          !spaceHeld &&
          event.button === 0
        ) {
          return;
        }

        stopAnimation();

        event.currentTarget.setPointerCapture(
          event.pointerId,
        );

        dragRef.current = {
          pointerId:
            event.pointerId,
          lastX:
            event.clientX,
          lastY:
            event.clientY,
          vx: 0,
          vy: 0,
          active: true,
        };

        setIsPanning(
          true,
        );
      },
      [
        spaceHeld,
        stopAnimation,
      ],
    );

  const onPointerMove =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>,
      ) => {
        const drag =
          dragRef.current;

        if (
          !drag ||
          !drag.active ||
          drag.pointerId !==
            event.pointerId
        ) {
          return;
        }

        type CoalescedPointerEvent =
          PointerEvent & {
            getCoalescedEvents?: () =>
              PointerEvent[];
          };

        const nativeEvent =
          event.nativeEvent as unknown as
            CoalescedPointerEvent;

        const coalesced =
          nativeEvent.getCoalescedEvents
            ? nativeEvent.getCoalescedEvents()
            : [nativeEvent];

        let totalX = 0;
        let totalY = 0;

        for (
          const point of coalesced
        ) {
          totalX +=
            point.clientX -
            drag.lastX;

          totalY +=
            point.clientY -
            drag.lastY;

          drag.lastX =
            point.clientX;

          drag.lastY =
            point.clientY;
        }

        pendingDeltaRef.current.x +=
          totalX;

        pendingDeltaRef.current.y +=
          totalY;

        drag.vx =
          totalX;

        drag.vy =
          totalY;

        runMotion();
      },
      [runMotion],
    );

  const onPointerUp =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>,
      ) => {
        const drag =
          dragRef.current;

        if (
          !drag ||
          drag.pointerId !==
            event.pointerId
        ) {
          return;
        }

        drag.active =
          false;

        pendingDeltaRef.current.x +=
          drag.vx;

        pendingDeltaRef.current.y +=
          drag.vy;

        dragRef.current =
          null;

        setIsPanning(
          false,
        );

        if (
          event.currentTarget.hasPointerCapture(
            event.pointerId,
          )
        ) {
          event.currentTarget.releasePointerCapture(
            event.pointerId,
          );
        }

        runMotion();
      },
      [runMotion],
    );

  const onWheel =
    useCallback(
      (
        event: React.WheelEvent<HTMLDivElement>,
      ) => {
        event.preventDefault();

        const rect =
          event.currentTarget.getBoundingClientRect();

        const mouseX =
          event.clientX -
          rect.left;

        const mouseY =
          event.clientY -
          rect.top;

        const current =
          cameraRef.current;

        const worldX =
          (mouseX -
            current.x) /
          current.zoom;

        const worldY =
          (mouseY -
            current.y) /
          current.zoom;

        const targetZoom =
          clamp(
            current.zoom *
              Math.exp(
                -event.deltaY *
                  0.0015,
              ),
            MIN_ZOOM,
            MAX_ZOOM,
          );

        const next: Camera = {
          x:
            mouseX -
            worldX *
              targetZoom,
          y:
            mouseY -
            worldY *
              targetZoom,
          zoom:
            targetZoom,
          vx: 0,
          vy: 0,
        };

        focusRef.current =
          null;

        commitCamera(next);
      },
      [commitCamera],
    );

  const focus =
    useCallback(
      (
        point: Point,
        zoom: number,
        duration = 900,
      ) => {
        stopAnimation();

        const viewport =
          viewportRef.current;

        if (!viewport) {
          return;
        }

        const width =
          viewport.clientWidth;

        const height =
          viewport.clientHeight;

        const nextZoom =
          clamp(
            zoom,
            MIN_ZOOM,
            MAX_ZOOM,
          );

        const target: Camera = {
          x:
            width / 2 -
            point.x *
              nextZoom,
          y:
            height / 2 -
            point.y *
              nextZoom,
          zoom:
            nextZoom,
          vx: 0,
          vy: 0,
        };

        focusRef.current = {
          started:
            performance.now(),
          duration,
          from:
            cameraRef.current,
          to: target,
        };

        runMotion();
      },
      [
        runMotion,
        stopAnimation,
      ],
    );

  const reset =
    useCallback(() => {
      stopAnimation();

      commitCamera(
        INITIAL_CAMERA,
      );
    }, [
      commitCamera,
      stopAnimation,
    ]);

  return {
    viewportRef,
    camera,
    viewportSize,
    spaceHeld,
    isPanning,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    focus,
    reset,
  };
}

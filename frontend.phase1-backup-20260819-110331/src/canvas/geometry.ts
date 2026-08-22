import type {
  Point,
  Rect,
} from "./types";
import type {
  Camera,
  ViewportSize,
} from "./types";

export function rectCenter(
  rect: Rect,
): Point {
  return {
    x:
      rect.x +
      rect.width / 2,
    y:
      rect.y +
      rect.height / 2,
  };
}

export function pointInRect(
  point: Point,
  rect: Rect,
): boolean {
  return (
    point.x >= rect.x &&
    point.x <=
      rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <=
      rect.y + rect.height
  );
}

export function rectContains(
  outer: Rect,
  inner: Rect,
): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <=
      outer.x + outer.width &&
    inner.y + inner.height <=
      outer.y + outer.height
  );
}

export function rectIntersects(
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

export function expandRect(
  rect: Rect,
  padding: number,
): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width:
      rect.width +
      padding * 2,
    height:
      rect.height +
      padding * 2,
  };
}

export function distanceBetween(
  a: Point,
  b: Point,
): number {
  return Math.hypot(
    b.x - a.x,
    b.y - a.y,
  );
}

export function lerp(
  from: number,
  to: number,
  progress: number,
): number {
  return (
    from +
    (to - from) * progress
  );
}

export function lerpPoint(
  from: Point,
  to: Point,
  progress: number,
): Point {
  return {
    x: lerp(
      from.x,
      to.x,
      progress,
    ),
    y: lerp(
      from.y,
      to.y,
      progress,
    ),
  };
}

export function getVisibleWorldRect(
  camera: Camera,
  viewport: ViewportSize,
): Rect {
  return {
    x:
      -camera.x /
      camera.zoom,

    y:
      -camera.y /
      camera.zoom,

    width:
      viewport.width /
      camera.zoom,

    height:
      viewport.height /
      camera.zoom,
  };
}

export function intersects(
  a: Rect,
  b: Rect,
): boolean {
  return (
    a.x <
      b.x + b.width &&
    a.x + a.width >
      b.x &&
    a.y <
      b.y + b.height &&
    a.y + a.height >
      b.y
  );
}
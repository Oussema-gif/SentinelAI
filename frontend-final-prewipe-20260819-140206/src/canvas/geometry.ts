import type {
  Camera,
  CanvasNode,
  Rect,
  ViewportSize,
} from "./types";

export function getVisibleWorldRect(
  camera: Camera,
  viewport: ViewportSize,
  overscan = 220,
): Rect {
  const width =
    viewport.width / camera.zoom;

  const height =
    viewport.height / camera.zoom;

  return {
    x:
      -camera.x / camera.zoom -
      overscan,
    y:
      -camera.y / camera.zoom -
      overscan,
    width:
      width + overscan * 2,
    height:
      height + overscan * 2,
  };
}

export function intersects(
  node: CanvasNode,
  rect: Rect,
): boolean {
  return !(
    node.x + node.width <
      rect.x ||
    node.x >
      rect.x + rect.width ||
    node.y + node.height <
      rect.y ||
    node.y >
      rect.y + rect.height
  );
}

export function cullNodes(
  nodes: CanvasNode[],
  visibleRect: Rect,
): CanvasNode[] {
  return nodes.filter(
    (node) =>
      intersects(
        node,
        visibleRect,
      ),
  );
}

export function worldToScreen(
  point: { x: number; y: number },
  camera: Camera,
) {
  return {
    x:
      point.x * camera.zoom +
      camera.x,
    y:
      point.y * camera.zoom +
      camera.y,
  };
}

export function screenToWorld(
  point: { x: number; y: number },
  camera: Camera,
) {
  return {
    x:
      (point.x - camera.x) /
      camera.zoom,
    y:
      (point.y - camera.y) /
      camera.zoom,
  };
}
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

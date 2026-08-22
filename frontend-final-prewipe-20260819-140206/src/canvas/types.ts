export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Camera = {
  x: number;
  y: number;
  zoom: number;
  vx: number;
  vy: number;
};

export type ViewportSize = Size;

export type ZoomLevel =
  | "macro"
  | "meso"
  | "micro";

export type CanvasNodeKind =
  | "message"
  | "threat"
  | "investigation"
  | "model"
  | "archive";

export type CanvasNode = {
  id: string;
  kind: CanvasNodeKind;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasInteraction =
  | "idle"
  | "panning"
  | "inertia";

export type CameraTarget = {
  point: Point;
  zoom: number;
  duration: number;
};
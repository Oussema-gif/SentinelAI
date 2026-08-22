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
};

export type ViewportSize = Size;

export type ZoomLevel =
  | "macro"
  | "meso"
  | "micro";

export type CanvasInteraction =
  | "idle"
  | "panning";

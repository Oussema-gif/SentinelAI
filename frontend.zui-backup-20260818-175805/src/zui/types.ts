import type { ReactNode } from "react";

export type SpatialNodeType =
  | "overview"
  | "investigation"
  | "analytics"
  | "model"
  | "analysis"
  | "signal"
  | "link";

export type SpatialNodeStatus =
  | "idle"
  | "active"
  | "processing"
  | "critical";

export interface SpatialPosition {
  x: number;
  y: number;
}

export interface SpatialSize {
  width: number;
  height: number;
}

export interface SpatialNode {
  id: string;
  type: SpatialNodeType;

  position: SpatialPosition;
  size: SpatialSize;

  importance: number;

  status?: SpatialNodeStatus;

  label: string;
  description?: string;

  metadata?: Record<string, unknown>;

  render?: () => ReactNode;
}

export interface SpatialConnection {
  id: string;

  from: string;
  to: string;

  label?: string;

  strength?: number;
}

export interface SpatialCluster {
  id: string;

  type:
    | "overview"
    | "investigations"
    | "analytics"
    | "model"
    | "analysis";

  position: SpatialPosition;
  size: SpatialSize;

  label: string;

  description?: string;

  importance: number;
}

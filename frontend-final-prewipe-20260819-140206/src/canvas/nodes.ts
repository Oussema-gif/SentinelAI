import type {
  CanvasNode,
} from "./types";

export const WORLD = {
  width: 6400,
  height: 4200,
};

export const SPATIAL_NODES: CanvasNode[] = [
  {
    id: "message-field",
    kind: "message",
    x: 550,
    y: 1650,
    width: 880,
    height: 620,
  },
  {
    id: "threat-field",
    kind: "threat",
    x: 1900,
    y: 1250,
    width: 860,
    height: 620,
  },
  {
    id: "investigation-field",
    kind: "investigation",
    x: 3150,
    y: 1250,
    width: 980,
    height: 700,
  },
  {
    id: "model-field",
    kind: "model",
    x: 4500,
    y: 1250,
    width: 860,
    height: 620,
  },
  {
    id: "archive-field",
    kind: "archive",
    x: 2500,
    y: 2800,
    width: 1300,
    height: 650,
  },
];

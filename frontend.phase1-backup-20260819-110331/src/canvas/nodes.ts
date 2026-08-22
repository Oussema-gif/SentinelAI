import type { Rect } from "./types";

export type SpatialNodeKind =
  | "overview"
  | "model"
  | "usage"
  | "threat"
  | "timeline"
  | "risk"
  | "categories"
  | "signals"
  | "input"
  | "result";

export type SpatialNodeModel =
  Rect & {
    id: string;
    kind: SpatialNodeKind;
    title: string;
    subtitle?: string;
  };

export const SPATIAL_NODES: SpatialNodeModel[] =
  [
    {
      id: "overview",
      kind: "overview",
      title:
        "Threat Intelligence",
      subtitle:
        "Global investigation field",
      x: 1200,
      y: 1050,
      width: 1250,
      height: 720,
    },
    {
      id: "model",
      kind: "model",
      title:
        "Model Intelligence",
      subtitle:
        "Classifier and evaluation",
      x: 700,
      y: 360,
      width: 780,
      height: 520,
    },
    {
      id: "usage",
      kind: "usage",
      title:
        "Traffic Telemetry",
      subtitle:
        "Prediction activity",
      x: 5050,
      y: 450,
      width: 780,
      height: 520,
    },
    {
      id: "threat",
      kind: "threat",
      title:
        "Threat Overview",
      subtitle:
        "Severity and classification",
      x: 3550,
      y: 900,
      width: 980,
      height: 600,
    },
    {
      id: "timeline",
      kind: "timeline",
      title:
        "Threat Timeline",
      subtitle:
        "Temporal investigation flow",
      x: 4100,
      y: 1750,
      width: 1250,
      height: 650,
    },
    {
      id: "risk",
      kind: "risk",
      title:
        "Risk Distribution",
      subtitle:
        "Critical / high / medium / low",
      x: 5350,
      y: 1450,
      width: 850,
      height: 600,
    },
    {
      id: "categories",
      kind: "categories",
      title:
        "Threat Categories",
      subtitle:
        "Detected attack families",
      x: 900,
      y: 2050,
      width: 950,
      height: 600,
    },
    {
      id: "signals",
      kind: "signals",
      title:
        "Threat Signals",
      subtitle:
        "Behavioral indicators",
      x: 2000,
      y: 2900,
      width: 1100,
      height: 620,
    },
    {
      id: "input",
      kind: "input",
      title:
        "Message Analysis",
      subtitle:
        "Submit a message",
      x: 3000,
      y: 2700,
      width: 920,
      height: 700,
    },
  ];

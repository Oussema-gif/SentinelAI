import type {
  SpatialCluster,
  SpatialConnection,
} from "../zui/types";

export const SENTINEL_WORLD = {
  width: 10000,
  height: 7000,
};

export const SENTINEL_ZONES = {
  overview: {
    x: 4550,
    y: 3200,
  },

  investigations: {
    x: 2350,
    y: 3150,
  },

  analytics: {
    x: 6900,
    y: 2200,
  },

  model: {
    x: 6850,
    y: 5000,
  },

  analysis: {
    x: 4550,
    y: 5350,
  },
} as const;

export const SENTINEL_CLUSTERS: SpatialCluster[] = [
  {
    id: "cluster:overview",
    type: "overview",

    position: SENTINEL_ZONES.overview,

    size: {
      width: 900,
      height: 650,
    },

    label: "Threat Overview",

    description:
      "Strategic view of the SentinelAI threat environment.",

    importance: 1,
  },

  {
    id: "cluster:investigations",
    type: "investigations",

    position:
      SENTINEL_ZONES.investigations,

    size: {
      width: 1200,
      height: 1000,
    },

    label: "Investigation Field",

    description:
      "Spatial exploration of analyzed threat cases.",

    importance: 0.95,
  },

  {
    id: "cluster:analytics",
    type: "analytics",

    position:
      SENTINEL_ZONES.analytics,

    size: {
      width: 1500,
      height: 1100,
    },

    label: "Threat Analytics",

    description:
      "Risk, category, signal and timeline intelligence.",

    importance: 0.92,
  },

  {
    id: "cluster:model",
    type: "model",

    position:
      SENTINEL_ZONES.model,

    size: {
      width: 1000,
      height: 850,
    },

    label: "Model Intelligence",

    description:
      "SentinelAI model performance and provenance.",

    importance: 0.84,
  },

  {
    id: "cluster:analysis",
    type: "analysis",

    position:
      SENTINEL_ZONES.analysis,

    size: {
      width: 1100,
      height: 800,
    },

    label: "Analysis Lab",

    description:
      "Investigate suspicious messages in real time.",

    importance: 1,
  },
];

export const SENTINEL_CONNECTIONS: SpatialConnection[] = [
  {
    id: "connection:model-analysis",
    from: "cluster:model",
    to: "cluster:analysis",
    label: "classifies",
    strength: 0.8,
  },

  {
    id: "connection:analysis-investigations",
    from: "cluster:analysis",
    to: "cluster:investigations",
    label: "creates investigations",
    strength: 1,
  },

  {
    id: "connection:investigations-analytics",
    from: "cluster:investigations",
    to: "cluster:analytics",
    label: "feeds analytics",
    strength: 0.95,
  },

  {
    id: "connection:analytics-overview",
    from: "cluster:analytics",
    to: "cluster:overview",
    label: "summarizes",
    strength: 0.9,
  },
];

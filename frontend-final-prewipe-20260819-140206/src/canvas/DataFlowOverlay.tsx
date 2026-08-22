import type {
  CanvasNode,
} from "./types";

type Props = {
  nodes: CanvasNode[];
  activeNodeId?: string;
  threatActive?: boolean;
};

function center(node: CanvasNode) {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };
}

function pathBetween(
  from: CanvasNode,
  to: CanvasNode,
) {
  const a = center(from);
  const b = center(to);

  const distance =
    Math.abs(b.x - a.x);

  const bend = Math.max(
    120,
    Math.min(420, distance * 0.35),
  );

  return `
    M ${a.x} ${a.y}
    C ${a.x + bend} ${a.y},
      ${b.x - bend} ${b.y},
      ${b.x} ${b.y}
  `;
}

export function DataFlowOverlay({
  nodes,
  activeNodeId,
  threatActive = false,
}: Props) {
  const byId = new Map(
    nodes.map((node) => [
      node.id,
      node,
    ]),
  );

  const edges = [
    [
      "message-field",
      "threat-field",
    ],
    [
      "threat-field",
      "investigation-field",
    ],
    [
      "investigation-field",
      "model-field",
    ],
    [
      "threat-field",
      "archive-field",
    ],
  ] as const;

  return (
    <svg
      className="data-flow-overlay"
      width="100%"
      height="100%"
      viewBox="0 0 8200 5600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="sentinel-flow"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#00e5a3"
            stopOpacity="0"
          />
          <stop
            offset="35%"
            stopColor="#00e5a3"
            stopOpacity="0.75"
          />
          <stop
            offset="65%"
            stopColor="#ffb800"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            stopColor="#ff3366"
            stopOpacity="0"
          />
        </linearGradient>

        <filter
          id="flow-glow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur
            stdDeviation="7"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {edges.map(
        ([fromId, toId]) => {
          const from = byId.get(
            fromId,
          );
          const to = byId.get(
            toId,
          );

          if (!from || !to) {
            return null;
          }

          const active =
            activeNodeId === fromId ||
            activeNodeId === toId;

          return (
            <path
              key={`${fromId}-${toId}`}
              d={pathBetween(
                from,
                to,
              )}
              className={[
                "data-flow-path",
                active
                  ? "is-active"
                  : "",
                threatActive
                  ? "has-threat"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              pathLength="1"
            />
          );
        },
      )}
    </svg>
  );
}

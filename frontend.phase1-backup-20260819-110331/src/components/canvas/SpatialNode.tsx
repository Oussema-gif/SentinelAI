import type {
  ReactNode,
} from "react";

import type {
  SpatialNodeModel,
} from "../../canvas/nodes";

type Props = {
  node: SpatialNodeModel;
  children: ReactNode;
  className?: string;
  onFocus: () => void;
};

export function SpatialNode({
  node,
  children,
  className = "",
  onFocus,
}: Props) {
  return (
    <section
      className={[
        "spatial-node",
        className,
      ].join(" ")}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight:
          node.height,
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onFocus();
      }}
    >
      <div className="spatial-node-heading">
        <div>
          <span>
            {node.kind}
          </span>

          <h2>
            {node.title}
          </h2>

          {node.subtitle && (
            <p>
              {node.subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFocus();
          }}
        >
          FOCUS
        </button>
      </div>

      {children}
    </section>
  );
}

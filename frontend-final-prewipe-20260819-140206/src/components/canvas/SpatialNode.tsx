import type {
  ReactNode,
  Ref,
} from "react";

import type {
  CanvasNode,
} from "../../canvas/types";

type Props = {
  node: CanvasNode;
  className?: string;
  onFocus?: () => void;
  nodeRef?: Ref<HTMLElement>;
  children: ReactNode;
};

export function SpatialNode({
  node,
  className = "",
  onFocus,
  nodeRef,
  children,
}: Props) {
  return (
    <section
      ref={nodeRef}
      className={`spatial-node ${className}`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight: node.height,
        height: "auto",
        boxSizing: "border-box",
      }}
      onDoubleClick={onFocus}
    >
      {children}
    </section>
  );
}

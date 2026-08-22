import type {
  MouseEvent,
  ReactNode,
} from "react";

import type {
  SemanticZoomLevel,
} from "../../zui/semanticZoom";

interface SpatialClusterProps {
  x: number;
  y: number;

  width: number;
  height: number;

  title: string;
  description?: string;

  zoomLevel: SemanticZoomLevel;

  selected?: boolean;

  onSelect?: () => void;

  children?: ReactNode;
}

export function SpatialCluster({
  x,
  y,
  width,
  height,
  title,
  description,
  zoomLevel,
  selected = false,
  onSelect,
  children,
}: SpatialClusterProps) {
  function handlePointerDown(
    event: MouseEvent<HTMLDivElement>,
  ) {
    event.stopPropagation();
    onSelect?.();
  }

  return (
    <div
      className={[
        "zui-cluster",
        `zui-cluster--${zoomLevel}`,
        selected
          ? "zui-cluster--selected"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: x,
        top: y,
        width,
        minHeight: height,
      }}
      onMouseDown={handlePointerDown}
    >
      <div className="zui-cluster__header">
        <div>
          <div className="zui-cluster__eyebrow">
            SENTINELAI SPACE
          </div>

          <h2 className="zui-cluster__title">
            {title}
          </h2>

          {description && (
            <p className="zui-cluster__description">
              {description}
            </p>
          )}
        </div>

        <div className="zui-cluster__zoom">
          {zoomLevel.toUpperCase()}
        </div>
      </div>

      <div className="zui-cluster__content">
        {children}
      </div>
    </div>
  );
}

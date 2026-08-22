import { useEffect, useMemo, useRef } from "react";

import type {
  RiskLevel,
  ThreatInvestigationHistoryItem,
} from "../../api/types";
import { clampSeverity, getSeverityColor } from "../radar/severityColorScale";

import "./StormHistoryTimeline.css";

interface StormHistoryTimelineProps {
  items: ThreatInvestigationHistoryItem[];
  selectedId?: number | null;
  isLoading?: boolean;
  error?: string | null;
  onSelect: (item: ThreatInvestigationHistoryItem) => void;
  onRefresh?: () => void;
}

function getRiskLevelLabel(riskLevel: RiskLevel): string {
  return riskLevel.replace(/_/g, " ");
}

// Converts raw backend enum/snake_case values (e.g. "benign_message")
// into human-readable display text (e.g. "Benign Message"). Use this
// anywhere a raw category/classifier string from the API is rendered.
function formatCategoryLabel(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPreviewText(item: ThreatInvestigationHistoryItem): string {
  if (item.recommendation.trim()) {
    return item.recommendation.trim();
  }

  if (item.signals.length > 0) {
    return item.signals[0].label;
  }

  return "No additional investigation detail.";
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function summarizeClassifier(label: string): string {
  return label === "spam" ? "Spam classifier" : "Ham classifier";
}

export function StormHistoryTimeline({
  items,
  selectedId = null,
  isLoading = false,
  error = null,
  onSelect,
  onRefresh,
}: StormHistoryTimelineProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      if (!viewport || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }

    viewport.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const orderedItems = useMemo(
    () =>
      [...items].sort(
        (first, second) =>
          new Date(second.created_at).getTime() -
          new Date(first.created_at).getTime(),
      ),
    [items],
  );

  return (
    <section className="storm-history" aria-labelledby="storm-history-title">
      <header className="storm-history__header">
        <div>
          <p className="storm-history__eyebrow">Investigation history</p>

          <h2 id="storm-history-title">Storm history</h2>

          <p className="storm-history__description">
            Review previously scanned messages by their recorded severity.
          </p>
        </div>

        {onRefresh && (
          <button
            className="storm-history__refresh"
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </header>

      {error && (
        <div className="storm-history__error" role="alert">
          {error}
        </div>
      )}

      {isLoading && orderedItems.length === 0 && (
        <div className="storm-history__empty">
          Loading investigation history...
        </div>
      )}

      {!isLoading && !error && orderedItems.length === 0 && (
        <div className="storm-history__empty">
          No investigations have been recorded yet.
        </div>
      )}

      {orderedItems.length > 0 && (
        <div className="storm-history__scroll-shell">
          <div
            ref={viewportRef}
            className="storm-history__viewport"
            tabIndex={0}
            aria-label="Scrollable storm history timeline"
          >
            <ol className="storm-history__timeline">
              {orderedItems.map((item) => {
                const severity = clampSeverity(item.severity);
                const color = getSeverityColor(severity);
                const glowAlpha = severity >= 80 ? "2A" : "1A";
                const isSelected = selectedId === item.id;

                return (
                  <li
                    className={`storm-history__entry ${
                      isSelected ? "storm-history__entry--selected" : ""
                    }`}
                    key={item.id}
                  >
                    <button
                      className="storm-history__entry-button"
                      type="button"
                      onClick={() => onSelect(item)}
                      aria-pressed={isSelected}
                      aria-label={`Open investigation from ${formatCreatedAt(
                        item.created_at,
                      )}, severity ${severity}`}
                      style={
                        {
                          "--storm-color": color,
                          "--storm-size": `${Math.max(
                            0.65,
                            0.65 + severity / 100,
                          )}rem`,
                          borderLeft: `3px solid ${color}`,
                          boxShadow: `0 0 24px 0 ${color}${glowAlpha}`,
                        } as React.CSSProperties
                      }
                    >
                      <span
                        className="storm-history__storm-dot"
                        aria-hidden="true"
                      />

                      <span className="storm-history__entry-date">
                        {formatCreatedAt(item.created_at)}
                      </span>

                      <span className="storm-history__entry-severity">
                        <strong>{severity}</strong>
                        <small>/ 100</small>
                      </span>

                      <span className="storm-history__entry-risk">
                        {getRiskLevelLabel(item.risk_level)}
                      </span>

                      <span className="storm-history__entry-category">
                        {formatCategoryLabel(item.category)}
                      </span>

                      <span className="storm-history__entry-preview">
                        {getPreviewText(item)}
                      </span>

                      <span className="storm-history__entry-classifier">
                        {summarizeClassifier(item.classifier_label)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
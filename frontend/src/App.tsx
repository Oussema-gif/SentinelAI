import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  useModelInfo,
  useThreatAnalysis,
  useThreatCategoryDistribution,
  useThreatInvestigations,
  useThreatOverview,
} from "./api/hooks";
import type {
  ThreatAnalysisResponse,
  ThreatInvestigationHistoryItem,
} from "./api/types";
import { ForecastCard } from "./components/forecast/ForecastCard";
import { LogoIcon } from "./components/LogoIcon";
import { StormHistoryTimeline } from "./components/history/StormHistoryTimeline";
import { MessageIntake } from "./components/intake/MessageIntake";
import { ModelInfoPanel } from "./components/model/ModelInfoPanel";
import { RadarDisplay } from "./components/radar/RadarDisplay";
import { RegionalOverviewPanel } from "./components/overview/RegionalOverviewPanel";

import "./App.css";

interface CategorySummary {
  category: string;
  count: number;
}

interface ForecastCustomProperties extends CSSProperties {
  "--forecast-color"?: string;
}

function getLatestCategory(
  categories: CategorySummary[] | undefined,
): string | null {
  if (!categories || categories.length === 0) {
    return null;
  }

  const sortedCategories = [...categories].sort(
    (first, second) => second.count - first.count,
  );

  return sortedCategories[0]?.category ?? null;
}

function App() {
  const analysis = useThreatAnalysis();
  const investigations = useThreatInvestigations({
    page: 1,
    pageSize: 20,
  });
  const overview = useThreatOverview();
  const categories = useThreatCategoryDistribution();
  const model = useModelInfo();

  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(
    null,
  );
  const [selectedHistoryAnalysis, setSelectedHistoryAnalysis] =
    useState<ThreatAnalysisResponse | null>(null);
  const radarSectionRef = useRef<HTMLDivElement>(null);

  const mostCommonCategory = useMemo(
    () =>
      getLatestCategory(
        categories.data?.items.map((item) => ({
          category: item.category,
          count: item.count,
        })),
      ),
    [categories.data],
  );

  const displayedAnalysis = selectedHistoryAnalysis ?? analysis.data;

  const handleAnalyze = useCallback(
    async (text: string): Promise<void> => {
      setSelectedHistoryId(null);
      setSelectedHistoryAnalysis(null);

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      radarSectionRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      await analysis.analyze(text, 6);

      await Promise.all([
        investigations.refresh(),
        overview.refresh(),
        categories.refresh(),
      ]);
    },
    [analysis, categories, investigations, overview],
  );

  const handleSelectHistory = useCallback(
    (item: ThreatInvestigationHistoryItem): void => {
      setSelectedHistoryId(item.id);
      setSelectedHistoryAnalysis(item);
    },
    [],
  );

  const handleRefreshHistory = useCallback((): Promise<void> => {
    return investigations.refresh();
  }, [investigations]);

  const handleRefreshOverview = useCallback((): Promise<void> => {
    return overview.refresh();
  }, [overview]);

  const handleRefreshModel = useCallback((): Promise<void> => {
    return model.refresh();
  }, [model]);

  const forecastStyle: ForecastCustomProperties | undefined = displayedAnalysis
    ? {
        "--forecast-color": "#4FC3F7",
      }
    : undefined;

  return (
    <main className="app-shell">
      <div className="app-shell__atmosphere" aria-hidden="true">
        <span className="app-shell__cloud app-shell__cloud--one" />
        <span className="app-shell__cloud app-shell__cloud--two" />
        <span className="app-shell__cloud app-shell__cloud--three" />
        <span className="app-shell__stars" />
        <span className="app-shell__lightning" />
      </div>

      <div className="app-shell__container">
        <header className="app-shell__header">
          <div className="app-shell__brand">
            <LogoIcon
              className="app-shell__brand-mark"
              size={40}
            />

            <div className="app-shell__brand-copy">
              <h1>SentinelAI</h1>

              <p>
                Scan message conditions, identify threat intensity, and review
                the forecast before taking action.
              </p>
            </div>
          </div>

          <div className="app-shell__header-status">
            <span className="app-shell__header-status-dot" aria-hidden="true" />
            <span>Threat radar online</span>
          </div>
        </header>

        <div className="app-shell__analysis-layout">
          <section className="app-shell__main-flow">
            <MessageIntake
              isAnalyzing={analysis.isLoading}
              error={analysis.error}
              onAnalyze={handleAnalyze}
            />

            <div ref={radarSectionRef} className="app-shell__radar-shell">
              <RadarDisplay
                severity={displayedAnalysis?.severity}
                riskLevel={displayedAnalysis?.risk_level}
                isAnalyzing={analysis.isLoading}
                hasResult={Boolean(displayedAnalysis)}
              />
            </div>

            <div className="app-shell__forecast-shell" style={forecastStyle}>
              <ForecastCard
                analysis={displayedAnalysis}
                isResolving={analysis.isLoading}
              />
            </div>
          </section>

          <aside className="app-shell__side-flow">
            <div className="app-shell__overview-shell">
              <RegionalOverviewPanel
                overview={overview.data}
                mostCommonCategory={mostCommonCategory}
                isLoading={overview.isLoading}
                error={overview.error}
                onRefresh={handleRefreshOverview}
              />
            </div>

            <div className="app-shell__model-shell">
              <ModelInfoPanel
                model={model.data}
                isLoading={model.isLoading}
                error={model.error}
                onRefresh={handleRefreshModel}
              />
            </div>
          </aside>
        </div>

        <section className="app-shell__secondary-layout">
          <div className="app-shell__history-shell">
            <StormHistoryTimeline
              items={investigations.data?.items ?? []}
              selectedId={selectedHistoryId}
              isLoading={investigations.isLoading}
              error={investigations.error}
              onSelect={handleSelectHistory}
              onRefresh={handleRefreshHistory}
            />
          </div>
        </section>

        <footer className="app-shell__footer">
          <p>
            Weather framing supports interpretation; technical backend values
            remain available in each forecast.
          </p>

          <p>
            API: <code>http://127.0.0.1:8080</code>
          </p>
        </footer>
      </div>
    </main>
  );
}

export default App;

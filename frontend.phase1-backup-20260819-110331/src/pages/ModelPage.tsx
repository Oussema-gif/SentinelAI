import { useQuery } from "@tanstack/react-query";

import { getModelInfo } from "../api/client";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";

export function ModelPage() {
  const query = useQuery({
    queryKey: ["model-info"],
    queryFn: getModelInfo,
  });

  if (query.isLoading) {
    return <LoadingState />;
  }

  if (query.error) {
    return (
      <ErrorState
        message={query.error.message}
      />
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">
            MODEL
          </div>

          <h1>
            Model Intelligence
          </h1>
        </div>
      </header>

      <div className="result-card">
        <pre>
          {JSON.stringify(
            query.data,
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}

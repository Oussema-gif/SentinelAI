import type {
  ThreatAnalysisResponse,
} from "../api/types";

export type InvestigationRecord = {
  id: string;

  result: ThreatAnalysisResponse;

  message: string;

  x: number;
  y: number;

  createdAt: number;
};

export const INVESTIGATION_SIZE = {
  width: 1050,
  height: 620,
};

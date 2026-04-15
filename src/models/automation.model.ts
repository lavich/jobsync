// Automation types and interfaces
import type { AutomationLog } from "@/lib/automation-logger";

export type AutomationStatus = "active" | "paused";
export type AutomationRunStatus =
  | "running"
  | "completed"
  | "failed"
  | "completed_with_errors"
  | "blocked"
  | "rate_limited";
export type DiscoveryStatus = "new" | "accepted" | "dismissed";
export type JobBoard = "jsearch" | "telegram" | "hh";

export interface Automation {
  id: string;
  userId: string;
  name: string;
  jobBoard: JobBoard;
  keywords: string;
  location: string;
  telegramChannels?: string[];
  resumeId: string;
  matchThreshold: number;
  scheduleHour: number;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  status: AutomationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationWithResume extends Automation {
  resume: {
    id: string;
    title: string;
  };
}

export interface MatchResult {
  title: string;
  company: string;
  score: number;
  passed: boolean;
  saved: boolean;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  jobsSearched: number;
  jobsDeduplicated: number;
  jobsProcessed: number;
  jobsMatched: number;
  jobsSaved: number;
  status: AutomationRunStatus;
  errorMessage: string | null;
  blockedReason: string | null;
  startedAt: Date;
  completedAt: Date | null;
  logs: AutomationLog[] | null;
  matchResults: MatchResult[] | null;
  errorCount: number;
  warningCount: number;
}

export interface DiscoveredJob {
  id: string;
  userId: string;
  automationId: string;
  automation?: {
    id: string;
    name: string;
  };
  jobUrl: string | null;
  description: string;
  jobType: string;
  createdAt: Date;
  jobTitleId: string;
  companyId: string;
  locationId: string | null;
  matchScore: number;
  matchData: string | null;
  discoveryStatus: DiscoveryStatus;
  discoveredAt: Date;
  JobTitle: { label: string };
  Company: { label: string };
  Location?: { label: string } | null;
}

export interface ScrapedJobData {
  title: string;
  company: string;
  location: string;
  description: string;
  sourceUrl: string;
  sourceBoard: JobBoard;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import {
  Pause,
  Play,
  RefreshCw,
  Loader2,
  Clock,
  FileText,
  AlertTriangle,
  PlayCircle,
  Pencil,
} from "lucide-react";
import {
  pauseAutomation,
  resumeAutomation,
  getDiscoveredJobById,
} from "@/actions/automation.actions";
import { AutomationWizard } from "@/components/automations/AutomationWizard";
import type {
  AutomationWithResume,
  AutomationRun,
  DiscoveredJob,
} from "@/models/automation.model";
import type { JobMatchResponse } from "@/models/ai.schemas";
import { DiscoveredJobsList } from "@/components/automations/DiscoveredJobsList";
import { DiscoveredJobDetail } from "@/components/automations/DiscoveredJobDetail";
import { RunHistoryList } from "@/components/automations/RunHistoryList";
import { LogsTab } from "@/components/automations/LogsTab";

interface AutomationDetailClientProps {
  automation: AutomationWithResume;
  runs: AutomationRun[];
  jobs: DiscoveredJob[];
}

export function AutomationDetailClient({
  automation,
  runs,
  jobs,
}: AutomationDetailClientProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);
  const [runNowLoading, setRunNowLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<DiscoveredJob | null>(null);
  const [selectedJobMatchData, setSelectedJobMatchData] =
    useState<JobMatchResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);

  const resumeMissing = !automation.resume;
  const newJobsCount = jobs.filter((j) => j.discoveryStatus === "new").length;

  const handlePauseResume = async () => {
    setActionLoading(true);
    const result =
      automation.status === "active"
        ? await pauseAutomation(automation.id)
        : await resumeAutomation(automation.id);
    setActionLoading(false);

    if (result.success) {
      toast({
        title:
          automation.status === "active"
            ? "Automation paused"
            : "Automation resumed",
      });
      router.refresh();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleRunNow = async () => {
    setRunNowLoading(true);
    setRunKey((prev) => prev + 1);
    try {
      const response = await fetch(`/api/automations/${automation.id}/run`, {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Automation run started",
          description: `Saved ${data.run.jobsSaved} new jobs`,
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to run automation",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to run automation", variant: "destructive" });
    }
    setRunNowLoading(false);
  };

  const handleViewJobDetails = async (job: DiscoveredJob) => {
    const result = await getDiscoveredJobById(job.id);
    if (result.success && result.data) {
      setSelectedJob(result.data);
      setSelectedJobMatchData(result.data.parsedMatchData as JobMatchResponse | null);
    } else {
      setSelectedJob(job);
      setSelectedJobMatchData(null);
    }
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{automation.name}</h1>
          <p className="text-muted-foreground">
            {automation.keywords} in {automation.location}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setWizardOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handlePauseResume}
            disabled={actionLoading || resumeMissing}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : automation.status === "active" ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {automation.status === "active" ? "Pause" : "Resume"}
          </Button>
          <Button
            variant="outline"
            onClick={handleRunNow}
            disabled={runNowLoading || resumeMissing || automation.status === "paused"}
          >
            {runNowLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            Run Now
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={automation.status === "active" ? "default" : "secondary"}
                className="mt-1"
              >
                {automation.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Job Board</p>
              <p className="font-medium capitalize">{automation.jobBoard}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Match Threshold</p>
              <p className="font-medium">{automation.matchThreshold}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Schedule</p>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {automation.scheduleHour.toString().padStart(2, "0")}:00 daily
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resume</p>
              {resumeMissing ? (
                <p className="text-amber-600 flex items-center gap-1 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Missing
                </p>
              ) : (
                <p className="font-medium flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {automation.resume.title}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Run</p>
              <p className="font-medium">
                {automation.nextRunAt && automation.status === "active"
                  ? format(new Date(automation.nextRunAt), "MMM d, h:mm a")
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Run</p>
              <p className="font-medium">
                {automation.lastRunAt
                  ? format(new Date(automation.lastRunAt), "MMM d, h:mm a")
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Discovered Jobs</p>
              <p className="font-medium">
                {jobs.length} total
                {newJobsCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {newJobsCount} new
                  </Badge>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="jobs">
            Discovered Jobs
            {newJobsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {newJobsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
        </TabsList>
        <TabsContent value="logs" className="mt-4">
          <LogsTab automationId={automation.id} runKey={runKey} />
        </TabsContent>
        <TabsContent value="jobs" className="mt-4">
          <DiscoveredJobsList
            jobs={jobs}
            onRefresh={() => router.refresh()}
            onViewDetails={handleViewJobDetails}
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <RunHistoryList runs={runs} />
        </TabsContent>
      </Tabs>

      <DiscoveredJobDetail
        job={selectedJob}
        matchData={selectedJobMatchData}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRefresh={() => router.refresh()}
      />

      <AutomationWizard
        open={wizardOpen}
        onOpenChange={(open) => setWizardOpen(open)}
        onSuccess={() => router.refresh()}
        editAutomation={automation}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FileText, AlertTriangle } from "lucide-react";
import { getDiscoveredJobById } from "@/actions/automation.actions";
import { AutomationWizard } from "@/components/automations/AutomationWizard";
import { AutomationActions } from "@/components/automations/AutomationActions";
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

export function AutomationDetailClient({ automation, runs, jobs }: AutomationDetailClientProps) {
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState<DiscoveredJob | null>(null);
  const [selectedJobMatchData, setSelectedJobMatchData] = useState<JobMatchResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);

  const resumeMissing = !automation.resume;
  const newJobsCount = jobs.filter((j) => j.discoveryStatus === "new").length;

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

  const handleRefresh = () => {
    setRunKey((prev) => prev + 1);
    router.refresh();
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
        <AutomationActions
          automation={automation}
          onEdit={() => setWizardOpen(true)}
          onRefresh={handleRefresh}
          onAfterDelete={() => router.push("/dashboard/automations")}
          showDelete
          variant="responsive"
        />
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
            onRefresh={handleRefresh}
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
        onRefresh={handleRefresh}
      />

      <AutomationWizard
        open={wizardOpen}
        onOpenChange={(open) => setWizardOpen(open)}
        onSuccess={handleRefresh}
        editAutomation={automation}
      />
    </div>
  );
}

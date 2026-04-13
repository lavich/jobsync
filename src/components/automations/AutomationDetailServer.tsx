import { redirect } from "next/navigation";
import {
  getAutomationById,
  getDiscoveredJobs,
  getAutomationRuns,
} from "@/actions/automation.actions";
import { AutomationDetailClient } from "./AutomationDetailClient";

export async function AutomationDetailServer({ id }: { id: string }) {
  const [automationResult, runsResult, jobsResult] = await Promise.all([
    getAutomationById(id),
    getAutomationRuns(id),
    getDiscoveredJobs({ automationId: id }),
  ]);

  if (!automationResult.success || !automationResult.data) {
    redirect("/dashboard/automations");
  }

  return (
    <AutomationDetailClient
      automation={automationResult.data}
      runs={runsResult.success && runsResult.data ? runsResult.data : []}
      jobs={jobsResult.success && jobsResult.data ? jobsResult.data : []}
    />
  );
}

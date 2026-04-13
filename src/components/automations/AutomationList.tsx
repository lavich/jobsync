"use client";

import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, FileText, Zap } from "lucide-react";
import type { AutomationWithResume } from "@/models/automation.model";
import Link from "next/link";
import { AutomationActions } from "./AutomationActions";

interface AutomationListProps {
  automations: AutomationWithResume[];
  onEdit: (automation: AutomationWithResume) => void;
  onRefresh: () => void;
}

export function AutomationList({ automations, onEdit, onRefresh }: AutomationListProps) {
  if (automations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No automations yet</h3>
          <p className="text-muted-foreground text-center mt-2">
            Create your first automation to start discovering jobs automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {automations.map((automation) => {
        const resumeMissing = !automation.resume;

        return (
          <div
            key={automation.id}
            className="flex items-start justify-between p-4 rounded-lg border bg-card"
          >
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={`/dashboard/automations/${automation.id}`}
                  className="font-semibold hover:underline"
                >
                  {automation.name}
                </Link>
                <Badge variant="outline" className="capitalize">
                  {automation.jobBoard}
                </Badge>
                <Badge variant={automation.status === "active" ? "default" : "secondary"}>
                  {automation.status}
                </Badge>
              </div>

              {resumeMissing && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Resume missing - select a new one</span>
                </div>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">Keywords:</span>{" "}
                  {automation.keywords}
                </span>
                <span>
                  <span className="font-medium text-foreground">Location:</span>{" "}
                  {automation.location}
                </span>
                {automation.resume && (
                  <span>
                    <span className="font-medium text-foreground">Resume:</span>{" "}
                    {automation.resume.title}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{automation.scheduleHour.toString().padStart(2, "0")}:00 daily</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{automation.matchThreshold}% threshold</span>
                </div>
                {automation.nextRunAt && automation.status === "active" && (
                  <span className="text-xs">
                    Next: {format(new Date(automation.nextRunAt), "MMM d, h:mm a")}
                  </span>
                )}
                {automation.lastRunAt && (
                  <span className="text-xs">
                    Last: {format(new Date(automation.lastRunAt), "MMM d, h:mm a")}
                  </span>
                )}
              </div>
            </div>

            <AutomationActions
              automation={automation}
              onEdit={() => onEdit(automation)}
              onRefresh={onRefresh}
              showDelete
            />
          </div>
        );
      })}
    </div>
  );
}

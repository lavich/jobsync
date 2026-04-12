"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, Loader2 } from "lucide-react";
import { BOARD_CONFIGS } from "../boardConfigs";
import type { WizardStepProps } from "../types";

export function ReviewStep({ formValues, resumes, isSubmitting, isEditMode, onPrev }: WizardStepProps) {
  const config = BOARD_CONFIGS[formValues.jobBoard];
  const selectedResume = resumes.find((r) => r.id === formValues.resumeId);

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{formValues.name || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Job Board</span>
            <span className="font-medium">{config.name}</span>
          </div>
          {config.reviewRows(formValues)}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resume</span>
            <span className="font-medium">{selectedResume?.title || "Not selected"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Match Threshold</span>
            <span className="font-medium">{formValues.matchThreshold ?? 80}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Schedule</span>
            <span className="font-medium">
              Daily at {(formValues.scheduleHour ?? 8).toString().padStart(2, "0")}:00
            </span>
          </div>
        </div>
      </div>
      <DialogFooter className="gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditMode ? "Update" : "Create"} Automation
        </Button>
      </DialogFooter>
    </>
  );
}

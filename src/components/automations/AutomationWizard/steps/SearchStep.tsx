"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BOARD_CONFIGS } from "../boardConfigs";
import type { WizardStepProps } from "../types";

export function SearchStep({ control, formValues, onPrev, onNext }: WizardStepProps) {
  const config = BOARD_CONFIGS[formValues.jobBoard];
  const canProceed = config.step1CanProceed(formValues);

  return (
    <>
      <div className="space-y-4">
        <config.SearchFields control={control} />
      </div>
      <DialogFooter className="gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={!canProceed}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </>
  );
}

"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WizardStepProps } from "../types";

export function MatchingStep({ control, onPrev, onNext }: WizardStepProps) {
  return (
    <>
      <div className="space-y-4">
        <FormField
          control={control}
          name="matchThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Match Threshold: {field.value}%</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                />
              </FormControl>
              <FormDescription>
                Only save jobs that match your resume above this percentage. Higher = fewer but better matches.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <DialogFooter className="gap-2 mt-6">
        <Button type="button" variant="outline" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </>
  );
}

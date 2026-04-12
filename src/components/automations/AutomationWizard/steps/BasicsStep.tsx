"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ChevronRight } from "lucide-react";
import { BOARD_CONFIGS } from "../boardConfigs";
import type { WizardStepProps } from "../types";

export function BasicsStep({ control, formValues, onNext }: WizardStepProps) {
  const canProceed = BOARD_CONFIGS[formValues.jobBoard].step0CanProceed(formValues);

  return (
    <>
      <div className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Automation Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Full Stack Jobs Calgary" {...field} />
              </FormControl>
              <FormDescription>A descriptive name to identify this automation</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="jobBoard"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Board</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job board" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(BOARD_CONFIGS).map(([value, cfg]) => (
                    <SelectItem key={value} value={value}>
                      {cfg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>The source to search for jobs</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {BOARD_CONFIGS[formValues.jobBoard].step0ExtraFields?.(control)}
      </div>
      <DialogFooter className="gap-2 mt-6">
        <Button type="button" onClick={onNext} disabled={!canProceed}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogFooter>
    </>
  );
}

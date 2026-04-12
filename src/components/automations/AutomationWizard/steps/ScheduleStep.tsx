"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HOURS } from "../constants";
import type { WizardStepProps } from "../types";

export function ScheduleStep({ control, onPrev, onNext }: WizardStepProps) {
  return (
    <>
      <div className="space-y-4">
        <FormField
          control={control}
          name="scheduleHour"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Daily Run Time</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(parseInt(val))}
                value={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value.toString()}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The automation will run daily at this time (server timezone)
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

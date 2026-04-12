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
import type { WizardStepProps } from "../types";

export function ResumeStep({ control, formValues, resumes, onPrev, onNext }: WizardStepProps) {
  const canProceed = (formValues.resumeId?.length ?? 0) > 0;

  return (
    <>
      <div className="space-y-4">
        <FormField
          control={control}
          name="resumeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume for Matching</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resume" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Jobs will be matched against this resume</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {resumes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No resumes found. Please create a resume in your profile first.
          </p>
        )}
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

"use client";

import { useState, useEffect, type ComponentType } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CreateAutomationSchema, type CreateAutomationInput } from "@/models/automation.schema";
import { createAutomation, updateAutomation } from "@/actions/automation.actions";
import { getResumeList } from "@/actions/profile.actions";
import { toast } from "@/components/ui/use-toast";
import type { AutomationWithResume } from "@/models/automation.model";
import { STEPS } from "./constants";
import { parseTelegramChannels } from "./ChannelsPicker";
import { BasicsStep } from "./steps/BasicsStep";
import { SearchStep } from "./steps/SearchStep";
import { ResumeStep } from "./steps/ResumeStep";
import { MatchingStep } from "./steps/MatchingStep";
import { ScheduleStep } from "./steps/ScheduleStep";
import { ReviewStep } from "./steps/ReviewStep";
import type { Resume, WizardStepProps } from "./types";

const WIZARD_STEPS: ComponentType<WizardStepProps>[] = [
  BasicsStep,
  SearchStep,
  ResumeStep,
  MatchingStep,
  ScheduleStep,
  ReviewStep,
];

interface AutomationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editAutomation?: AutomationWithResume | null;
}

export function AutomationWizard({
  open,
  onOpenChange,
  onSuccess,
  editAutomation,
}: AutomationWizardProps) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoaded, setResumesLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResumesLoaded(false);
    getResumeList(1, 100).then((result) => {
      if (result?.data) {
        setResumes(result.data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })));
      }
      setResumesLoaded(true);
    });
  }, [open]);

  const form = useForm<CreateAutomationInput>({
    resolver: zodResolver(CreateAutomationSchema),
    mode: "onChange",
    defaultValues: {
      name: editAutomation?.name ?? "",
      jobBoard: editAutomation?.jobBoard ?? "jsearch",
      keywords: editAutomation?.keywords ?? "",
      location: editAutomation?.location ?? "",
      telegramChannels: parseTelegramChannels(editAutomation?.telegramChannels),
      resumeId: editAutomation?.resumeId ?? "",
      matchThreshold: editAutomation?.matchThreshold ?? 80,
      scheduleHour: editAutomation?.scheduleHour ?? 8,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editAutomation?.name ?? "",
        jobBoard: editAutomation?.jobBoard ?? "jsearch",
        keywords: editAutomation?.keywords ?? "",
        location: editAutomation?.location ?? "",
        telegramChannels: parseTelegramChannels(editAutomation?.telegramChannels),
        resumeId: editAutomation?.resumeId ?? "",
        matchThreshold: editAutomation?.matchThreshold ?? 80,
        scheduleHour: editAutomation?.scheduleHour ?? 8,
      });
      setStep(0);
    }
  }, [open, editAutomation, form]);

  const handleClose = () => {
    form.reset();
    setStep(0);
    onOpenChange(false);
  };

  const onSubmit = async (data: CreateAutomationInput) => {
    setIsSubmitting(true);
    try {
      const result = editAutomation
        ? await updateAutomation(editAutomation.id, data)
        : await createAutomation(data);

      if (result.success) {
        toast({
          title: editAutomation ? "Automation updated" : "Automation created",
          description: editAutomation
            ? "Your automation has been updated successfully."
            : "Your automation has been created and will run at the scheduled time.",
        });
        form.reset();
        setStep(0);
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save automation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStep = WIZARD_STEPS[step];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editAutomation ? "Edit Automation" : "Create Automation"}
          </DialogTitle>
          {resumesLoaded && resumes.length > 0 && (
            <DialogDescription>
              Step {step + 1} of {STEPS.length}: {STEPS[step].description}
            </DialogDescription>
          )}
        </DialogHeader>

        {resumesLoaded && resumes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-3">
            <p>You need to create a resume before setting up automations.</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/profile">Go to Profile</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-1 mb-4">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-8 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  const firstError = Object.values(errors)[0];
                  if (firstError?.message) {
                    toast({
                      title: "Validation Error",
                      description: firstError.message as string,
                      variant: "destructive",
                    });
                  }
                })}
              >
                <div className="py-4">
                  <CurrentStep
                    control={form.control}
                    formValues={form.watch()}
                    resumes={resumes}
                    isSubmitting={isSubmitting}
                    isEditMode={!!editAutomation}
                    onPrev={() => setStep((s) => s - 1)}
                    onNext={() => setStep((s) => s + 1)}
                  />
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

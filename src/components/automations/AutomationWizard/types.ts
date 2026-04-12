import type { Control } from "react-hook-form";
import type { CreateAutomationInput } from "@/models/automation.schema";

export interface Resume {
  id: string;
  title: string;
}

export type FieldsProps = { control: Control<CreateAutomationInput> };

export interface WizardStepProps {
  control: Control<CreateAutomationInput>;
  formValues: CreateAutomationInput;
  resumes: Resume[];
  isSubmitting: boolean;
  isEditMode: boolean;
  onPrev: () => void;
  onNext: () => void;
}

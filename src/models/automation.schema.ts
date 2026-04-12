import { z } from "zod";

export const JobBoardSchema = z.enum(["jsearch", "telegram"]);

export const AutomationStatusSchema = z.enum(["active", "paused"]);

export const AutomationRunStatusSchema = z.enum([
  "running",
  "completed",
  "failed",
  "completed_with_errors",
  "blocked",
  "rate_limited",
]);

export const DiscoveryStatusSchema = z.enum(["new", "accepted", "dismissed"]);

const BaseAutomationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  resumeId: z.string().uuid("Invalid resume"),
  matchThreshold: z.number().min(0).max(100),
  scheduleHour: z.number().min(0).max(23),
});

const JSearchAutomationSchema = BaseAutomationSchema.extend({
  jobBoard: z.literal("jsearch"),
  keywords: z.string().min(1, "Keywords are required").max(200),
  location: z.string().min(1, "Location is required").max(100),
  telegramChannels: z.array(z.string()).optional(),
});

const TelegramAutomationSchema = BaseAutomationSchema.extend({
  jobBoard: z.literal("telegram"),
  telegramChannels: z.array(z.string()).min(1, "At least one channel is required"),
  keywords: z.string().max(200).optional(),
  location: z.string().max(100),
});

export const CreateAutomationSchema = z.discriminatedUnion("jobBoard", [
  JSearchAutomationSchema,
  TelegramAutomationSchema,
]);

export const UpdateAutomationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  jobBoard: JobBoardSchema.optional(),
  keywords: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  telegramChannels: z.array(z.string()).optional(),
  resumeId: z.string().uuid("Invalid resume").optional(),
  matchThreshold: z.number().min(0).max(100).optional(),
  scheduleHour: z.number().min(0).max(23).optional(),
});

export type CreateAutomationInput = z.infer<typeof CreateAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof UpdateAutomationSchema>;

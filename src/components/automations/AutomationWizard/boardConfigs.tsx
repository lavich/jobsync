"use client";

import type { ComponentType, ReactNode } from "react";
import type { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CreateAutomationInput } from "@/models/automation.schema";
import type { JobBoard } from "@/models/automation.model";
import { ChannelsTextarea } from "./ChannelsTextarea";
import type { FieldsProps } from "./types";

export interface BoardConfig {
  name: string;
  SearchFields: ComponentType<FieldsProps>;
  step0ExtraFields?: (control: Control<CreateAutomationInput>) => ReactNode;
  step0CanProceed: (v: CreateAutomationInput) => boolean;
  step1CanProceed: (v: CreateAutomationInput) => boolean;
  reviewRows: (v: CreateAutomationInput) => ReactNode;
}

function JSearchFields({ control }: FieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="keywords"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Search Keywords</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Full Stack Developer" {...field} />
            </FormControl>
            <FormDescription>Job titles, skills, or keywords to search for</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Calgary, AB" {...field} />
            </FormControl>
            <FormDescription>City, state/province, or region to search in</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function TelegramFields({ control }: FieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input placeholder="e.g., United States" {...field} />
            </FormControl>
            <FormDescription>Used to match your location preferences</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="keywords"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Keywords (optional)</FormLabel>
            <FormControl>
              <Input placeholder="e.g., React, TypeScript, remote" {...field} />
            </FormControl>
            <FormDescription>Hint for the AI when filtering posts (optional)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export const BOARD_CONFIGS: Record<JobBoard, BoardConfig> = {
  jsearch: {
    name: "JSearch (Google Jobs)",
    SearchFields: JSearchFields,
    step0CanProceed: (v) => !!(v.name?.trim()),
    step1CanProceed: (v) => !!(v.keywords?.trim()) && !!(v.location?.trim()),
    reviewRows: (v) => (
      <>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Keywords</span>
          <span className="font-medium">{v.keywords || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Location</span>
          <span className="font-medium">{v.location || "-"}</span>
        </div>
      </>
    ),
  },
  telegram: {
    name: "Telegram Channels",
    SearchFields: TelegramFields,
    step0ExtraFields: (control) => (
      <FormField
        control={control}
        name="telegramChannels"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telegram Channels</FormLabel>
            <FormControl>
              <ChannelsTextarea value={field.value ?? []} onChange={field.onChange} />
            </FormControl>
            <FormDescription>
              One channel per line (e.g. @jobschannel). You must be subscribed to each channel.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    step0CanProceed: (v) =>
      !!(v.name?.trim()) &&
      Array.isArray(v.telegramChannels) &&
      v.telegramChannels.length > 0,
    step1CanProceed: (v) => !!(v.location?.trim()),
    reviewRows: (v) => (
      <>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Channels</span>
          <span className="font-medium text-right max-w-[220px] break-words">
            {(v.telegramChannels ?? []).join(", ") || "-"}
          </span>
        </div>
        {v.keywords && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Keywords hint</span>
            <span className="font-medium">{v.keywords}</span>
          </div>
        )}
      </>
    ),
  },
};

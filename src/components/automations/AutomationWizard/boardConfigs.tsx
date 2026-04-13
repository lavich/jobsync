"use client";

import type { ComponentType, ReactNode } from "react";
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
  step0CanProceed: (v: CreateAutomationInput) => boolean;
  step1CanProceed: (v: CreateAutomationInput) => boolean;
  reviewRows: (v: CreateAutomationInput) => ReactNode;
}

function KeywordsLocationFields({ control, children }: FieldsProps & { children?: ReactNode }) {
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
      {children}
    </>
  );
}


const keywordsLocationReviewRows = (v: CreateAutomationInput) => (
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
);

const keywordsLocationCanProceed = (v: CreateAutomationInput) =>
  !!(v.keywords?.trim()) && !!(v.location?.trim());

export const BOARD_CONFIGS: Record<JobBoard, BoardConfig> = {
  hh: {
    name: "HeadHunter (hh.ru)",
    SearchFields: KeywordsLocationFields,
    step0CanProceed: (v) => !!(v.name?.trim()),
    step1CanProceed: keywordsLocationCanProceed,
    reviewRows: keywordsLocationReviewRows,
  },
  jsearch: {
    name: "JSearch (Google Jobs)",
    SearchFields: KeywordsLocationFields,
    step0CanProceed: (v) => !!(v.name?.trim()),
    step1CanProceed: keywordsLocationCanProceed,
    reviewRows: keywordsLocationReviewRows,
  },
  telegram: {
    name: "Telegram Channels",
    SearchFields: ({ control }) => (
      <KeywordsLocationFields control={control}>
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
      </KeywordsLocationFields>
    ),
    step0CanProceed: (v) => !!(v.name?.trim()),
    step1CanProceed: (v) =>
      keywordsLocationCanProceed(v) &&
      'telegramChannels' in v &&
      Array.isArray(v.telegramChannels) &&
      v.telegramChannels.length > 0,
    reviewRows: (v) => (
      <>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Channels</span>
          <span className="font-medium text-right max-w-[220px] break-words">
            {('telegramChannels' in v ? v.telegramChannels ?? [] : []).join(", ") || "-"}
          </span>
        </div>
        {keywordsLocationReviewRows(v)}
      </>
    ),
  },
};

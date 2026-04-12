"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";

export function parseTelegramChannels(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val) as string[]; } catch { return []; }
}

export function ChannelsTextarea({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [text, setText] = useState(() => value.join("\n"));

  useEffect(() => {
    const joined = value.join("\n");
    const parsed = text.split("\n").map((l) => l.trim()).filter(Boolean).join("\n");
    if (joined !== parsed) {
      setText(joined);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean));
  };

  return (
    <Textarea
      className="min-h-[100px]"
      placeholder={"@jobschannel\n@devjobs\n@remote_jobs"}
      value={text}
      onChange={handleChange}
    />
  );
}

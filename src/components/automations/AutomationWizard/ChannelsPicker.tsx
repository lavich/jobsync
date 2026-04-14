"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw } from "lucide-react";
export function parseTelegramChannels(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val) as string[]; } catch { return []; }
}

interface Channel {
  username: string;
  title: string;
}

export function ChannelsPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const selected = new Set(value);

  async function loadChannels() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/telegram/channels");
      const json = await res.json() as { channels?: Channel[]; error?: string };
      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to load channels");
        return;
      }
      setChannels(json.channels ?? []);
      setLoaded(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function toggle(username: string) {
    const next = new Set(selected);
    if (next.has(username)) {
      next.delete(username);
    } else {
      next.add(username);
    }
    onChange(Array.from(next));
  }

  if (!loaded) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadChannels}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Load channels from Telegram
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {value.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Selected: {value.join(", ")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {selected.size} selected
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={loadChannels}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
      {channels.length === 0 ? (
        <p className="text-sm text-muted-foreground">No channels found. Make sure you are subscribed to channels in Telegram.</p>
      ) : (
        <ScrollArea className="h-48 rounded-md border">
          <div className="p-2 space-y-1">
            {channels.map((ch) => (
              <label
                key={ch.username}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(ch.username)}
                  onCheckedChange={() => toggle(ch.username)}
                />
                <span className="flex-1 text-sm font-medium">{ch.title}</span>
                <span className="text-xs text-muted-foreground">{ch.username}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}


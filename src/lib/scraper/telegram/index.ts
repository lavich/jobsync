import { TelegramClient, Api, sessions } from "telegram";

const { StringSession } = sessions;
import type { JobDetails, ScraperResult } from "../types";

export interface TelegramChannel {
  username: string;
  title: string;
}

export async function getUserChannels(
  sessionString: string,
): Promise<TelegramChannel[]> {
  let client: TelegramClient | null = null;
  try {
    const { apiId, apiHash } = getApiCredentials();
    const session = new StringSession(sessionString);
    client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 3 });
    await client.connect();

    const dialogs = await client.getDialogs({});
    const channels: TelegramChannel[] = [];

    for (const dialog of dialogs) {
      const entity = dialog.entity;
      if (entity instanceof Api.Channel && entity.broadcast && entity.username) {
        channels.push({ username: `@${entity.username}`, title: dialog.title ?? entity.username });
      }
    }

    return channels;
  } finally {
    if (client) {
      try { await client.disconnect(); } catch { /* ignore */ }
    }
  }
}

function getApiCredentials(): { apiId: number; apiHash: string } {
  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
  const apiHash = process.env.TELEGRAM_API_HASH || "";

  if (!apiId || !apiHash) {
    throw new Error(
      "TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables are required",
    );
  }

  return { apiId, apiHash };
}

export async function searchTelegramChannels(
  channels: string[],
  sessionString: string,
  sinceDate?: Date | null,
): Promise<ScraperResult<JobDetails[]>> {
  let client: TelegramClient | null = null;

  try {
    const { apiId, apiHash } = getApiCredentials();
    const session = new StringSession(sessionString);
    client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 3,
    });

    await client.connect();

    const cutoff = sinceDate
      ? sinceDate
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const results: JobDetails[] = [];

    for (const channel of channels) {
      try {
        const channelName = channel.startsWith("@") ? channel.slice(1) : channel;
        const messages = await client.getMessages(channelName, { limit: 100 });

        messages.forEach((msg) => {
          if (!msg.message) return;

          const msgDate = new Date((msg.date ?? 0) * 1000);
          if (msgDate < cutoff) return;

          const msgId = msg.id;
          const url = `https://t.me/${channelName}/${msgId}`;

          results.push({
            title: "Telegram Post",
            company: channel,
            location: "Unknown",
            description: msg.message,
            url,
          });
        })
      } catch (channelError) {
        const message =
          channelError instanceof Error
            ? channelError.message
            : "Unknown error";
        console.error(`[Telegram] Failed to read channel ${channel}:`, message);
      }
    }
    return { success: true, data: results };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Telegram error";
    console.error("[Telegram] searchTelegramChannels error:", message);
    return {
      success: false,
      error: { type: "network", message },
    };
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch {
        // ignore disconnect errors
      }
    }
  }
}

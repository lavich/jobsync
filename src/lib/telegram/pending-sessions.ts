import { TelegramClient } from "telegram";

export interface PendingSession {
  client: TelegramClient;
  phoneNumber: string;
  phoneCodeHash: string;
  awaitingPassword: boolean;
}

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Use `global` so the map survives Next.js dev-mode HMR module re-evaluations.
// In production this is just a regular module-level singleton.
const g = global as typeof globalThis & {
  _telegramPendingSessions?: Map<string, PendingSession>;
  _telegramPendingTimers?: Map<string, ReturnType<typeof setTimeout>>;
};

if (!g._telegramPendingSessions) {
  g._telegramPendingSessions = new Map<string, PendingSession>();
}
if (!g._telegramPendingTimers) {
  g._telegramPendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
}

const sessions = g._telegramPendingSessions;
const timers = g._telegramPendingTimers;

function clearTimer(userId: string) {
  const existing = timers.get(userId);
  if (existing) {
    clearTimeout(existing);
    timers.delete(userId);
  }
}

const pendingSessions = {
  get: (userId: string) => sessions.get(userId),

  set: (userId: string, session: PendingSession) => {
    clearTimer(userId);
    sessions.set(userId, session);
    timers.set(
      userId,
      setTimeout(() => {
        const entry = sessions.get(userId);
        if (entry) {
          entry.client.disconnect().catch(() => {});
          sessions.delete(userId);
        }
        timers.delete(userId);
      }, SESSION_TTL_MS),
    );
  },

  delete: (userId: string) => {
    clearTimer(userId);
    sessions.delete(userId);
  },
};

export default pendingSessions;

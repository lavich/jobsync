import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { TelegramClient, sessions } from "telegram";

const { StringSession } = sessions;
import db from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import pendingSessions from "@/lib/telegram/pending-sessions";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
  const apiHash = process.env.TELEGRAM_API_HASH || "";

  if (!apiId || !apiHash) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Telegram API credentials are not configured. Set TELEGRAM_API_ID and TELEGRAM_API_HASH.",
      },
      { status: 500 },
    );
  }

  const { phoneNumber } = await req.json();

  if (!phoneNumber || typeof phoneNumber !== "string") {
    return NextResponse.json(
      { success: false, error: "Phone number is required" },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  // Clean up any previous pending session
  const existing = pendingSessions.get(userId);
  if (existing) {
    try {
      await existing.client.disconnect();
    } catch {
      // ignore
    }
    pendingSessions.delete(userId);
  }

  try {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 3,
    });

    await client.connect();

    const result = await client.sendCode({ apiId, apiHash }, phoneNumber);
    const { phoneCodeHash } = result;

    // Keep client in global map (survives HMR in dev mode via global trick)
    pendingSessions.set(userId, {
      client,
      phoneNumber,
      phoneCodeHash,
      awaitingPassword: false,
    });

    // Also persist to DB so verify can reconstruct client if map is somehow lost
    const { encrypted, iv } = encrypt(
      JSON.stringify({ phoneNumber, phoneCodeHash, awaitingPassword: false }),
    );
    await db.apiKey.upsert({
      where: { userId_provider: { userId, provider: "telegram_pending" } },
      create: {
        userId,
        provider: "telegram_pending",
        encryptedKey: encrypted,
        iv,
        last4: phoneNumber.slice(-4),
        label: null,
      },
      update: {
        encryptedKey: encrypted,
        iv,
        last4: phoneNumber.slice(-4),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send code";
    console.error("[Telegram/start] Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

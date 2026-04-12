import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { TelegramClient, Api, sessions } from "telegram";

const { StringSession } = sessions;
import { computeCheck } from "telegram/Password";
import db from "@/lib/db";
import { encrypt, decrypt, getLast4 } from "@/lib/encryption";
import pendingSessions from "@/lib/telegram/pending-sessions";

interface PendingDbState {
  phoneNumber: string;
  phoneCodeHash: string;
  awaitingPassword: boolean;
}

async function readPendingFromDb(userId: string): Promise<PendingDbState | null> {
  const record = await db.apiKey.findUnique({
    where: { userId_provider: { userId, provider: "telegram_pending" } },
  });
  if (!record) return null;
  try {
    const json = decrypt(record.encryptedKey, record.iv);
    return JSON.parse(json) as PendingDbState;
  } catch {
    return null;
  }
}

async function updateAwaitingPassword(userId: string, state: PendingDbState) {
  const { encrypted, iv } = encrypt(
    JSON.stringify({ ...state, awaitingPassword: true }),
  );
  await db.apiKey.update({
    where: { userId_provider: { userId, provider: "telegram_pending" } },
    data: { encryptedKey: encrypted, iv },
  });
}

async function cleanupPending(userId: string) {
  pendingSessions.delete(userId);
  await db.apiKey.deleteMany({
    where: { userId, provider: "telegram_pending" },
  });
}

async function complete2FA(client: TelegramClient, password: string) {
  const passwordData = await client.invoke(new Api.account.GetPassword());
  const passwordCheck = await computeCheck(passwordData, password);
  await client.invoke(new Api.auth.CheckPassword({ password: passwordCheck }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  const { code, password } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { success: false, error: "Verification code is required" },
      { status: 400 },
    );
  }

  // Read state from DB (source of truth)
  const dbState = await readPendingFromDb(userId);
  if (!dbState) {
    return NextResponse.json(
      { success: false, error: "No pending Telegram authentication. Please start over." },
      { status: 400 },
    );
  }

  const { phoneNumber, phoneCodeHash, awaitingPassword } = dbState;

  // Try to get the live client from the global map
  let memEntry = pendingSessions.get(userId);

  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
  const apiHash = process.env.TELEGRAM_API_HASH || "";

  // If the global map was cleared (e.g., server restart) and we're in the 2FA step,
  // we can't recover — the session tied to the phone code is gone.
  if (!memEntry && awaitingPassword) {
    await cleanupPending(userId);
    return NextResponse.json(
      {
        success: false,
        error: "Session expired. Please start the authentication over.",
        sessionExpired: true,
      },
      { status: 400 },
    );
  }

  // If client is missing but we haven't reached 2FA yet, we can reconstruct it
  // with a fresh connection and re-submit the phone code.
  if (!memEntry) {
    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 3,
    });
    await client.connect();
    memEntry = { client, phoneNumber, phoneCodeHash, awaitingPassword };
    pendingSessions.set(userId, memEntry);
  }

  const { client } = memEntry;

  try {
    if (!awaitingPassword) {
      // First verify step: submit phone code
      try {
        await client.invoke(
          new Api.auth.SignIn({ phoneNumber, phoneCodeHash, phoneCode: code }),
        );
      } catch (signInError) {
        const errMsg =
          signInError instanceof Error
            ? signInError.message
            : String(signInError);

        if (errMsg.includes("SESSION_PASSWORD_NEEDED")) {
          if (!password) {
            // Tell the frontend to ask for the 2FA password.
            // Mark awaitingPassword in both the global map and the DB.
            memEntry.awaitingPassword = true;
            await updateAwaitingPassword(userId, dbState);
            return NextResponse.json(
              {
                success: false,
                error: "Two-factor authentication password required",
                requires2FA: true,
              },
              { status: 400 },
            );
          }
          await complete2FA(client, password);
        } else {
          throw signInError;
        }
      }
    } else {
      // Second verify step: 2FA password
      if (!password) {
        return NextResponse.json(
          {
            success: false,
            error: "Two-factor authentication password required",
            requires2FA: true,
          },
          { status: 400 },
        );
      }
      await complete2FA(client, password);
    }

    // Auth complete — save session string directly to DB
    const sessionString = client.session.save() as unknown as string;
    const { encrypted, iv } = encrypt(sessionString);
    const last4 = getLast4(sessionString);

    await db.apiKey.upsert({
      where: { userId_provider: { userId, provider: "telegram_session" } },
      create: { userId, provider: "telegram_session", encryptedKey: encrypted, iv, last4, label: null },
      update: { encryptedKey: encrypted, iv, last4 },
    });

    await cleanupPending(userId);

    try {
      await client.disconnect();
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Verification failed";
    console.error("[Telegram/verify] Error:", message);

    await cleanupPending(userId);

    try {
      await client.disconnect();
    } catch {
      // ignore
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}

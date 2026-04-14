import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/api-key-resolver";
import { getUserChannels } from "@/lib/scraper/telegram";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sessionString = await resolveApiKey(session.user.id, "telegram_session");
  if (!sessionString) {
    return NextResponse.json({ error: "Telegram not connected" }, { status: 400 });
  }

  try {
    const channels = await getUserChannels(sessionString);
    return NextResponse.json({ channels });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

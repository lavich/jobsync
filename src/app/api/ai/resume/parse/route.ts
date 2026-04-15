import "server-only";

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import fs from "fs";
import path from "path";
import { getModel } from "@/lib/ai/providers";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { ResumeParseSchema } from "@/models/ai.schemas";
import { RESUME_PARSE_SYSTEM_PROMPT, buildResumeParsePrompt } from "@/lib/ai/prompts";
import { AiModel } from "@/models/ai.model";
import { getResumeById } from "@/actions/profile.actions";
async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === ".pdf") {
    // pdf-parse v1 — Node.js compatible, no browser API dependencies
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type. Only PDF and DOCX are supported.");
}

export const POST = async (req: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!session || !userId) {
    return NextResponse.json({ error: "Not Authenticated" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.` },
      { status: 429 },
    );
  }

  const { resumeId, selectedModel } = (await req.json()) as {
    resumeId: string;
    selectedModel: AiModel;
  };

  if (!resumeId || !selectedModel) {
    return NextResponse.json({ error: "resumeId and selectedModel are required" }, { status: 400 });
  }

  const { data: resume, success } = await getResumeById(resumeId);
  if (!success || !resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  if (!resume.File?.filePath) {
    return NextResponse.json({ error: "No file attached to this resume" }, { status: 400 });
  }

  const filePath = resume.File.filePath;
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  try {
    const rawText = await extractText(filePath);

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract readable text from the file" }, { status: 422 });
    }

    const model = await getModel(selectedModel.provider, selectedModel.model || "llama3.2", userId);

    const result = await generateText({
      model,
      output: Output.object({ schema: ResumeParseSchema }),
      system: RESUME_PARSE_SYSTEM_PROMPT,
      prompt: buildResumeParsePrompt(rawText),
      temperature: 0.1,
    });

    if (!result.output) {
      return NextResponse.json({ error: "AI failed to parse the resume" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.output });
  } catch (error) {
    console.error("Resume parse error:", error);
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

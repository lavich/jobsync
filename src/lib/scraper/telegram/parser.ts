import { generateText, Output } from "ai";
import { z } from "zod";
import type { LanguageModel } from "ai";
import type { JobDetails } from "../types";

const TelegramJobSchema = z.object({
  title: z
    .string()
    .describe("Job title or position. If not a job post, return 'Unknown'"),
  company: z
    .string()
    .describe("Company or employer name. Return empty string if not found"),
  location: z
    .string()
    .describe("Location or 'Remote'. Return empty string if not found"),
  salary: z
    .string()
    .optional()
    .describe("Salary range or amount if explicitly mentioned"),
});

const SYSTEM_PROMPT = `You are a job post parser. Extract structured data from Telegram channel posts.
Return values in the same language as the post.
If the post is not a job vacancy, return title "Unknown" and empty strings for other fields.`;

export async function enrichTelegramPostWithAI(
  job: JobDetails,
  model: LanguageModel,
): Promise<JobDetails> {
  try {
    const result = await generateText({
      model,
      output: Output.object({ schema: TelegramJobSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Extract job details from this Telegram post:\n\n${job.description}`,
    });

    const object = result.output;
    if (!object) return job;

    return {
      ...job,
      title: object.title || job.title,
      company: object.company || job.company,
      location: object.location || job.location,
      salary: object.salary ?? job.salary,
    };
  } catch {
    return job;
  }
}
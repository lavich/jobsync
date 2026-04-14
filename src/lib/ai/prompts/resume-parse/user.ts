export function buildResumeParsePrompt(resumeText: string): string {
  return `Extract structured data from the following resume text:\n\n${resumeText}`;
}

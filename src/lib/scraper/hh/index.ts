import type { JobDetails, ScraperResult } from "../types";

const HH_BASE_URL = "https://api.hh.ru";
const USER_AGENT = "JobSync/1.0 (jobsync-app)";

interface HHSalary {
  from: number | null;
  to: number | null;
  currency: string;
  gross: boolean;
}

interface HHVacancy {
  id: string;
  name: string;
  employer: { name: string };
  area: { name: string };
  salary: HHSalary | null;
  alternate_url: string;
  snippet: {
    requirement: string | null;
    responsibility: string | null;
  };
  published_at: string;
}

interface HHVacancyDetail extends HHVacancy {
  description: string;
  key_skills: Array<{ name: string }>;
}

interface HHSearchResponse {
  items: HHVacancy[];
  found: number;
}

interface HHAreaSuggest {
  items: Array<{ id: string; text: string }>;
}

async function resolveAreaId(location: string): Promise<string | undefined> {
  try {
    const url = new URL(`${HH_BASE_URL}/suggests/areas`);
    url.searchParams.set("text", location);

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) return undefined;

    const data: HHAreaSuggest = await response.json();
    return data.items?.[0]?.id;
  } catch {
    return undefined;
  }
}

async function fetchVacancyDetail(id: string): Promise<HHVacancyDetail | null> {
  try {
    const response = await fetch(`${HH_BASE_URL}/vacancies/${id}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return null;
    return (await response.json()) as HHVacancyDetail;
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li>/gi, "\n• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatSalary(salary: HHSalary | null): string | undefined {
  if (!salary) return undefined;
  const { from, to, currency } = salary;
  if (from && to) {
    return `${from.toLocaleString()} – ${to.toLocaleString()} ${currency}`;
  }
  if (from) return `from ${from.toLocaleString()} ${currency}`;
  if (to) return `up to ${to.toLocaleString()} ${currency}`;
  return undefined;
}

export async function searchHHJobs(
  keywords: string,
  location: string,
): Promise<ScraperResult<JobDetails[]>> {
  try {
    const areaId = await resolveAreaId(location);

    const url = new URL(`${HH_BASE_URL}/vacancies`);
    url.searchParams.set("text", keywords);
    url.searchParams.set("per_page", "20");
    url.searchParams.set("page", "0");
    url.searchParams.set("order_by", "publication_time");
    if (areaId) url.searchParams.set("area", areaId);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    url.searchParams.set("date_from", weekAgo.toISOString().split("T")[0]);

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: { type: "rate_limited", retryAfter: 60 } };
      }
      if (response.status === 403) {
        return {
          success: false,
          error: { type: "blocked", reason: "Access denied by hh.ru API" },
        };
      }
      return {
        success: false,
        error: {
          type: "network",
          message: `hh.ru API error: ${response.status} ${response.statusText}`,
        },
      };
    }

    const data: HHSearchResponse = await response.json();

    if (!data.items?.length) {
      return { success: true, data: [] };
    }

    const topVacancies = data.items.slice(0, 10);
    const details = await Promise.all(
      topVacancies.map((v) => fetchVacancyDetail(v.id)),
    );

    const jobs: JobDetails[] = topVacancies.map((vacancy, i) => {
      const detail = details[i];

      let description: string;
      if (detail?.description) {
        description = stripHtml(detail.description);
        if (detail.key_skills.length > 0) {
          description +=
            "\n\nKey skills: " +
            detail.key_skills.map((s) => s.name).join(", ");
        }
      } else {
        const parts: string[] = [];
        if (vacancy.snippet.requirement) {
          parts.push("Requirements: " + stripHtml(vacancy.snippet.requirement));
        }
        if (vacancy.snippet.responsibility) {
          parts.push(
            "Responsibilities: " + stripHtml(vacancy.snippet.responsibility),
          );
        }
        description = parts.join("\n\n") || "No description available";
      }

      return {
        title: vacancy.name,
        company: vacancy.employer.name,
        location: vacancy.area.name,
        description,
        url: vacancy.alternate_url,
        postedDate: vacancy.published_at,
        salary: formatSalary(vacancy.salary),
      };
    });

    return { success: true, data: jobs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { type: "network", message } };
  }
}

import { marked } from "marked";
import type { Project } from "@/content/projects/types";

export type CaseStudySection = {
  title: string;
  html: string;
  isRetrospective: boolean;
};

const RETROSPECTIVE_TITLE = "what i'd do differently";

/**
 * Splits a case study's markdown into `## ` sections and renders each with marked.
 * The retrospective section ("What I'd do differently") is flagged so the detail
 * page can give it its own tinted panel, per DESIGN.md.
 */
export function renderCaseStudy(caseStudy: string): CaseStudySection[] {
  const sections = caseStudy.split(/^## /m).filter((s) => s.trim().length > 0);

  return sections.map((section) => {
    const newlineIndex = section.indexOf("\n");
    const title = section.slice(0, newlineIndex).trim();
    const body = section.slice(newlineIndex + 1).trim();

    return {
      title,
      html: marked.parse(body, { async: false }) as string,
      isRetrospective: title.toLowerCase() === RETROSPECTIVE_TITLE,
    };
  });
}

export type { Project };

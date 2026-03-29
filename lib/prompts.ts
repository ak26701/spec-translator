export type ContributorRole = "dev" | "qa" | "financial" | "hr";

export const ROLE_LABELS: Record<ContributorRole, string> = {
  dev: "Developer",
  qa: "QA Engineer",
  financial: "Financial Analyst",
  hr: "HR / People Ops",
};

export const ROLE_DESCRIPTIONS: Record<ContributorRole, string> = {
  dev: "Technical implementation, APIs, architecture, code deliverables",
  qa: "Test planning, validation criteria, edge cases, quality gates",
  financial: "Budget, ROI, cost estimates, financial risk, billing milestones",
  hr: "Resourcing, team structure, skills required, timelines, compliance",
};

const BASE_SYSTEM_PROMPT = `You are a technical spec translator for a large contractor platform.
Your job is to take dense AI lab project briefs and rewrite them into clear, actionable instructions that contractors can follow without ambiguity.
Write in plain, direct language. No jargon unless necessary — if you must use technical terms, define them inline.
Always structure your output as clean Markdown.`;

const ROLE_SYSTEM_PROMPTS: Record<ContributorRole, string> = {
  dev: `${BASE_SYSTEM_PROMPT}
You are writing for software developers (junior to senior). Focus on:
- What to build, not why it exists strategically
- Exact technical requirements, APIs, data schemas
- Clear acceptance criteria and definition of done
- Dependencies and constraints to be aware of`,

  qa: `${BASE_SYSTEM_PROMPT}
You are writing for QA engineers. Focus on:
- What needs to be tested and how
- Edge cases, failure modes, and validation boundaries
- Clear pass/fail criteria for each deliverable
- Environment setup and tooling required for testing`,

  financial: `${BASE_SYSTEM_PROMPT}
You are writing for financial analysts. Focus on:
- Budget implications, cost centers, and billing milestones
- Resource costs (headcount, tools, infrastructure)
- Risk flags that could affect spend
- Measurable ROI or value metrics tied to project phases`,

  hr: `${BASE_SYSTEM_PROMPT}
You are writing for HR and People Ops professionals. Focus on:
- Headcount requirements and role profiles needed
- Timeline and ramp-up expectations
- Skills, certifications, or clearances required
- Compliance, IP agreements, or contractor classification concerns`,
};

const OUTPUT_TEMPLATE = (role: string) => `
Structure your response EXACTLY as follows (use these exact Markdown headers):

# Project Brief: [extract a short project name from the brief]

## Overview
2-3 sentences. What is this project and what outcome does it deliver? No technical depth here.

## Your Role as ${role}
1-2 sentences. Specifically what this role is responsible for on this project.

## Step-by-Step Instructions
Numbered steps. Each step must be:
- Actionable (starts with a verb)
- Specific (no vague language like "handle" or "manage")
- Self-contained (contractor can act on it without asking follow-up questions)

## Deliverables
Bullet list. Each deliverable must be concrete and verifiable.

## Acceptance Criteria
Bullet list. How do we know the work is done and done correctly?

## Key Contacts & Resources
If any systems, tools, teams, or references are mentioned in the brief, list them here. If none, write "To be provided by project lead."

## Deadline & Milestones
Extract any dates or phases. If none are explicit, write "To be confirmed — flag to project lead."
`;

export function buildTranslationPrompt(
  brief: string,
  role: ContributorRole
): { system: string; user: string } {
  return {
    system: ROLE_SYSTEM_PROMPTS[role],
    user: `Translate the following project brief into structured instructions for a ${ROLE_LABELS[role]}.

${OUTPUT_TEMPLATE(ROLE_LABELS[role])}

---
PROJECT BRIEF:
${brief}
---

Now produce the structured output.`,
  };
}

export type ContributorRole =
  | "swe"
  | "qa"
  | "pm"
  | "finance"
  | "hr"
  | "legal"
  | "data"
  | "devops"
  | "marketing"
  | "project_mgmt"
  | "bizdev";

export type SeniorityLevel =
  | "junior"
  | "associate"
  | "senior_associate"
  | "senior"
  | "principal"
  | "partner";

export interface RoleSelection {
  role: ContributorRole;
  seniority: SeniorityLevel;
}

export const ROLE_LABELS: Record<ContributorRole, string> = {
  swe: "Software Engineer",
  qa: "QA Engineer",
  pm: "Product Manager",
  finance: "Finance",
  hr: "HR / People Ops",
  legal: "Legal",
  data: "Data Scientist",
  devops: "DevOps / Platform",
  marketing: "Marketing",
  project_mgmt: "Project Manager",
  bizdev: "Business Development",
};

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  junior: "Junior",
  associate: "Associate",
  senior_associate: "Senior Associate",
  senior: "Senior",
  principal: "Principal / Lead",
  partner: "Partner / Director",
};

export const ALL_ROLES: ContributorRole[] = [
  "swe", "qa", "pm", "finance", "hr", "legal",
  "data", "devops", "marketing", "project_mgmt", "bizdev",
];

export const ALL_SENIORITY_LEVELS: SeniorityLevel[] = [
  "junior", "associate", "senior_associate", "senior", "principal", "partner",
];

// Maps role → what that function owns on a project
const ROLE_FOCUS: Record<ContributorRole, string> = {
  swe: "Technical implementation: code, APIs, architecture, data schemas, acceptance criteria",
  qa: "Quality: test planning, edge cases, validation criteria, pass/fail gates",
  pm: "Product scope: feature requirements, prioritization, stakeholder alignment, success metrics",
  finance: "Budget: cost estimates, billing milestones, ROI, resource spend, risk flags",
  hr: "People: headcount, role profiles, timelines, compliance, contractor classification",
  legal: "Legal: contracts, IP, liability, compliance requirements, review checkpoints",
  data: "Data: pipelines, model requirements, metrics definitions, evaluation criteria",
  devops: "Infrastructure: deployment, environments, CI/CD, reliability, monitoring",
  marketing: "GTM: messaging, audience, launch timing, campaign requirements, assets needed",
  project_mgmt: "Execution: milestones, dependencies, blockers, status reporting, resource coordination",
  bizdev: "Partnerships: deal structure, stakeholder mapping, commercial terms, opportunity sizing",
};

// Maps seniority → how detailed and what lens to use
const SENIORITY_CONTEXT: Record<SeniorityLevel, string> = {
  junior:
    "This person is early in their career. Define all terms inline. Break every task into the smallest possible steps. Assume they will ask for help if something is unclear — leave nothing ambiguous. Avoid assumed context.",
  associate:
    "This person has basic domain knowledge. Standard step-by-step detail. Explain non-obvious requirements but don't over-explain fundamentals.",
  senior_associate:
    "This person works independently. Focus on nuance, edge cases, and decision points. Skip basics. Flag areas where judgment calls will be needed.",
  senior:
    "This person is highly experienced. High-level guidance only. Trust their judgment on execution. Focus on constraints, priorities, and what success looks like.",
  principal:
    "This person leads work and others. Frame instructions in terms of trade-offs, strategic decisions, and team coordination. Include what they should delegate vs. own.",
  partner:
    "This person operates at a business/executive level. Lead with impact, risk, and resource implications. Minimal operational detail — they will direct others to execute.",
};

const BASE_SYSTEM_PROMPT = `You are a spec translator for a large contractor platform.
Your job is to take dense AI lab project briefs and rewrite them into clear, actionable instructions that a specific contributor can follow without ambiguity.
Write in plain, direct language. No jargon unless necessary — define terms inline if you use them.
Always structure your output as clean Markdown.`;

export function buildTranslationPrompt(
  brief: string,
  role: ContributorRole,
  seniority: SeniorityLevel
): { system: string; user: string } {
  const roleLabel = ROLE_LABELS[role];
  const seniorityLabel = SENIORITY_LABELS[seniority];

  const system = `${BASE_SYSTEM_PROMPT}

You are writing for a ${seniorityLabel} ${roleLabel}.

Their function on this project:
${ROLE_FOCUS[role]}

How to calibrate your instructions for this seniority level:
${SENIORITY_CONTEXT[seniority]}`;

  const user = `Translate the following project brief into structured instructions for a ${seniorityLabel} ${roleLabel}.

Structure your response EXACTLY as follows (use these exact Markdown headers):

# [Extract a short project name from the brief]

## Overview
2-3 sentences. What is this project and what outcome does it deliver? No technical depth.

## Your Role as ${seniorityLabel} ${roleLabel}
1-2 sentences. What this specific role is responsible for. Calibrated to their seniority.

## Step-by-Step Instructions
Numbered steps. Each step must:
- Start with an action verb
- Be specific — no vague language like "handle" or "manage"
- Be self-contained — the contractor should not need to ask follow-ups
- Match the depth appropriate for a ${seniorityLabel}

## Deliverables
Bullet list. Each deliverable must be concrete and verifiable.

## Acceptance Criteria
Bullet list. How do we know the work is done and done correctly?

## Key Contacts & Resources
List any systems, tools, teams, or references mentioned. If none, write "To be provided by project lead."

## Deadline & Milestones
Extract any dates or phases. If none are explicit, write "To be confirmed — flag to project lead."

---
PROJECT BRIEF:
${brief}
---

Now produce the structured output.`;

  return { system, user };
}

export function buildDetectionPrompt(brief: string): { system: string; user: string } {
  const roleList = ALL_ROLES.map((r) => `"${r}" = ${ROLE_LABELS[r]}`).join("\n");

  return {
    system: `You are an expert at analyzing project briefs and identifying which professional functions need to be involved.
Return only valid JSON. No markdown, no explanation.`,
    user: `Analyze this project brief and identify which contributor roles need instructions generated for them.

Available roles:
${roleList}

Return a JSON object with a single "roles" array containing only the role keys that are clearly relevant to this project.
Include a role only if there is meaningful work for that function. Typically 2-4 roles per brief.

Example output: {"roles": ["swe", "qa", "finance"]}

PROJECT BRIEF:
${brief}`,
  };
}

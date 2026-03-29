export function buildEvaluationPrompt(
  spec: string,
  workProduct: string,
  workFileName: string
): { system: string; user: string } {
  const system = `You are an expert evaluator for a contractor management platform.
You evaluate work submitted by domain experts (lawyers, engineers, doctors, analysts, etc.) against a provided spec or rubric.
Your evaluations are used by operations staff to decide whether to accept, request revisions, or reject submissions.
Be direct, specific, and evidence-based. Reference exact parts of the spec and work product.
Always structure your output as clean Markdown.`;

  const user = `Evaluate the submitted work product against the provided spec.

Structure your response EXACTLY as follows:

# Evaluation: [extract the project or task name from the spec]

## Contributor Domain
Identify the domain/discipline of this work (e.g., Software Engineering, Contract Law, Financial Analysis, Medical Research). Infer from both the spec and the work product.

## Submission Summary
2-3 sentences. What did the contributor submit and what does it contain? Reference the filename: ${workFileName}.

## Spec Requirements
Extract the key requirements, criteria, or deliverables from the spec as a bullet list. Be specific.

## Criteria Assessment
For each requirement above, assess the submission:
- **[Requirement]** — Met / Partially Met / Not Met: [one sentence explanation with evidence]

## Issues & Gaps
Bullet list of specific problems, missing elements, or quality concerns. If none, write "None identified."

## Recommendation
**Pass** / **Needs Revision** / **Reject**

One paragraph justifying the recommendation with direct references to the spec and submission.

---
SPEC / RUBRIC:
${spec}

---
WORK PRODUCT (${workFileName}):
${workProduct}

---
Now produce the evaluation.`;

  return { system, user };
}

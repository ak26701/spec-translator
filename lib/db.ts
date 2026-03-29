import { sql } from "@vercel/postgres";

export async function setupSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS evaluations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      spec_filename TEXT NOT NULL DEFAULT 'spec.pdf',
      work_filename TEXT NOT NULL,
      spec_text TEXT NOT NULL,
      work_text TEXT NOT NULL,
      ai_output TEXT NOT NULL,
      domain TEXT,
      ai_recommendation TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      human_recommendation TEXT NOT NULL,
      ai_was_correct BOOLEAN NOT NULL,
      notes TEXT
    )
  `;
}

export type Evaluation = {
  id: string;
  created_at: string;
  spec_filename: string;
  work_filename: string;
  spec_text: string;
  work_text: string;
  ai_output: string;
  domain: string | null;
  ai_recommendation: string | null;
  reviewed: boolean;
  human_recommendation?: string | null;
  ai_was_correct?: boolean | null;
};

export type Review = {
  id: string;
  evaluation_id: string;
  created_at: string;
  human_recommendation: string;
  ai_was_correct: boolean;
  notes: string | null;
};

// Extract domain and recommendation from AI output
export function parseAIOutput(output: string): { domain: string | null; recommendation: string | null } {
  const domainMatch = output.match(/## Contributor Domain\s*\n([^\n#]+)/);
  const domain = domainMatch ? domainMatch[1].trim() : null;

  let recommendation: string | null = null;
  if (/\*\*Pass\*\*/.test(output)) recommendation = "Pass";
  else if (/\*\*Needs Revision\*\*/.test(output)) recommendation = "Needs Revision";
  else if (/\*\*Reject\*\*/.test(output)) recommendation = "Reject";

  return { domain, recommendation };
}

export async function saveEvaluation(data: {
  specFilename: string;
  workFilename: string;
  specText: string;
  workText: string;
  aiOutput: string;
}) {
  const { domain, recommendation } = parseAIOutput(data.aiOutput);
  const result = await sql`
    INSERT INTO evaluations (spec_filename, work_filename, spec_text, work_text, ai_output, domain, ai_recommendation)
    VALUES (${data.specFilename}, ${data.workFilename}, ${data.specText}, ${data.workText}, ${data.aiOutput}, ${domain}, ${recommendation})
    RETURNING id
  `;
  return result.rows[0].id as string;
}

export async function listEvaluations(): Promise<Evaluation[]> {
  const result = await sql`
    SELECT
      e.id, e.created_at, e.spec_filename, e.work_filename,
      e.domain, e.ai_recommendation,
      r.id IS NOT NULL AS reviewed,
      r.human_recommendation, r.ai_was_correct
    FROM evaluations e
    LEFT JOIN reviews r ON r.evaluation_id = e.id
    ORDER BY e.created_at DESC
    LIMIT 100
  `;
  return result.rows as Evaluation[];
}

export async function getEvaluation(id: string): Promise<Evaluation | null> {
  const result = await sql`
    SELECT
      e.*,
      r.id IS NOT NULL AS reviewed,
      r.human_recommendation, r.ai_was_correct, r.notes
    FROM evaluations e
    LEFT JOIN reviews r ON r.evaluation_id = e.id
    WHERE e.id = ${id}
  `;
  return (result.rows[0] as Evaluation) ?? null;
}

export async function saveReview(data: {
  evaluationId: string;
  humanRecommendation: string;
  aiWasCorrect: boolean;
  notes: string;
}) {
  await sql`
    INSERT INTO reviews (evaluation_id, human_recommendation, ai_was_correct, notes)
    VALUES (${data.evaluationId}, ${data.humanRecommendation}, ${data.aiWasCorrect}, ${data.notes})
    ON CONFLICT DO NOTHING
  `;
}

export async function getDashboardStats() {
  const totals = await sql`
    SELECT
      COUNT(*) AS total,
      COUNT(r.id) AS reviewed,
      ROUND(100.0 * COUNT(r.id) FILTER (WHERE r.ai_was_correct) / NULLIF(COUNT(r.id), 0), 1) AS accuracy
    FROM evaluations e
    LEFT JOIN reviews r ON r.evaluation_id = e.id
  `;

  const byDomain = await sql`
    SELECT
      COALESCE(e.domain, 'Unknown') AS domain,
      COUNT(*) AS total,
      COUNT(r.id) AS reviewed,
      ROUND(100.0 * COUNT(r.id) FILTER (WHERE r.ai_was_correct) / NULLIF(COUNT(r.id), 0), 1) AS accuracy
    FROM evaluations e
    LEFT JOIN reviews r ON r.evaluation_id = e.id
    GROUP BY e.domain
    ORDER BY total DESC
    LIMIT 10
  `;

  const byVerdict = await sql`
    SELECT
      human_recommendation AS verdict,
      COUNT(*) AS count
    FROM reviews
    GROUP BY human_recommendation
    ORDER BY count DESC
  `;

  return {
    totals: totals.rows[0],
    byDomain: byDomain.rows,
    byVerdict: byVerdict.rows,
  };
}

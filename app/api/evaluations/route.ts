import { saveEvaluation, listEvaluations, setupSchema } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await setupSchema();
    const body = await req.json();
    const id = await saveEvaluation(body);
    return Response.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Save evaluation error:", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await setupSchema();
    const rows = await listEvaluations();
    return Response.json({ evaluations: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

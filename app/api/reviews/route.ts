import { saveReview, setupSchema } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await setupSchema();
    const body = await req.json();
    await saveReview(body);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Save review error:", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

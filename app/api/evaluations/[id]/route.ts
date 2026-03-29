import { getEvaluation } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/api/evaluations/[id]">) {
  try {
    const { id } = await ctx.params;
    const evaluation = await getEvaluation(id);
    if (!evaluation) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ evaluation });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

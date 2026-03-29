import Anthropic from "@anthropic-ai/sdk";
import { buildDetectionPrompt, ALL_ROLES, ContributorRole } from "@/lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables." },
      { status: 500 }
    );
  }

  try {
    const { brief } = await req.json();
    if (!brief) return Response.json({ error: "brief is required" }, { status: 400 });

    const { system, user } = buildDetectionPrompt(brief);

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";

    let roles: ContributorRole[] = [];
    try {
      const parsed = JSON.parse(text);
      roles = (parsed.roles as string[]).filter((r): r is ContributorRole =>
        ALL_ROLES.includes(r as ContributorRole)
      );
    } catch {
      // Fall back to a sensible default if parsing fails
      roles = ["swe", "pm"];
    }

    return Response.json({ roles });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Detection error:", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

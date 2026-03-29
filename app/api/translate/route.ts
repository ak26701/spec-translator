import Anthropic from "@anthropic-ai/sdk";
import { buildTranslationPrompt, ContributorRole, SeniorityLevel } from "@/lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables." },
      { status: 500 }
    );
  }

  try {
    const { brief, role, seniority } = await req.json();

    if (!brief || !role || !seniority) {
      return Response.json({ error: "brief, role, and seniority are required" }, { status: 400 });
    }

    const { system, user } = buildTranslationPrompt(
      brief,
      role as ContributorRole,
      seniority as SeniorityLevel
    );

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return Response.json({ result: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Translation error:", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

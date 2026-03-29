import Anthropic from "@anthropic-ai/sdk";
import { buildTranslationPrompt, ContributorRole } from "@/lib/prompts";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { brief, role } = await req.json();

    if (!brief || !role) {
      return Response.json({ error: "brief and role are required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { system, user } = buildTranslationPrompt(brief, role as ContributorRole);

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    return Response.json({ result: text });
  } catch (err) {
    console.error("Translation error:", err);
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }
}

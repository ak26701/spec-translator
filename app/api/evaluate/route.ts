import Anthropic from "@anthropic-ai/sdk";
import { buildEvaluationPrompt } from "@/lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it in Vercel → Project Settings → Environment Variables." },
      { status: 500 }
    );
  }

  try {
    const { spec, workProduct, workFileName } = await req.json();

    if (!spec || !workProduct || !workFileName) {
      return Response.json(
        { error: "spec, workProduct, and workFileName are required" },
        { status: 400 }
      );
    }

    const { system, user } = buildEvaluationPrompt(spec, workProduct, workFileName);

    const stream = await client.messages.stream({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Evaluation error:", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

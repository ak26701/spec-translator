export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "pdf") {
      // Import the inner lib directly — pdf-parse's index.js reads a test file
      // on load which throws in Next.js server environments.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse");
      const data = await pdfParse(buffer);
      return Response.json({ text: data.text });
    }

    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return Response.json({ text: result.value });
    }

    return Response.json({ error: "Unsupported file type" }, { status: 400 });
  } catch (err) {
    console.error("Parse error:", err);
    return Response.json({ error: "Failed to parse file" }, { status: 500 });
  }
}

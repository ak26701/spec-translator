// Text-based file extensions that can be read directly
const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown",
  // Code
  "cpp", "c", "h", "hpp", "cc",
  "py", "pyw",
  "js", "jsx", "ts", "tsx", "mjs", "cjs",
  "java", "kt", "scala",
  "go", "rs", "rb", "php", "cs", "swift",
  "r", "m", "pl", "sh", "bash", "zsh",
  "sql",
  // Data / config
  "json", "yaml", "yml", "xml", "csv", "toml", "ini", "env",
  "html", "htm", "css", "scss", "sass",
]);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    // Plain text / code files — read directly
    if (TEXT_EXTENSIONS.has(ext)) {
      const text = await file.text();
      return Response.json({ text });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (ext === "pdf") {
      // Use lib subpath to avoid pdf-parse index.js reading a test file on load
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

    return Response.json(
      { error: `Unsupported file type: .${ext}` },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Parse error:", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

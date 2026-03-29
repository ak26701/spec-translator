export async function parseUploadedFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md") {
    return await file.text();
  }

  if (ext === "pdf") {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/parse", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Failed to parse PDF");
    const data = await res.json();
    return data.text;
  }

  if (ext === "docx") {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/parse", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Failed to parse DOCX");
    const data = await res.json();
    return data.text;
  }

  throw new Error(`Unsupported file type: .${ext}. Upload a PDF, DOCX, TXT, or MD file.`);
}

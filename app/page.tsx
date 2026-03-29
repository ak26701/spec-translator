"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface UploadedFile {
  name: string;
  text: string;
}

type AppState = "idle" | "loading" | "streaming" | "done" | "error";

async function parseFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const TEXT_EXTS = new Set([
    "txt","md","markdown","cpp","c","h","hpp","cc","py","pyw","js","jsx","ts","tsx",
    "mjs","cjs","java","kt","scala","go","rs","rb","php","cs","swift","r","m","pl",
    "sh","bash","zsh","sql","json","yaml","yml","xml","csv","toml","ini","env",
    "html","htm","css","scss","sass",
  ]);

  if (TEXT_EXTS.has(ext)) return await file.text();

  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/parse", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Failed to parse ${file.name}`);
  return data.text;
}

function UploadZone({
  label,
  accept,
  hint,
  uploaded,
  onUpload,
  disabled,
}: {
  label: string;
  accept: string;
  hint: string;
  uploaded: UploadedFile | null;
  onUpload: (f: UploadedFile) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const handle = async (file: File) => {
    setErr(null);
    setParsing(true);
    try {
      const text = await parseFile(file);
      onUpload({ name: file.name, text });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors
          ${dragging ? "border-blue-500 bg-blue-50" : uploaded ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}
          ${disabled || parsing ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="flex flex-col items-center gap-1 text-center px-3">
          {parsing ? (
            <svg className="animate-spin w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : uploaded ? (
            <>
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              <span className="text-xs font-medium text-green-700 truncate max-w-full">{uploaded.name}</span>
              <span className="text-xs text-gray-400">{uploaded.text.length.toLocaleString()} chars</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
              </svg>
              <span className="text-xs text-gray-500">Drop or <span className="text-blue-500">browse</span></span>
              <span className="text-xs text-gray-400">{hint}</span>
            </>
          )}
        </div>
        <input type="file" className="hidden" accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} disabled={disabled || parsing}/>
      </label>
      {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
    </div>
  );
}

export default function Home() {
  const [spec, setSpec] = useState<UploadedFile | null>(null);
  const [work, setWork] = useState<UploadedFile | null>(null);
  const [result, setResult] = useState("");
  const [state, setState] = useState<AppState>("idle");
  const [error, setError] = useState<string | null>(null);

  const canEvaluate = !!spec && !!work && state !== "loading" && state !== "streaming";

  const handleEvaluate = async () => {
    if (!spec || !work) return;
    setState("loading");
    setError(null);
    setResult("");

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: spec.text, workProduct: work.text, workFileName: work.name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Evaluation failed");
      }

      setState("streaming");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setResult(accumulated);
      }

      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Evaluation failed");
    }
  };

  const handleExportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Evaluation</title>
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#111;line-height:1.6}
        h1{font-size:22px;border-bottom:2px solid #2563eb;padding-bottom:8px;color:#1e40af}
        h2{font-size:16px;margin-top:24px;color:#1e3a5f}
        table{width:100%;border-collapse:collapse;margin:12px 0}
        th,td{text-align:left;padding:8px 12px;border:1px solid #e5e7eb;font-size:13px}
        th{background:#f3f4f6;font-weight:600}
        ul,ol{padding-left:20px}li{margin-bottom:6px}
        @media print{body{padding:20px}}
      </style>
      </head><body id="content"></body></html>`);
    w.document.close();
    // Render markdown via innerHTML via the already-rendered DOM
    const src = document.getElementById("eval-output");
    if (src) w.document.getElementById("content")!.innerHTML = src.innerHTML;
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  const handleCopySlack = async () => {
    const slack = result
      .replace(/^# (.+)$/gm, "*$1*")
      .replace(/^## (.+)$/gm, "\n*$1*")
      .replace(/^### (.+)$/gm, "*$1*")
      .replace(/\*\*(.+?)\*\*/g, "*$1*");
    await navigator.clipboard.writeText(slack);
    alert("Copied in Slack format.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-bold text-gray-900">Spec Evaluator</h1>
          </div>
          <p className="text-gray-500 text-sm ml-9">
            Upload a spec and a contributor's work product. Get a structured evaluation instantly.
          </p>
        </div>

        {/* Upload card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-5">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
            <h2 className="font-semibold text-gray-800">Upload Documents</h2>
          </div>
          <div className="flex gap-4">
            <UploadZone
              label="Spec / Rubric"
              accept=".pdf"
              hint="PDF only"
              uploaded={spec}
              onUpload={setSpec}
              disabled={state === "loading" || state === "streaming"}
            />
            <UploadZone
              label="Work Product"
              accept=".pdf,.docx,.txt,.md,.cpp,.c,.h,.py,.js,.ts,.jsx,.tsx,.java,.go,.rs,.rb,.cs,.swift,.sql,.json,.yaml,.csv,.xlsx,.r,.m,.php,.html,.css"
              hint="PDF, DOCX, code, data files"
              uploaded={work}
              onUpload={setWork}
              disabled={state === "loading" || state === "streaming"}
            />
          </div>
        </div>

        {/* Evaluate */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
            <h2 className="font-semibold text-gray-800">Evaluate</h2>
          </div>
          <button
            onClick={handleEvaluate}
            disabled={!canEvaluate}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
              ${canEvaluate ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            {state === "loading" || state === "streaming" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Evaluating...
              </span>
            ) : "Evaluate Submission"}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}
        </div>

        {/* Output */}
        {(state === "streaming" || state === "done") && result && (
          <div className="flex flex-col gap-4">
            {state === "done" && (
              <div className="flex gap-3">
                <button onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Export PDF
                </button>
                <button onClick={handleCopySlack}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                  </svg>
                  Copy for Slack
                </button>
              </div>
            )}
            <div
              id="eval-output"
              className="bg-white border border-gray-200 rounded-xl p-6 prose prose-sm max-w-none
                prose-headings:text-gray-900 prose-h1:text-xl prose-h1:border-b prose-h1:border-blue-200 prose-h1:pb-2
                prose-h2:text-base prose-h2:text-blue-800 prose-li:text-gray-700 prose-p:text-gray-700
                prose-table:text-sm prose-th:bg-gray-50"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

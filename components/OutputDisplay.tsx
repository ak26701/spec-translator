"use client";

import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface OutputDisplayProps {
  results: Record<string, string>;  // key = "role:seniority"
  labels: Record<string, string>;   // key = "role:seniority" → display label
  activeKey: string;
  onKeyChange: (key: string) => void;
}

export default function OutputDisplay({ results, labels, activeKey, onKeyChange }: OutputDisplayProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const keys = Object.keys(results);
  const content = results[activeKey] ?? "";

  const handleExportPDF = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${labels[activeKey] ?? "Instructions"}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111; line-height: 1.6; }
            h1 { font-size: 22px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; color: #1e40af; }
            h2 { font-size: 16px; margin-top: 24px; color: #1e3a5f; }
            ol, ul { padding-left: 20px; }
            li { margin-bottom: 6px; }
            p { margin: 8px 0; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const handleCopySlack = async () => {
    const slackText = content
      .replace(/^# (.+)$/gm, "*$1*")
      .replace(/^## (.+)$/gm, "\n*$1*")
      .replace(/^### (.+)$/gm, "*$1*");
    await navigator.clipboard.writeText(slackText);
    alert("Copied to clipboard in Slack format.");
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Tabs */}
      {keys.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => onKeyChange(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${activeKey === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {labels[key]}
            </button>
          ))}
        </div>
      )}

      {/* Export buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
        <button
          onClick={handleCopySlack}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
          </svg>
          Copy for Slack
        </button>
      </div>

      {/* Markdown output */}
      <div
        ref={printRef}
        className="bg-white border border-gray-200 rounded-xl p-6 prose prose-sm max-w-none
          prose-headings:text-gray-900 prose-h1:text-xl prose-h1:border-b prose-h1:border-blue-200 prose-h1:pb-2
          prose-h2:text-base prose-h2:text-blue-800
          prose-li:text-gray-700 prose-p:text-gray-700"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

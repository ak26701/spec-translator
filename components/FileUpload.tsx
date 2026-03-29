"use client";

import { useCallback, useState } from "react";

interface FileUploadProps {
  onFileContent: (text: string, fileName: string) => void;
  isLoading: boolean;
}

export default function FileUpload({ onFileContent, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      const ext = file.name.split(".").pop()?.toLowerCase();
      const allowed = ["pdf", "docx", "txt", "md"];

      if (!ext || !allowed.includes(ext)) {
        setError("Unsupported file type. Upload a PDF, DOCX, TXT, or MD file.");
        return;
      }

      setFileName(file.name);

      try {
        if (ext === "txt" || ext === "md") {
          const text = await file.text();
          onFileContent(text, file.name);
        } else {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/parse", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Parse failed");
          const data = await res.json();
          onFileContent(data.text, file.name);
        }
      } catch {
        setError("Failed to read file. Try again.");
      }
    },
    [onFileContent]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full">
      <label
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"}
          ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {fileName ? (
            <span className="text-sm font-medium text-blue-600">{fileName}</span>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-600">
                Drop your brief here or <span className="text-blue-600">browse</span>
              </span>
              <span className="text-xs text-gray-400">PDF, DOCX, TXT, MD</span>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleInput}
          disabled={isLoading}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import RoleSelector from "@/components/RoleSelector";
import OutputDisplay from "@/components/OutputDisplay";
import { ContributorRole } from "@/lib/prompts";

type TranslationState = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [briefText, setBriefText] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<ContributorRole[]>(["dev"]);
  const [results, setResults] = useState<Partial<Record<ContributorRole, string>>>({});
  const [activeRole, setActiveRole] = useState<ContributorRole>("dev");
  const [state, setState] = useState<TranslationState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const handleFileContent = (text: string, name: string) => {
    setBriefText(text);
    setFileName(name);
    setResults({});
    setState("idle");
  };

  const handleTranslate = async () => {
    if (!briefText || selectedRoles.length === 0) return;

    setState("loading");
    setError(null);
    setResults({});

    const newResults: Partial<Record<ContributorRole, string>> = {};

    for (let i = 0; i < selectedRoles.length; i++) {
      const role = selectedRoles[i];
      setProgress(`Generating ${role} instructions (${i + 1}/${selectedRoles.length})...`);

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: briefText, role }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Translation failed");
        }

        const data = await res.json();
        newResults[role] = data.result;
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Unknown error");
        return;
      }
    }

    setResults(newResults);
    setActiveRole(selectedRoles[0]);
    setState("done");
  };

  const canTranslate = briefText.length > 0 && selectedRoles.length > 0 && state !== "loading";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-bold text-gray-900">Spec Translator</h1>
          </div>
          <p className="text-gray-500 text-sm ml-9">
            Drop in a dense AI lab brief. Get clean, role-specific contributor instructions out.
          </p>
        </div>

        {/* Step 1 – Upload */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
            <h2 className="font-semibold text-gray-800">Upload Project Brief</h2>
          </div>
          <FileUpload onFileContent={handleFileContent} isLoading={state === "loading"} />
          {briefText && (
            <p className="mt-3 text-xs text-gray-400">
              {fileName} — {briefText.length.toLocaleString()} characters extracted
            </p>
          )}
        </div>

        {/* Step 2 – Select Roles */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
            <h2 className="font-semibold text-gray-800">Select Contributor Roles</h2>
          </div>
          <RoleSelector
            selected={selectedRoles}
            onChange={setSelectedRoles}
            disabled={state === "loading"}
          />
        </div>

        {/* Step 3 – Translate */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
            <h2 className="font-semibold text-gray-800">Generate Instructions</h2>
          </div>

          <button
            onClick={handleTranslate}
            disabled={!canTranslate}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
              ${canTranslate
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
          >
            {state === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {progress}
              </span>
            ) : (
              `Translate Brief → ${selectedRoles.length} role${selectedRoles.length !== 1 ? "s" : ""}`
            )}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Output */}
        {state === "done" && Object.keys(results).length > 0 && (
          <div className="mt-2">
            <OutputDisplay
              results={results as Record<ContributorRole, string>}
              activeRole={activeRole}
              onRoleChange={setActiveRole}
            />
          </div>
        )}
      </div>
    </div>
  );
}

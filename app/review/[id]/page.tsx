"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { Evaluation } from "@/lib/db";

const VERDICTS = ["Pass", "Needs Revision", "Reject"] as const;
const VERDICT_COLORS: Record<string, string> = {
  "Pass": "border-green-400 bg-green-50 text-green-700",
  "Needs Revision": "border-yellow-400 bg-yellow-50 text-yellow-700",
  "Reject": "border-red-400 bg-red-50 text-red-700",
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [verdict, setVerdict] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/evaluations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setEvaluation(d.evaluation);
        if (d.evaluation?.reviewed) {
          setVerdict(d.evaluation.human_recommendation ?? "");
          setSubmitted(true);
        } else if (d.evaluation?.ai_recommendation) {
          setVerdict(d.evaluation.ai_recommendation);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!verdict || !evaluation) return;
    setSubmitting(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evaluationId: id,
        humanRecommendation: verdict,
        aiWasCorrect: verdict === evaluation.ai_recommendation,
        notes,
      }),
    });
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => router.push("/review"), 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Evaluation not found. <Link href="/review" className="text-blue-500 hover:underline">Back to queue</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/review" className="text-sm text-gray-400 hover:text-gray-600">← Queue</Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{evaluation.work_filename}</h1>
            <p className="text-xs text-gray-400">{evaluation.domain ?? "Unknown domain"} · {new Date(evaluation.created_at).toLocaleString()}</p>
          </div>
          {evaluation.ai_recommendation && (
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${VERDICT_COLORS[evaluation.ai_recommendation] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
              AI: {evaluation.ai_recommendation}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI evaluation output */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl p-6 prose prose-sm max-w-none
              prose-h1:text-xl prose-h1:border-b prose-h1:border-blue-200 prose-h1:pb-2
              prose-h2:text-base prose-h2:text-blue-800 prose-li:text-gray-700 prose-p:text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{evaluation.ai_output}</ReactMarkdown>
            </div>
          </div>

          {/* Review form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-6">
              <h2 className="font-semibold text-gray-800 mb-4">Your Review</h2>

              {submitted ? (
                <div className="text-center py-4">
                  <div className="text-green-500 text-2xl mb-2">✓</div>
                  <p className="text-sm font-medium text-gray-700">Review saved</p>
                  <p className="text-xs text-gray-400 mt-1">Returning to queue...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Your verdict</p>
                    <div className="flex flex-col gap-2">
                      {VERDICTS.map((v) => (
                        <button
                          key={v}
                          onClick={() => setVerdict(v)}
                          className={`text-sm px-3 py-2 rounded-lg border-2 text-left font-medium transition-colors
                            ${verdict === v ? VERDICT_COLORS[v] : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                        >
                          {v}
                          {v === evaluation.ai_recommendation && (
                            <span className="ml-1 text-xs font-normal opacity-60">(AI)</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Notes <span className="font-normal">(optional)</span></p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="What did the AI get wrong or miss?"
                      rows={4}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-300"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={!verdict || submitting}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                      ${verdict && !submitting ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                  >
                    {submitting ? "Saving..." : "Submit Review"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

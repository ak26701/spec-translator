import Link from "next/link";
import { listEvaluations, setupSchema } from "@/lib/db";

const VERDICT_COLORS: Record<string, string> = {
  "Pass": "bg-green-100 text-green-700",
  "Needs Revision": "bg-yellow-100 text-yellow-700",
  "Reject": "bg-red-100 text-red-700",
};

export default async function ReviewQueue() {
  try {
    await setupSchema();
    const evaluations = await listEvaluations();
    const unreviewed = evaluations.filter((e) => !e.reviewed);
    const reviewed = evaluations.filter((e) => e.reviewed);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Review Queue</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {unreviewed.length} pending · {reviewed.length} reviewed
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">Dashboard →</Link>
              <Link href="/" className="text-sm text-gray-500 hover:underline">← New evaluation</Link>
            </div>
          </div>

          {unreviewed.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pending Review</h2>
              <div className="flex flex-col gap-2">
                {unreviewed.map((e) => (
                  <Link key={e.id} href={`/review/${e.id}`}
                    className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{e.work_filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{e.domain ?? "Unknown domain"} · {new Date(e.created_at).toLocaleDateString()}</p>
                    </div>
                    {e.ai_recommendation && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${VERDICT_COLORS[e.ai_recommendation] ?? "bg-gray-100 text-gray-600"}`}>
                        AI: {e.ai_recommendation}
                      </span>
                    )}
                    <span className="text-xs text-orange-500 font-medium">Needs review</span>
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {reviewed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Reviewed</h2>
              <div className="flex flex-col gap-2">
                {reviewed.map((e) => (
                  <Link key={e.id} href={`/review/${e.id}`}
                    className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-all opacity-70">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{e.work_filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{e.domain ?? "Unknown domain"} · {new Date(e.created_at).toLocaleDateString()}</p>
                    </div>
                    {e.ai_recommendation && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${VERDICT_COLORS[e.ai_recommendation] ?? "bg-gray-100 text-gray-600"}`}>
                        AI: {e.ai_recommendation}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${e.ai_was_correct ? "text-green-600" : "text-red-500"}`}>
                      {e.ai_was_correct ? "✓ Correct" : "✗ Wrong"}
                    </span>
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {evaluations.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">No evaluations yet.</p>
              <Link href="/" className="text-blue-500 text-sm hover:underline mt-2 inline-block">Run your first evaluation →</Link>
            </div>
          )}
        </div>
      </div>
    );
  } catch {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Database not connected.</p>
          <p className="text-sm text-gray-400 mt-1">Add a Vercel Postgres database in your project settings.</p>
          <Link href="/" className="text-blue-500 text-sm hover:underline mt-3 inline-block">← Back</Link>
        </div>
      </div>
    );
  }
}

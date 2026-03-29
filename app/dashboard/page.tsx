import Link from "next/link";
import { getDashboardStats, setupSchema } from "@/lib/db";

export default async function Dashboard() {
  try {
    await setupSchema();
    const { totals, byDomain, byVerdict } = await getDashboardStats();

    const total = Number(totals.total);
    const reviewed = Number(totals.reviewed);
    const accuracy = totals.accuracy ? `${totals.accuracy}%` : "—";
    const reviewRate = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex gap-4">
              <Link href="/review" className="text-sm text-blue-600 hover:underline">Review queue →</Link>
              <Link href="/" className="text-sm text-gray-400 hover:underline">← Evaluator</Link>
            </div>
          </div>

          {/* Top stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Evaluations", value: total.toLocaleString() },
              { label: "Reviewed", value: `${reviewed.toLocaleString()} (${reviewRate}%)` },
              { label: "AI Accuracy", value: accuracy, sub: "when reviewed" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By domain */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Accuracy by Domain</h2>
              {byDomain.length === 0 ? (
                <p className="text-sm text-gray-400">No reviewed evaluations yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {byDomain.map((row: Record<string, unknown>) => {
                    const pct = row.reviewed ? Number(row.accuracy) : null;
                    return (
                      <div key={String(row.domain)}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{String(row.domain)}</span>
                          <span className="text-xs text-gray-400">
                            {pct !== null ? `${pct}%` : "—"} · {String(row.total)} evals
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: pct !== null ? `${pct}%` : "0%" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Human verdicts */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Human Verdicts</h2>
              {byVerdict.length === 0 ? (
                <p className="text-sm text-gray-400">No reviews submitted yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {byVerdict.map((row: Record<string, unknown>) => {
                    const colors: Record<string, string> = {
                      "Pass": "bg-green-400",
                      "Needs Revision": "bg-yellow-400",
                      "Reject": "bg-red-400",
                    };
                    const totalReviewed = byVerdict.reduce((s: number, r: Record<string, unknown>) => s + Number(r.count), 0);
                    const pct = Math.round((Number(row.count) / totalReviewed) * 100);
                    return (
                      <div key={String(row.verdict)}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{String(row.verdict)}</span>
                          <span className="text-xs text-gray-400">{String(row.count)} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors[String(row.verdict)] ?? "bg-gray-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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

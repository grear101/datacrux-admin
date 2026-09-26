"use client";

import { useEffect, useState } from "react";
import { getAnalyticsSummary, AnalyticsSummary, ApiError } from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

function formatNaira(value: number) {
  return "₦" + value.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

const PERIODS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="font-mono text-xl font-medium text-ice-50">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function RevenueChart({ byDay }: { byDay: AnalyticsSummary["revenue"]["byDay"] }) {
  if (byDay.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-navy-700 rounded-xl">
        <p className="text-slate-400 text-sm">No revenue in this period yet.</p>
      </div>
    );
  }

  const max = Math.max(...byDay.map((d) => d.revenue), 1);

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-4">
      <div className="flex items-end gap-1.5 h-40">
        {byDay.map((d) => {
          const heightPct = Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 0);
          return (
            <div
              key={d.date}
              className="group relative flex-1 flex flex-col items-center justify-end h-full"
              title={`${formatShortDate(d.date)}: ${formatNaira(d.revenue)} (${d.orderCount} order${d.orderCount === 1 ? "" : "s"})`}
            >
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${heightPct}%`,
                  background: "var(--color-blue-500, #2F6FED)",
                  opacity: d.revenue > 0 ? 1 : 0.15,
                  minHeight: d.revenue > 0 ? "2px" : "1px",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-slate-500">
        <span>{formatShortDate(byDay[0].date)}</span>
        {byDay.length > 1 && <span>{formatShortDate(byDay[byDay.length - 1].date)}</span>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSummary(null);
    setError(null);
    getAnalyticsSummary(days)
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load analytics."));
  }, [days]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Analytics</h1>
      <p className="text-slate-400 text-sm mt-1 mb-6">How your store is doing, at a glance.</p>

      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              days === p.days
                ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                : "text-slate-400 border-navy-700 hover:text-ice-50 hover:bg-navy-800"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {summary === null && !error && <NodeLoader label="Loading analytics…" />}

      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Revenue" value={formatNaira(summary.revenue.total)} />
            <StatCard label="Orders" value={String(summary.orders.total)} />
            <StatCard label="Conversations" value={String(summary.conversations.total)} />
            <StatCard
              label="Conversion rate"
              value={`${summary.conversionRate}%`}
              sub="conversations → orders"
            />
            <StatCard
              label="Negotiation approval"
              value={`${summary.negotiation.approvalRate}%`}
              sub={`${summary.negotiation.totalAttempts} attempt${summary.negotiation.totalAttempts === 1 ? "" : "s"}`}
            />
            <StatCard
              label="Avg. discount given"
              value={`${summary.negotiation.avgDiscountPercent}%`}
              sub="when a discount was given"
            />
            <StatCard
              label="Handover rate"
              value={`${summary.handovers.handoverRate}%`}
              sub={`${summary.handovers.total} request${summary.handovers.total === 1 ? "" : "s"}`}
            />
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Revenue by day</p>
            <RevenueChart byDay={summary.revenue.byDay} />
          </div>
        </div>
      )}
    </div>
  );
}

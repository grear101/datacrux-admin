"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlatformOverview, PlatformOverview, ApiError } from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

function formatNaira(value: number) {
  return "₦" + value.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

const PERIODS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm p-4">
      <p className="text-xs text-ink-400 mb-1">{label}</p>
      <p className="font-mono text-xl font-medium text-ink-900">{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function PlatformOverviewPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    getPlatformOverview(days)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load the overview."));
  }, [days]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">Overview</h1>
      <p className="text-ink-500 text-sm mt-1 mb-6">The whole platform, at a glance.</p>

      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              days === p.days
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "text-ink-500 border-card-border hover:text-ink-900 hover:bg-surface-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {data === null && !error && <NodeLoader label="Loading overview…" />}

      {data && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-ink-500 mb-2">Businesses</p>
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Active" value={String(data.businesses.active)} />
              <StatCard label="Trial" value={String(data.businesses.trial)} />
              <StatCard label="Trial expired" value={String(data.businesses.trialExpired)} />
              <StatCard label="Suspended" value={String(data.businesses.suspended)} />
            </div>
          </div>

          <div>
            <p className="text-sm text-ink-500 mb-2">Platform totals</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                label="Revenue"
                value={formatNaira(data.revenue.total)}
                sub={
                  data.revenue.percentChange != null
                    ? `${data.revenue.percentChange >= 0 ? "+" : ""}${data.revenue.percentChange}% vs previous period`
                    : "No prior period to compare"
                }
              />
              <StatCard label="Orders" value={String(data.orders.total)} />
              <StatCard label="Conversations" value={String(data.conversations.total)} />
              <StatCard label="Unique customers" value={String(data.uniqueCustomers)} sub="across all businesses" />
              <StatCard label="AI tokens used" value={data.tokensUsed.toLocaleString()} />
              <StatCard label="Conversion rate" value={`${data.conversionRate}%`} sub="conversations → orders" />
              <StatCard label="Negotiation approval" value={`${data.negotiation.approvalRate}%`} />
              <StatCard label="Avg. discount given" value={`${data.negotiation.avgDiscountPercent}%`} />
              <StatCard label="Handover rate" value={`${data.handovers.handoverRate}%`} />
            </div>
          </div>

          {(data.highlights.businessesNearLimit.length > 0 || data.highlights.trialsEndingSoon.length > 0) && (
            <div>
              <p className="text-sm text-ink-500 mb-2">Highlights</p>
              <div className="space-y-2">
                {data.highlights.businessesNearLimit.map((b) => (
                  <Link
                    key={`limit-${b.id}`}
                    href={`/platform/clients/${b.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 hover:bg-amber-100/60 transition"
                  >
                    <span className="text-sm text-amber-700">
                      <strong>{b.name}</strong> is at {Math.round((b.usedThisMonth / b.limit) * 100)}% of its monthly limit
                    </span>
                    <span className="text-xs font-mono text-amber-700/80 whitespace-nowrap">
                      {b.usedThisMonth} / {b.limit}
                    </span>
                  </Link>
                ))}
                {data.highlights.trialsEndingSoon.map((t) => (
                  <Link
                    key={`trial-${t.id}`}
                    href={`/platform/clients/${t.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 hover:bg-blue-100/60 transition"
                  >
                    <span className="text-sm text-blue-700">
                      <strong>{t.name}</strong>&apos;s trial ends in {t.daysLeft} day{t.daysLeft === 1 ? "" : "s"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

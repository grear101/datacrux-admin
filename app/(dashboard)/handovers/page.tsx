"use client";

import { useEffect, useState } from "react";
import { getHandovers, HandoverRequest, ApiError } from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "text-ambaer-700 border-amber-200 bg-amber-50",
  contacted: "text-blue-700 border-blue-200 bg-blue-50",
  resolved: "text-green-700 border-green-200 bg-green-50",
};

export default function HandoversPage() {
  const [handovers, setHandovers] = useState<HandoverRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHandovers()
      .then(setHandovers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load handover requests."));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">Handovers</h1>
      <p className="text-ink-500 text-sm mt-1 mb-8">
        Every time a customer asked to speak to a real person, most recent first.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {handovers === null && !error && <NodeLoader label="Loading handovers…" />}

      {handovers?.length === 0 && (
        <div className="text-center py-16 border border-dashed border-card-border rounded-xl">
          <p className="text-ink-500 text-sm">
            No handover requests yet. If a customer ever asks for a real person, it&apos;ll show up here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {handovers?.map((handover) => {
          const statusStyle = STATUS_STYLES[handover.status] || "text-ink-500 border-card-border bg-surface-50";

          return (
            <div key={handover.id} className="rounded-xl border border-card-border bg-card shadow-sm p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="diamond-bullet" />
                    <p className="font-medium text-ink-900">{handover.customerName || "Unknown customer"}</p>
                    <span
                      className={`text-[11px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${statusStyle}`}
                    >
                      {handover.status}
                    </span>
                  </div>
                  {handover.customerPhone && (
                    <p className="text-ink-500 text-sm font-mono mt-1">{handover.customerPhone}</p>
                  )}
                </div>
                <p className="text-ink-400 text-xs shrink-0">{formatDate(handover.createdAt)}</p>
              </div>

              <p className="text-sm text-ink-500">{handover.summary}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

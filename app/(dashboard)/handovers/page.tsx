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
  pending: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  contacted: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  resolved: "text-green-500 border-green-500/30 bg-green-500/10",
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
      <h1 className="font-display text-2xl font-semibold">Handovers</h1>
      <p className="text-slate-400 text-sm mt-1 mb-8">
        Every time a customer asked to speak to a real person, most recent first.
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {handovers === null && !error && <NodeLoader label="Loading handovers…" />}

      {handovers?.length === 0 && (
        <div className="text-center py-16 border border-dashed border-navy-700 rounded-xl">
          <p className="text-slate-400 text-sm">
            No handover requests yet. If a customer ever asks for a real person, it&apos;ll show up here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {handovers?.map((handover) => {
          const statusStyle = STATUS_STYLES[handover.status] || "text-slate-400 border-navy-700 bg-navy-700/30";

          return (
            <div key={handover.id} className="rounded-xl border border-navy-700 bg-navy-800 p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="diamond-bullet" />
                    <p className="font-medium">{handover.customerName || "Unknown customer"}</p>
                    <span
                      className={`text-[11px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${statusStyle}`}
                    >
                      {handover.status}
                    </span>
                  </div>
                  {handover.customerPhone && (
                    <p className="text-slate-400 text-sm font-mono mt-1">{handover.customerPhone}</p>
                  )}
                </div>
                <p className="text-slate-500 text-xs shrink-0">{formatDate(handover.createdAt)}</p>
              </div>

              <p className="text-sm text-slate-300">{handover.summary}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

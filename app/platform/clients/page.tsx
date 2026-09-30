"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPlatformClients, PlatformClientSummary, ApiError } from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

const STATUS_STYLES: Record<string, string> = {
  active: "text-green-500 border-green-500/30 bg-green-500/10",
  trial: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  trial_expired: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  suspended: "text-red-500 border-red-500/30 bg-red-500/10",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trial: "Trial",
  trial_expired: "Trial expired",
  suspended: "Suspended",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<PlatformClientSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPlatformClients()
      .then(setClients)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load clients."));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Clients</h1>
      <p className="text-slate-400 text-sm mt-1 mb-6">Every business on the platform.</p>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {clients === null && !error && <NodeLoader label="Loading clients…" />}

      <div className="space-y-3">
        {clients?.map((client) => {
          const statusStyle = STATUS_STYLES[client.status] || "text-slate-400 border-navy-700 bg-navy-700/30";
          return (
            <Link
              key={client.id}
              href={`/platform/clients/${client.id}`}
              className="block rounded-xl border border-navy-700 bg-navy-800 p-4 hover:border-blue-500/40 transition"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="diamond-bullet" />
                  <p className="font-medium">{client.name}</p>
                  <span className={`text-[11px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${statusStyle}`}>
                    {STATUS_LABELS[client.status] || client.status}
                  </span>
                  {client.plan && (
                    <span className="text-[11px] uppercase tracking-wide text-slate-500 border border-navy-700 rounded px-1.5 py-0.5">
                      {client.plan}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs shrink-0">
                  {new Date(client.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              <p className="text-sm text-slate-400 font-mono">
                {client.conversationsThisMonth} / {client.conversationLimit ?? "∞"} conversations this month
              </p>

              {client.ownerEmails.length > 0 && (
                <p className="text-sm text-slate-500 mt-1">{client.ownerEmails.join(", ")}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPlatformClients, PlatformClientSummary, ApiError } from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

const STATUS_STYLES: Record<string, string> = {
  active: "text-green-700 border-green-200 bg-green-50",
  trial: "text-blue-700 border-blue-200 bg-blue-50",
  trial_expired: "text-amber-700 border-amber-200 bg-amber-50",
  suspended: "text-red-700 border-red-200 bg-red-50",
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
      <h1 className="font-display text-2xl font-semibold text-ink-900">Clients</h1>
      <p className="text-ink-500 text-sm mt-1 mb-6">Every business on the platform.</p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {clients === null && !error && <NodeLoader label="Loading clients…" />}

      <div className="space-y-3">
        {clients?.map((client) => {
          const statusStyle = STATUS_STYLES[client.status] || "text-ink-500 border-card-border bg-surface-50";
          return (
            <Link
              key={client.id}
              href={`/platform/clients/${client.id}`}
              className="block rounded-xl border border-card-border bg-card shadow-sm p-4 hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="diamond-bullet" />
                  <p className="font-medium text-ink-900">{client.name}</p>
                  <span className={`text-[11px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${statusStyle}`}>
                    {STATUS_LABELS[client.status] || client.status}
                  </span>
                  {client.plan && (
                    <span className="text-[11px] uppercase tracking-wide text-ink-400 border border-card-border rounded px-1.5 py-0.5">
                      {client.plan}
                    </span>
                  )}
                </div>
                <p className="text-ink-400 text-xs shrink-0">
                  {new Date(client.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              <p className="text-sm text-ink-500 font-mono">
                {client.conversationsThisMonth} / {client.conversationLimit ?? "∞"} conversations this month
              </p>

              {client.ownerEmails.length > 0 && (
                <p className="text-sm text-ink-400 mt-1">{client.ownerEmails.join(", ")}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

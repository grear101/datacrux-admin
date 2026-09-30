"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getPlatformClientDetail,
  updatePlatformClient,
  resetAdminPassword,
  PlatformClientDetail,
  ApiError,
} from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

const inputClass =
  "w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-ice-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition";
const labelClass = "block text-sm text-slate-400 mb-1.5";

const STATUS_STYLES: Record<string, string> = {
  active: "text-green-500 border-green-500/30 bg-green-500/10",
  trial: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  trial_expired: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  suspended: "text-red-500 border-red-500/30 bg-red-500/10",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-5 mb-6">
      <h2 className="font-display text-sm font-semibold text-slate-300 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [client, setClient] = useState<PlatformClientDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable fields, populated once the client loads.
  const [plan, setPlan] = useState("standard");
  const [unlimited, setUnlimited] = useState(false);
  const [conversationLimit, setConversationLimit] = useState("");
  const [subscription, setSubscription] = useState("trial");
  const [setupFeePaid, setSetupFeePaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [extendDays, setExtendDays] = useState("7");
  const [extending, setExtending] = useState(false);

  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  function loadClient() {
    getPlatformClientDetail(id)
      .then((data) => {
        setClient(data);
        setPlan(data.plan || "standard");
        setUnlimited(data.conversationLimit == null);
        setConversationLimit(data.conversationLimit != null ? String(data.conversationLimit) : "");
        setSubscription(data.subscription);
        setSetupFeePaid(data.setupFeePaid);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Couldn't load this business."));
  }

  useEffect(() => {
    loadClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      await updatePlatformClient(id, {
        plan,
        subscription: subscription as "trial" | "active" | "suspended",
        setupFeePaid,
        ...(unlimited ? { unlimited: true } : { conversationLimit: Number(conversationLimit) || 0 }),
      });
      setSaveMessage("Saved.");
      loadClient();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExtendTrial() {
    setExtending(true);
    try {
      await updatePlatformClient(id, { extendTrialDays: Number(extendDays) || 7 });
      loadClient();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't extend the trial.");
    } finally {
      setExtending(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTargetId) return;
    setResetSaving(true);
    setResetMessage(null);
    try {
      await resetAdminPassword(resetTargetId, newPassword);
      setResetMessage("Password updated.");
      setNewPassword("");
      setResetTargetId(null);
    } catch (err) {
      setResetMessage(err instanceof ApiError ? err.message : "Couldn't reset the password.");
    } finally {
      setResetSaving(false);
    }
  }

  if (loadError) {
    return <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{loadError}</p>;
  }
  if (!client) {
    return <NodeLoader label="Loading business…" />;
  }

  const statusStyle = STATUS_STYLES[client.status] || "text-slate-400 border-navy-700 bg-navy-700/30";

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="font-display text-2xl font-semibold">{client.name}</h1>
        <span className={`text-[11px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${statusStyle}`}>
          {client.status.replace("_", " ")}
        </span>
      </div>
      <p className="text-slate-400 text-sm mb-6">
        Created {new Date(client.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
        {client.whatsappNumber && ` · WhatsApp: ${client.whatsappNumber}`}
      </p>

      <Section title="Usage">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">This month</p>
            <p className="font-mono text-lg">{client.conversationsThisMonth} / {client.conversationLimit ?? "∞"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">All-time conversations</p>
            <p className="font-mono text-lg">{client.conversationsAllTime}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">All-time AI tokens</p>
            <p className="font-mono text-lg">{client.tokensAllTime.toLocaleString()}</p>
          </div>
        </div>
        {client.trialEndsAt && (
          <div className="mt-4 pt-4 border-t border-navy-700 flex items-center gap-3">
            <p className="text-sm text-slate-400">
              Trial ends {new Date(client.trialEndsAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <input
              type="number"
              min={1}
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              className="w-20 rounded-lg bg-navy-900 border border-navy-700 px-2 py-1 text-sm text-ice-50"
            />
            <button
              onClick={handleExtendTrial}
              disabled={extending}
              className="text-sm rounded-lg border border-navy-700 hover:bg-navy-900 px-3 py-1 transition disabled:opacity-60"
            >
              {extending ? "Extending…" : "+ Extend trial (days)"}
            </button>
          </div>
        )}
      </Section>

      <Section title="Plan &amp; status">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="plan">Plan</label>
              <select id="plan" value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="subscription">Status</label>
              <select id="subscription" value={subscription} onChange={(e) => setSubscription(e.target.value)} className={inputClass}>
                <option value="trial">Trial</option>
                <option value="active">Active (paid)</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="conversationLimit">Conversations / month</label>
            <div className="flex items-center gap-3">
              <input
                id="conversationLimit"
                type="number"
                min={0}
                disabled={unlimited}
                value={conversationLimit}
                onChange={(e) => setConversationLimit(e.target.value)}
                className={`${inputClass} disabled:opacity-50`}
              />
              <label className="flex items-center gap-2 text-sm text-slate-400 whitespace-nowrap">
                <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
                Unlimited
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={setupFeePaid} onChange={(e) => setSetupFeePaid(e.target.checked)} />
            One-time setup fee has been paid
          </label>

          {subscription === "suspended" && (
            <p className="text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Suspending blocks this business's chat widget immediately, even mid-conversation. Their admin login still works.
            </p>
          )}

          {saveError && <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>}
          {saveMessage && <p className="text-sm text-green-500">{saveMessage}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-medium px-5 py-2.5 transition"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </Section>

      <Section title="Admin logins">
        <div className="space-y-3">
          {client.admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between gap-4 rounded-lg border border-navy-700 px-3 py-2.5">
              <div>
                <p className="text-sm">{admin.email}</p>
                <p className="text-xs text-slate-500">
                  {admin.role}
                  {admin.lastLoginAt && ` · last login ${new Date(admin.lastLoginAt).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => { setResetTargetId(admin.id); setResetMessage(null); }}
                className="text-sm text-blue-400 hover:text-blue-300 transition"
              >
                Reset password
              </button>
            </div>
          ))}
        </div>

        {resetTargetId && (
          <form onSubmit={handleResetPassword} className="mt-4 pt-4 border-t border-navy-700 flex items-center gap-3">
            <input
              type="text"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min. 8 characters)"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={resetSaving}
              className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-medium px-4 py-2.5 transition whitespace-nowrap"
            >
              {resetSaving ? "Saving…" : "Set password"}
            </button>
            <button
              type="button"
              onClick={() => setResetTargetId(null)}
              className="text-sm text-slate-400 hover:text-ice-50 transition"
            >
              Cancel
            </button>
          </form>
        )}
        {resetMessage && <p className="text-sm text-green-500 mt-3">{resetMessage}</p>}
      </Section>
    </div>
  );
}

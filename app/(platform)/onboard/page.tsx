"use client";

import { useState } from "react";
import Link from "next/link";
import { onboardClient, ApiError } from "@/lib/api";

const inputClass =
  "w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-ice-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition";
const labelClass = "block text-sm text-slate-400 mb-1.5";

type Result = {
  clientId: string;
  businessName: string;
  apiKey: string;
  ownerEmail: string;
  plan: string;
  subscription: string;
  trialEndsAt: string | null;
};

export default function OnboardPage() {
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [plan, setPlan] = useState("standard");
  const [conversationLimit, setConversationLimit] = useState(""); // blank = unlimited
  const [subscription, setSubscription] = useState<"trial" | "active">("trial");
  const [trialDays, setTrialDays] = useState("7");
  const [setupFeePaid, setSetupFeePaid] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function resetForm() {
    setBusinessName("");
    setOwnerEmail("");
    setOwnerPassword("");
    setWhatsappNumber("");
    setPlan("standard");
    setConversationLimit("");
    setSubscription("trial");
    setTrialDays("7");
    setSetupFeePaid(false);
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const created = await onboardClient({
        businessName,
        ownerEmail,
        ownerPassword,
        whatsappNumber: whatsappNumber || undefined,
        plan,
        conversationLimit: conversationLimit ? Number(conversationLimit) : undefined,
        subscription,
        trialDays: subscription === "trial" ? Number(trialDays) || 7 : undefined,
        setupFeePaid,
      });
      setResult(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold mb-6">Business created</h1>
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 mb-6">
          <p className="font-medium mb-1">{result.businessName}</p>
          <p className="text-sm text-slate-400 mb-4">
            Owner login: {result.ownerEmail} · Plan: {result.plan} · Status: {result.subscription}
            {result.trialEndsAt && ` (trial ends ${new Date(result.trialEndsAt).toLocaleDateString()})`}
          </p>
          <p className="text-xs text-slate-500 mb-1">API key (for the widget - the business can also find this on their own Add to Website page):</p>
          <p className="font-mono text-sm bg-navy-900 rounded-lg px-3 py-2 break-all">{result.apiKey}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetForm}
            className="rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-medium px-4 py-2.5 transition"
          >
            Onboard another
          </button>
          <Link
            href="/platform/clients"
            className="rounded-lg border border-navy-700 hover:bg-navy-800 text-ice-50 font-medium px-4 py-2.5 transition"
          >
            View all clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Onboard a Business</h1>
      <p className="text-slate-400 text-sm mt-1 mb-6">
        Creates their AMARA account, owner login, and API key in one step.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass} htmlFor="businessName">Business name</label>
          <input id="businessName" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} placeholder="e.g. Kunle's Kitchen" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="ownerEmail">Owner email</label>
            <input id="ownerEmail" type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className={inputClass} placeholder="owner@business.com" />
          </div>
          <div>
            <label className={labelClass} htmlFor="ownerPassword">Owner password</label>
            <input id="ownerPassword" type="text" required minLength={8} value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} className={inputClass} placeholder="At least 8 characters" />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="whatsappNumber">WhatsApp number (optional)</label>
          <input id="whatsappNumber" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className={inputClass} placeholder="e.g. 2348012345678" />
        </div>

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
            <label className={labelClass} htmlFor="conversationLimit">Conversations / month</label>
            <input
              id="conversationLimit"
              type="number"
              min={0}
              value={conversationLimit}
              onChange={(e) => setConversationLimit(e.target.value)}
              className={inputClass}
              placeholder="Leave blank for unlimited"
            />
          </div>
        </div>

        <div className="rounded-xl border border-navy-700 bg-navy-800 p-4 space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="subscription" checked={subscription === "trial"} onChange={() => setSubscription("trial")} />
              Trial
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="subscription" checked={subscription === "active"} onChange={() => setSubscription("active")} />
              Paid (active now)
            </label>
          </div>

          {subscription === "trial" ? (
            <div>
              <label className={labelClass} htmlFor="trialDays">Trial length (days)</label>
              <input id="trialDays" type="number" min={1} value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className={inputClass} />
            </div>
          ) : (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={setupFeePaid} onChange={(e) => setSetupFeePaid(e.target.checked)} />
              One-time setup fee has been paid
            </label>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-medium px-5 py-2.5 transition"
        >
          {loading ? "Creating…" : "Create business"}
        </button>
      </form>
    </div>
  );
}

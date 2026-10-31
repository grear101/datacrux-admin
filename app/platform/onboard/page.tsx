"use client";

import { useState } from "react";
import Link from "next/link";
import { onboardClient, ApiError } from "@/lib/api";

const inputClass =
  "w-full rounded-lg bg-surface-50 border border-card-border px-4 py-2.5 text-ink-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition";
const labelClass = "block text-sm text-ink-500 mb-1.5";

const DEFAULT_PRODUCT_LIMIT_HINT: Record<string, string> = {
  standard: "defaults to 20 if left blank",
  premium: "defaults to 50 if left blank",
  enterprise: "defaults to unlimited if left blank",
};

type Result = {
  clientId: string;
  businessName: string;
  apiKey: string;
  ownerEmail: string;
  plan: string;
  subscription: string;
  trialEndsAt: string | null;
  productLimit: number | null;
};

export default function OnboardPage() {
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [plan, setPlan] = useState("standard");
  const [conversationLimit, setConversationLimit] = useState("");
  const [productLimit, setProductLimit] = useState("");
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
    setProductLimit("");
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
        productLimit: productLimit ? Number(productLimit) : undefined,
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
        <h1 className="font-display text-2xl font-semibold text-ink-900 mb-6">Business created</h1>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 mb-6">
          <p className="font-medium text-ink-900 mb-1">{result.businessName}</p>
          <p className="text-sm text-ink-500 mb-4">
            Owner login: {result.ownerEmail} · Plan: {result.plan} · Status: {result.subscription}
            {result.trialEndsAt && ` (trial ends ${new Date(result.trialEndsAt).toLocaleDateString()})`}
            {" · "}Product limit: {result.productLimit ?? "Unlimited"}
          </p>
          <p className="text-xs text-ink-400 mb-1">API key (for the widget - the business can also find this on their own Add to Website page):</p>
          <p className="font-mono text-sm bg-card border border-card-border rounded-lg px-3 py-2 break-all text-ink-900">{result.apiKey}</p>
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
            className="rounded-lg border border-card-border hover:bg-surface-50 text-ink-900 font-medium px-4 py-2.5 transition"
          >
            View all clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">Onboard a Business</h1>
      <p className="text-ink-500 text-sm mt-1 mb-6">
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

        <div>
          <label className={labelClass} htmlFor="plan">Plan</label>
          <select id="plan" value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className={labelClass} htmlFor="productLimit">Product limit</label>
            <input
              id="productLimit"
              type="number"
              min={0}
              value={productLimit}
              onChange={(e) => setProductLimit(e.target.value)}
              className={inputClass}
              placeholder={DEFAULT_PRODUCT_LIMIT_HINT[plan]}
            />
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card shadow-sm p-4 space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-900">
              <input type="radio" name="subscription" checked={subscription === "trial"} onChange={() => setSubscription("trial")} />
              Trial
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-900">
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
            <label className="flex items-center gap-2 text-sm text-ink-900">
              <input type="checkbox" checked={setupFeePaid} onChange={(e) => setSetupFeePaid(e.target.checked)} />
              One-time setup fee has been paid
            </label>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
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

"use client";

import { useEffect, useState } from "react";
import {
  getApiKey,
  regenerateApiKey,
  getProducts,
  Product,
  getWhatsappNumber,
  updateWhatsappNumber,
  ApiError,
} from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

export default function EmbedPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [origin, setOrigin] = useState("");

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading window.location is client-only, must happen post-mount
    setOrigin(window.location.origin);
    getApiKey()
      .then((r) => setApiKey(r.apiKey))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your API key."));
    getProducts()
      .then(setProducts)
      .catch(() => {
        /* non-critical for this page - the snippet still works without a product picked */
      });
    getWhatsappNumber()
      .then((r) => setWhatsappNumber(r.whatsappNumber || ""))
      .catch(() => {
        /* non-critical - field just starts empty */
      });
  }, []);

  async function handleRegenerate() {
    if (
      !confirm(
        "This will immediately stop any chat widget already live on your website from working, until you update it with the new key. Continue?",
      )
    ) {
      return;
    }
    setRegenerating(true);
    setError(null);
    try {
      const r = await regenerateApiKey();
      setApiKey(r.apiKey);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't regenerate your API key.");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSaveWhatsapp(e: React.FormEvent) {
    e.preventDefault();
    setWhatsappSaving(true);
    setError(null);
    setWhatsappSaved(false);
    try {
      const r = await updateWhatsappNumber(whatsappNumber);
      setWhatsappNumber(r.whatsappNumber || "");
      setWhatsappSaved(true);
      setTimeout(() => setWhatsappSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your WhatsApp number.");
    } finally {
      setWhatsappSaving(false);
    }
  }

  const snippet = apiKey
    ? `<script src="${origin}/widget.js"
        data-api-key="${apiKey}"
        data-api-url="${process.env.NEXT_PUBLIC_API_URL}"${
          selectedProductId ? `\n        data-product-id="${selectedProductId}"` : ""
        }
        defer></script>`
    : "";

  // A plain link, not a code snippet - the only thing social platforms,
  // bios, and ad "destination URL" fields will actually accept. Opens
  // AMARA directly, already knowing the product if one's selected above.
  const adLink = apiKey
    ? `${origin}/chat?key=${apiKey}${selectedProductId ? `&product=${selectedProductId}` : ""}`
    : "";

  function handleCopy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(adLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  if (apiKey === null && !error) return <NodeLoader label="Loading your integration…" />;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">Add AMARA to your website</h1>
      <p className="text-ink-500 text-sm mt-1 mb-8">
        Paste one snippet into your site and a chat bubble appears - no coding required beyond that.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSaveWhatsapp}
        className="rounded-xl border border-card-border bg-card shadow-sm p-4 mb-8"
      >
        <p className="text-sm font-medium text-ink-900 mb-1.5">Your WhatsApp number</p>
        <p className="text-xs text-ink-400 mb-3">
          When a customer confirms an order, AMARA sends them a button that opens WhatsApp with the
          order details already filled in, addressed to this number. Include your country code (e.g.
          2348012345678).
        </p>
        <div className="flex items-center gap-3">
          <input
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="2348012345678"
            className="flex-1 rounded-lg bg-surface-50 border border-card-border px-4 py-2.5 text-sm font-mono text-ink-900 outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={whatsappSaving}
            className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 transition shrink-0"
          >
            {whatsappSaving ? "Saving…" : "Save"}
          </button>
        </div>
        {whatsappSaved && <p className="text-sm text-green-600 mt-2">Saved</p>}
      </form>

      {apiKey && (
        <>
          {products.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm text-ink-500 mb-1.5">
                Link this widget to one product? <span className="text-ink-400">(optional)</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-lg bg-surface-50 border border-card-border px-4 py-2.5 text-sm text-ink-900 outline-none focus:border-blue-400"
              >
                <option value="">No specific product - AMARA asks the customer</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ink-400 mt-1.5">
                Applies to both the website snippet below and the social/ad link further down - so
                AMARA already knows what the visitor is interested in, however they arrive.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-card-border bg-card shadow-sm p-4 mb-3">
            <pre className="text-xs font-mono text-blue-700 whitespace-pre-wrap break-all">{snippet}</pre>
          </div>

          <div className="flex items-center gap-3 mb-10">
            <button
              onClick={handleCopy}
              className="rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-4 py-2 transition"
            >
              {copied ? "Copied!" : "Copy snippet"}
            </button>
            <p className="text-xs text-ink-400">Paste this just before the closing &lt;/body&gt; tag.</p>
          </div>

          <div className="rounded-xl border border-card-border bg-card shadow-sm p-4 mb-10">
            <p className="text-sm font-medium text-ink-900 mb-1.5">Social media &amp; ad link</p>
            <p className="text-xs text-ink-400 mb-3">
              Instagram bios, Facebook ad destination URLs, WhatsApp catalogs, TikTok bios, and similar
              only accept a plain link, never a code snippet - this is that link. It opens AMARA directly,
              already knowing the product above (if you picked one), with nothing else on the page.
            </p>
            <p className="font-mono text-xs break-all text-ink-700 bg-surface-50 border border-card-border rounded-lg px-3 py-2 mb-3">
              {adLink}
            </p>
            <button
              onClick={handleCopyLink}
              className="rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-4 py-2 transition"
            >
              {linkCopied ? "Copied!" : "Copy link"}
            </button>
          </div>

          <div className="rounded-xl border border-card-border bg-card shadow-sm p-4">
            <p className="text-sm font-medium text-ink-900 mb-1.5">Your API key</p>
            <p className="font-mono text-sm text-ink-500 mb-3 break-all">{apiKey}</p>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-sm text-red-600/80 hover:text-red-600 disabled:opacity-50 transition"
            >
              {regenerating ? "Regenerating…" : "Regenerate key"}
            </button>
            <p className="text-xs text-ink-400 mt-2">
              Only do this if your key has been exposed somewhere public - it will break your live widget
              and ad link above until you update both with the new key.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

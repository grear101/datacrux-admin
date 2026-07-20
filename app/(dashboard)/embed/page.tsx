"use client";

import { useEffect, useState } from "react";
import { getApiKey, regenerateApiKey, getProducts, Product, ApiError } from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

export default function EmbedPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [origin, setOrigin] = useState("");

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

  const snippet = apiKey
    ? `<script src="${origin}/widget.js"
        data-api-key="${apiKey}"
        data-api-url="${process.env.NEXT_PUBLIC_API_URL}"${
          selectedProductId ? `\n        data-product-id="${selectedProductId}"` : ""
        }
        defer></script>`
    : "";

  function handleCopy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (apiKey === null && !error) return <NodeLoader label="Loading your integration…" />;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Add AMARA to your website</h1>
      <p className="text-slate-400 text-sm mt-1 mb-8">
        Paste one snippet into your site and a chat bubble appears - no coding required beyond that.
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {apiKey && (
        <>
          {products.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-1.5">
                Link this widget to one product? <span className="text-slate-500">(optional)</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="">No specific product - AMARA asks the customer</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1.5">
                Use this on a product-specific landing page or ad link, so AMARA already knows what the
                visitor is interested in.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-navy-700 bg-navy-800 p-4 mb-3">
            <pre className="text-xs font-mono text-blue-300 whitespace-pre-wrap break-all">{snippet}</pre>
          </div>

          <div className="flex items-center gap-3 mb-10">
            <button
              onClick={handleCopy}
              className="rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-4 py-2 transition"
            >
              {copied ? "Copied!" : "Copy snippet"}
            </button>
            <p className="text-xs text-slate-500">Paste this just before the closing &lt;/body&gt; tag.</p>
          </div>

          <div className="rounded-xl border border-navy-700 bg-navy-800 p-4">
            <p className="text-sm font-medium mb-1.5">Your API key</p>
            <p className="font-mono text-sm text-slate-400 mb-3 break-all">{apiKey}</p>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-sm text-red-500/80 hover:text-red-500 disabled:opacity-50 transition"
            >
              {regenerating ? "Regenerating…" : "Regenerate key"}
            </button>
            <p className="text-xs text-slate-500 mt-2">
              Only do this if your key has been exposed somewhere public - it will break your live widget
              until you update the snippet above with the new key.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getAiSettings, updateAiSettings, AiSettings, ApiError } from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";
import { DiamondBullet } from "@/components/DiamondBullet";

export default function AiSettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAiSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load settings."));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateAiSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save these settings.");
    } finally {
      setSaving(false);
    }
  }

  if (settings === null && !error) return <NodeLoader label="Loading AMARA's settings…" />;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">AMARA&apos;s Persona</h1>
      <p className="text-slate-400 text-sm mt-1 mb-8">
        Shape how AMARA sounds. Some things never change, no matter what you set here.
      </p>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mb-8">
        <p className="text-sm font-medium text-blue-300 mb-2">Always true, by design</p>
        <ul className="space-y-1.5 text-sm text-slate-400">
          <DiamondBullet>AMARA never states a price herself - every offer goes through your Negotiation Engine.</DiamondBullet>
          <DiamondBullet>She&apos;ll never go below a product&apos;s floor price, regardless of tone or instructions.</DiamondBullet>
        </ul>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {settings && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Tone of voice</label>
            <input
              maxLength={40}
              value={settings.tone || ""}
              onChange={(e) => setSettings({ ...settings, tone: e.target.value })}
              placeholder="e.g. upbeat and playful"
              className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            />
            <p className="text-xs text-slate-500 mt-1">{(settings.tone || "").length}/40</p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Greeting</label>
            <textarea
              maxLength={300}
              rows={2}
              value={settings.greeting || ""}
              onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
              placeholder="e.g. Hey there! Welcome to Demo Business!"
              className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">About your business</label>
            <textarea
              maxLength={500}
              rows={3}
              value={settings.businessDescription || ""}
              onChange={(e) => setSettings({ ...settings, businessDescription: e.target.value })}
              placeholder="What you sell, who you serve, what makes you different"
              className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Custom instructions</label>
            <textarea
              maxLength={500}
              rows={3}
              value={settings.customInstructions || ""}
              onChange={(e) => setSettings({ ...settings, customInstructions: e.target.value })}
              placeholder="e.g. Always mention we offer free shipping over $50"
              className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 transition"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && <span className="text-sm text-green-500">Saved</span>}
          </div>
        </form>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  StorefrontSettings,
  TrackingPlatform,
  getMyStorefront,
  upsertStorefront,
  disableStorefront,
  getTrackingPlatforms,
  saveTrackingPlatform,
  uploadImage,
  ApiError,
} from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

const inputClass =
  "w-full rounded-lg bg-surface-50 border border-card-border px-4 py-2.5 text-ink-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition";
const labelClass = "block text-sm text-ink-500 mb-1.5";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-card-border bg-card shadow-sm p-5 mb-6">
      <h2 className="font-display text-sm font-semibold text-ink-500 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function TrackingRow({ platform, onSave }: { platform: TrackingPlatform; onSave: (key: string, value: string) => Promise<void> }) {
  const [value, setValue] = useState(platform.trackingId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(platform.key, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-end gap-3 py-3 border-b border-card-border last:border-0">
      <div className="flex-1">
        <label className={labelClass}>{platform.label}</label>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={platform.placeholder}
          className={inputClass}
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 transition whitespace-nowrap shrink-0"
      >
        {saving ? "Saving…" : saved ? "Saved!" : "Save & Apply"}
      </button>
    </div>
  );
}

export default function StorefrontPage() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#2F6FED");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeHost, setStoreHost] = useState("");

  const [platforms, setPlatforms] = useState<TrackingPlatform[] | null>(null);

  function load() {
    getMyStorefront()
      .then((s) => {
        setSettings(s);
        setSlug(s.slug || "");
        setTagline(s.tagline || "");
        setLogoUrl(s.logoUrl || "");
        setAccentColor(s.accentColor || "#2F6FED");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your storefront settings."));

    if (typeof window !== "undefined") {
      // "dashboard.amaraagent.com" -> "store.amaraagent.com" - derived
      // dynamically rather than hardcoded, so this works the same on
      // any domain this project is ever deployed under.
      setStoreHost(window.location.host.replace(/^[^.]+\./, "store."));
    }
  }

  useEffect(() => {
    load();
    getTrackingPlatforms()
      .then(setPlatforms)
      .catch(() => {
        /* non-critical for this page's main purpose */
      });
  }, []);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSaveError(null);
    try {
      const url = await uploadImage(file);
      setLogoUrl(url);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't upload that image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await upsertStorefront({
        slug: slug.trim().toLowerCase(),
        tagline: tagline || undefined,
        logoUrl: logoUrl || undefined,
        accentColor: accentColor || undefined,
      });
      setSettings(updated);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't save your storefront.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable() {
    if (!confirm("This takes your storefront offline immediately. Your link can be re-claimed by typing the same slug again later. Continue?")) {
      return;
    }
    try {
      const result = await disableStorefront();
      setSettings((s) => (s ? { ...s, enabled: result.enabled, slug: null } : s));
      setSlug("");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't disable your storefront.");
    }
  }

  async function handleSaveTracking(key: string, value: string) {
    const updated = await saveTrackingPlatform(key, value);
    setPlatforms(updated);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`https://${storeHost}/${settings?.slug}`);
  }

  if (settings === null && !error) return <NodeLoader label="Loading your storefront…" />;

  if (error) {
    return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>;
  }

  if (settings && !settings.eligible) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Storefront</h1>
        <p className="text-ink-500 text-sm mt-1 mb-6">
          A public page showing all your products, with a direct "Order Now" into AMARA.
        </p>
        <div className="rounded-xl border border-card-border bg-card shadow-sm p-6 text-center opacity-70">
          <p className="font-medium text-ink-900 mb-1">Available on Premium</p>
          <p className="text-sm text-ink-500 mb-4">
            Upgrade your plan to get your own storefront at store.amaraagent.com/your-business.
          </p>
          <button disabled className="rounded-lg bg-blue-500 text-white font-medium px-5 py-2.5 opacity-50 cursor-not-allowed">
            Create your storefront
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">Storefront</h1>
      <p className="text-ink-500 text-sm mt-1 mb-6">
        A public page showing all your products - upload or remove a product here and it updates there
        automatically. Every product has an "Order Now" button straight into AMARA.
      </p>

      {settings?.enabled && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-ink-900">Your storefront is live</p>
            <p className="text-sm text-blue-700 font-mono break-all">https://{storeHost}/{settings.slug}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleCopyLink} className="text-sm rounded-lg border border-card-border hover:bg-surface-50 px-3 py-1.5 transition text-ink-900">
              Copy link
            </button>
            <button onClick={handleDisable} className="text-sm text-red-600/80 hover:text-red-600 px-3 py-1.5 transition">
              Disable
            </button>
          </div>
        </div>
      )}

      <Section title={settings?.enabled ? "Edit storefront" : "Create your storefront"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelClass}>Your link</label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-ink-400 whitespace-nowrap">{storeHost}/</span>
              <input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="your-business"
                className={inputClass}
              />
            </div>
            <p className="text-xs text-ink-400 mt-1">Lowercase letters, numbers, and hyphens only.</p>
          </div>

          <div>
            <label className={labelClass}>Tagline (optional)</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Quality electronics, fast delivery"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Logo (optional)</label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-card-border" />
              ) : (
                <div className="w-14 h-14 rounded-full border border-dashed border-card-border flex items-center justify-center text-ink-400 text-xs">
                  None
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm text-blue-600 hover:text-blue-700 border border-card-border rounded-lg px-3 py-1.5 disabled:opacity-50 transition"
              >
                {uploading ? "Uploading…" : logoUrl ? "Change logo" : "Upload logo"}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Accent color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-card-border cursor-pointer bg-surface-50"
              />
              <span className="font-mono text-sm text-ink-500">{accentColor}</span>
            </div>
            <p className="text-xs text-ink-400 mt-1">Used for your "Order Now" buttons on the storefront.</p>
          </div>

          {saveError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>}

          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-medium px-5 py-2.5 transition"
          >
            {saving ? "Saving…" : settings?.enabled ? "Save changes" : "Create your storefront"}
          </button>
        </form>
      </Section>

      {settings?.enabled && (
        <Section title="Tracking & Marketing">
          <p className="text-sm text-ink-400 mb-4">
            Connect your own ad/analytics tools - each one applies to your storefront automatically, no
            code editing needed. Leave a field blank and save to remove that platform.
          </p>
          {platforms === null ? (
            <NodeLoader label="Loading…" />
          ) : (
            <div>
              {platforms.map((p) => (
                <TrackingRow key={p.key} platform={p} onSave={handleSaveTracking} />
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Product,
  ProductUsage,
  getProducts,
  getProductUsage,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  ApiError,
} from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

type FormState = {
  name: string;
  description: string;
  specifications: string;
  category: string;
  price: string;
  minPrice: string;
  imageUrl: string;
  imageUrls: string[];
  isService: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  specifications: "",
  category: "",
  price: "",
  minPrice: "",
  imageUrl: "",
  imageUrls: [],
  isService: false,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [usage, setUsage] = useState<ProductUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [productsData, usageData] = await Promise.all([getProducts(), getProductUsage()]);
      setProducts(productsData);
      setUsage(usageData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load products.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    load();
  }, []);

  const atLimit = usage?.limit != null && usage.count >= usage.limit;

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      specifications: p.specifications || "",
      category: p.category || "",
      price: p.price,
      minPrice: p.minPrice,
      imageUrl: p.imageUrl || "",
      imageUrls: p.imageUrls || [],
      isService: p.isService,
    });
    setShowForm(true);
    setError(null);
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload that image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGallery(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url] }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload that image.");
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function removeGalleryImage(url: string) {
    setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((u) => u !== url) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        specifications: form.specifications || undefined,
        category: form.category || undefined,
        price: Number(form.price),
        minPrice: Number(form.minPrice),
        imageUrl: form.imageUrl || undefined,
        imageUrls: form.imageUrls,
        isService: form.isService,
      };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this product? If it has past orders, it will just be hidden instead of deleted. If it's on your storefront, it disappears from there too.")) {
      return;
    }
    try {
      await deleteProduct(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove this product.");
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Products</h1>
          <p className="text-ink-500 text-sm mt-1">
            What AMARA can sell, and the floor she&apos;ll never negotiate below.
          </p>
        </div>
        <button
          onClick={startCreate}
          disabled={!!atLimit}
          className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 transition shrink-0"
        >
          Add product
        </button>
      </div>

      {usage && (
        <p className={`text-xs mb-6 ${atLimit ? "text-amber-600" : "text-ink-400"}`}>
          {usage.count} / {usage.limit ?? "∞"} products used
          {atLimit && " — you've reached your plan's limit. Remove a product, or ask Datacrux to raise it."}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-card-border bg-card shadow-sm p-5 space-y-4"
        >
          <h2 className="font-display font-medium text-sm text-blue-600">
            {editingId ? "Edit product" : "New product"}
          </h2>

          <div>
            <label className="block text-xs text-ink-500 mb-1.5">Cover photo</label>
            <div className="flex items-center gap-4">
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover border border-card-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-card-border flex items-center justify-center text-ink-400 text-xs">
                  None
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm text-blue-600 hover:text-blue-700 border border-card-border rounded-lg px-3 py-1.5 disabled:opacity-50 transition"
              >
                {uploading ? "Uploading…" : form.imageUrl ? "Change photo" : "Upload photo"}
              </button>
            </div>
            <p className="text-xs text-ink-400 mt-1.5">Used in chat and as this product's main photo on your storefront.</p>
          </div>

          <div>
            <label className="block text-xs text-ink-500 mb-1.5">
              Additional photos <span className="text-ink-400">(optional - shown on your storefront's product view)</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {form.imageUrls.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-card-border" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(url)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleGallerySelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGallery}
                className="w-14 h-14 rounded-lg border border-dashed border-card-border flex items-center justify-center text-ink-400 text-xl disabled:opacity-50"
              >
                {uploadingGallery ? "…" : "+"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink-500 mb-1.5">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg bg-surface-50 border border-card-border px-3 py-2 text-sm text-ink-900 outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-500 mb-1.5">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg bg-surface-50 border border-card-border px-3 py-2 text-sm text-ink-900 outline-none focus:border-blue-400"
              placeholder="A short, customer-facing description"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-500 mb-1.5">
              Specifications <span className="text-ink-400">(sizes, colors, material, coverage per unit — AMARA uses this to answer detailed questions and do quantity calculations)</span>
            </label>
            <textarea
              value={form.specifications}
              onChange={(e) => setForm({ ...form, specifications: e.target.value })}
              rows={3}
              className="w-full rounded-lg bg-surface-50 border border-card-border px-3 py-2 text-sm text-ink-900 outline-none focus:border-blue-400"
              placeholder={"e.g.\nSizes: S, M, L, XL\nColors: Black, White, Navy\nMaterial: 100% cotton\n1 roll covers 2 square meters"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ink-500 mb-1.5">List price (₦)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg bg-surface-50 border border-card-border px-3 py-2 text-sm font-mono text-ink-900 outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1.5">Floor price (₦)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.minPrice}
                onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                className="w-full rounded-lg bg-surface-50 border border-card-border px-3 py-2 text-sm font-mono text-ink-900 outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-ink-500 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isService}
              onChange={(e) => setForm({ ...form, isService: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            This is a service (AMARA asks for a date/time instead of a delivery address)
          </label>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || uploading || uploadingGallery}
              className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 transition"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create product"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg text-sm text-ink-500 hover:text-ink-900 px-4 py-2 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {products === null && <NodeLoader label="Loading products…" />}

      {products?.length === 0 && (
        <div className="text-center py-16 border border-dashed border-card-border rounded-xl">
          <p className="text-ink-500 text-sm">No products yet. Add your first one above.</p>
        </div>
      )}

      <div className="space-y-3">
        {products?.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-card-border bg-card shadow-sm p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover border border-card-border shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg border border-card-border shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="diamond-bullet" />
                  <p className="font-medium text-ink-900 truncate">{p.name}</p>
                  {p.isService && (
                    <span className="text-[11px] uppercase tracking-wide text-blue-600 border border-blue-200 bg-blue-50 rounded px-1.5 py-0.5">
                      Service
                    </span>
                  )}
                  {!p.available && (
                    <span className="text-[11px] uppercase tracking-wide text-amber-600 border border-amber-200 bg-amber-50 rounded px-1.5 py-0.5">
                      Hidden
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="text-ink-500 text-sm mt-1 truncate">{p.description}</p>
                )}
                <p className="font-mono text-sm mt-2 text-ink-500">
                  ₦{Number(p.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}{" "}
                  <span className="text-ink-400">
                    · floor ₦{Number(p.minPrice).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => startEdit(p)}
                className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-surface-50 transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-sm text-red-600/80 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-surface-50 transition"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

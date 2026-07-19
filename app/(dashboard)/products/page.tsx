"use client";

import { useEffect, useState } from "react";
import {
  Product,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  ApiError,
} from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

type FormState = {
  name: string;
  description: string;
  category: string;
  price: string;
  minPrice: string;
};

const EMPTY_FORM: FormState = { name: "", description: "", category: "", price: "", minPrice: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load products.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    load();
  }, []);

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
      category: p.category || "",
      price: p.price,
      minPrice: p.minPrice,
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        price: Number(form.price),
        minPrice: Number(form.minPrice),
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
    if (!confirm("Remove this product? If it has past orders, it will just be hidden instead of deleted.")) {
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold">Products</h1>
          <p className="text-slate-400 text-sm mt-1">
            What AMARA can sell, and the floor she&apos;ll never negotiate below.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-4 py-2 transition shrink-0"
        >
          Add product
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-navy-700 bg-navy-800 p-5 space-y-4"
        >
          <h2 className="font-display font-medium text-sm text-blue-300">
            {editingId ? "Edit product" : "New product"}
          </h2>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg bg-navy-900 border border-navy-700 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg bg-navy-900 border border-navy-700 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">List price (₦)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg bg-navy-900 border border-navy-700 px-3 py-2 text-sm font-mono outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Floor price (₦)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.minPrice}
                onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                className="w-full rounded-lg bg-navy-900 border border-navy-700 px-3 py-2 text-sm font-mono outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 transition"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create product"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg text-sm text-slate-400 hover:text-ice-50 px-4 py-2 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {products === null && <NodeLoader label="Loading products…" />}

      {products?.length === 0 && (
        <div className="text-center py-16 border border-dashed border-navy-700 rounded-xl">
          <p className="text-slate-400 text-sm">No products yet. Add your first one above.</p>
        </div>
      )}

      <div className="space-y-3">
        {products?.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-navy-700 bg-navy-800 p-4 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="diamond-bullet" />
                <p className="font-medium truncate">{p.name}</p>
                {!p.available && (
                  <span className="text-[11px] uppercase tracking-wide text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded px-1.5 py-0.5">
                    Hidden
                  </span>
                )}
              </div>
              {p.description && (
                <p className="text-slate-400 text-sm mt-1 truncate">{p.description}</p>
              )}
              <p className="font-mono text-sm mt-2 text-slate-400">
                ₦{Number(p.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}{" "}
                <span className="text-slate-500">
                  · floor ₦{Number(p.minPrice).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => startEdit(p)}
                className="text-sm text-blue-300 hover:text-blue-200 px-3 py-1.5 rounded-lg hover:bg-navy-700 transition"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-sm text-red-500/80 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-navy-700 transition"
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

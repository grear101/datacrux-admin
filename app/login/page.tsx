"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { login, setToken, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      setToken(result.accessToken);
      router.push("/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient background: faint diamond grid, echoing the mark's geometry */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(45deg, var(--color-blue-400) 1px, transparent 1px), linear-gradient(-45deg, var(--color-blue-400) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-10">
          <Image src="/logo.png" alt="Datacrux Africa" width={72} height={72} className="rounded-full mb-4" />
          <p className="font-display text-sm tracking-[0.2em] text-blue-300 uppercase">
            Decode. Discover. Dominate.
          </p>
        </div>

        <h1 className="font-display text-2xl font-semibold text-center mb-1">
          Sign in to your dashboard
        </h1>
        <p className="text-slate-400 text-sm text-center mb-8">
          Manage AMARA&apos;s products and persona
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-ice-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition"
              placeholder="you@business.com"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-navy-800 border border-navy-700 px-4 py-2.5 text-ice-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-medium py-2.5 transition"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

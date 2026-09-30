"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isLoggedIn, getRole, clearToken } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/platform/onboard", label: "Onboard Business" },
  { href: "/platform/clients", label: "Clients" },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    if (getRole() !== "superadmin") {
      router.replace("/products");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard auth-guard pattern, not a cascading-render issue
    setChecked(true);
  }, [router]);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  if (!checked) return null;

  return (
    <div className="flex min-h-screen relative">
      {/* Backdrop behind the sidebar drawer - mobile only */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed md:static top-0 left-0 h-full z-50 w-64 shrink-0 bg-navy-950 border-r border-navy-700 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-6 flex flex-col items-start gap-3 border-b border-navy-700">
          <Image src="/logo.png" alt="Datacrux Africa" width={44} height={44} className="rounded-full" />
          <div>
            <p className="font-display font-semibold text-sm leading-tight">Datacrux Africa</p>
            <p className="text-[11px] text-slate-500 tracking-wide">Team Console</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                    : "text-slate-400 hover:text-ice-50 hover:bg-navy-800 border border-transparent"
                }`}
              >
                <span
                  className="diamond-bullet"
                  style={{ background: active ? "var(--color-blue-400)" : "var(--color-slate-500)" }}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-navy-700">
          <button
            onClick={handleLogout}
            className="w-full text-left rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:text-red-500 hover:bg-navy-800 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar - hidden on desktop, where the sidebar is always visible */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-navy-700 bg-navy-950 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Datacrux Africa" width={28} height={28} className="rounded-full" />
            <p className="font-display font-semibold text-sm">Datacrux Africa</p>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -mr-2 text-slate-300"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

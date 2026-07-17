"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isLoggedIn, clearToken } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/products", label: "Products" },
  { href: "/ai-settings", label: "AMARA's Persona" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- standard auth-guard pattern, not a cascading-render issue
      setChecked(true);
    }
  }, [router]);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  if (!checked) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-navy-950 border-r border-navy-700 flex flex-col">
        <div className="p-6 flex flex-col items-start gap-3 border-b border-navy-700">
          <Image src="/logo.png" alt="Datacrux Africa" width={44} height={44} className="rounded-full" />
          <div>
            <p className="font-display font-semibold text-sm leading-tight">Datacrux Africa</p>
            <p className="text-[11px] text-slate-500 tracking-wide">AMARA Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}

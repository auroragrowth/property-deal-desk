"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "./actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/market", label: "Market" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/viewings", label: "Viewings" },
  { href: "/settings", label: "Settings" },
] as const;

export function Topbar() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const initial = (email ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="bg-bg-strong text-text-on-strong sticky top-0 z-10 border-b border-white/10">
      <div className="max-w-app mx-auto flex h-14 items-center justify-between gap-3 px-5">
        <Link href="/dashboard" className="font-serif text-[22px] leading-none">
          <span>Deal</span>
          <span className="text-accent italic">Desk</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "inline-flex h-11 items-center rounded-md px-3 font-mono text-[11px] tracking-[0.12em] uppercase",
                  active
                    ? "text-accent"
                    : "text-text-on-strong/70 hover:text-text-on-strong",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="relative ml-1" ref={ref}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Account menu"
              onClick={() => setOpen((v) => !v)}
              className="bg-bg-page text-text-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium"
            >
              {initial}
            </button>
            {open && (
              <div
                role="menu"
                className="border-border bg-bg-surface absolute right-0 z-20 mt-2 w-56 rounded-md border-[0.5px] py-1 shadow-lg"
              >
                {email && (
                  <p className="text-text-tertiary border-border border-b-[0.5px] px-3 py-2 text-xs break-all">
                    {email}
                  </p>
                )}
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="text-text-primary hover:bg-bg-surface-2 block px-3 py-2 text-sm"
                >
                  Settings
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="text-text-primary hover:bg-bg-surface-2 block w-full px-3 py-2 text-left text-sm"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

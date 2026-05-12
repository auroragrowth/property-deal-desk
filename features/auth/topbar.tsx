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
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!accountOpen) return;
    function onClick(e: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      )
        setAccountOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountOpen]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = mobileOpen ? "hidden" : prev;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const initial = (email ?? "?").trim().charAt(0).toUpperCase() || "?";

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <header className="bg-bg-strong text-text-on-strong sticky top-0 z-30 border-b border-white/10">
      <div className="max-w-app mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:px-5">
        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="text-text-on-strong inline-flex h-11 w-11 items-center justify-center md:hidden"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            {mobileOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>

        <Link
          href="/dashboard"
          className="font-serif text-[22px] leading-none"
        >
          <span>Deal</span>
          <span className="text-accent italic">Desk</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
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
        </nav>

        {/* Account avatar (both viewports) */}
        <div className="relative" ref={accountRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={accountOpen}
            aria-label="Account menu"
            onClick={() => setAccountOpen((v) => !v)}
            className="bg-bg-page text-text-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium"
          >
            {initial}
          </button>
          {accountOpen && (
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
                onClick={() => setAccountOpen(false)}
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
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-20 cursor-default bg-black/30 md:hidden"
          />
          <nav
            aria-label="Main"
            className="bg-bg-strong text-text-on-strong absolute top-14 right-0 left-0 z-30 border-b border-white/10 px-2 py-3 md:hidden"
          >
            <ul className="space-y-1">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "flex h-12 items-center rounded-md px-4 font-mono text-xs tracking-[0.12em] uppercase",
                        active
                          ? "bg-white/10 text-accent"
                          : "text-text-on-strong/85 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/settings", label: "Settings" },
] as const;

export function Topbar() {
  const pathname = usePathname() ?? "";

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
          <div className="ml-1">
            <UserButton />
          </div>
        </nav>
      </div>
    </header>
  );
}

/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Layers,
  UploadCloud,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  Film,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { href: "/upload", label: "Studio", icon: UploadCloud },
  { href: "/assets", label: "Catalog", icon: Layers },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/video", label: "Video", icon: Film },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isStudioPage = pathname === "/upload";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2 shrink-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-500 via-primary to-emerald-600 p-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
              <div className="flex size-full items-center justify-center rounded-[7px] bg-background/90 backdrop-blur-xs">
                <Sparkles className="size-3.5 text-primary transition-colors group-hover:text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-base font-bold tracking-tight text-foreground">
                Lumina
              </span>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold text-primary"
              >
                Compiler
              </Badge>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary font-semibold shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
            </span>
            <ShieldCheck className="size-3 shrink-0" />
            <span className="whitespace-nowrap">$0.00 Spend Protected</span>
          </div>

          <ThemeToggle />

          {!isStudioPage ? (
            <Link href="/upload" className="hidden sm:inline-flex">
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold rounded-lg shadow-xs"
              >
                <Sparkles className="size-3.5" />
                <span>Launch Studio</span>
              </Button>
            </Link>
          ) : (
            <Link href="/assets" className="hidden sm:inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground"
              >
                <Layers className="size-3.5" />
                <span>Browse Catalog</span>
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-b border-border/80 bg-background/95 px-4 pt-2 pb-4 shadow-xl backdrop-blur-2xl md:hidden animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="size-3.5 shrink-0" />
                <span>Zero-Credit Protection</span>
              </div>
              <Link href="/upload" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="h-7 text-xs font-medium">
                  Studio <ArrowRight className="size-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

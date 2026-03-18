"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  User,
  LogOut,
  Menu,
  X,
  Home,
  BookOpen,
  Tag,
  Info,
  Loader2,
  LayoutDashboard,
  Crown,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";
import { PLATFORM } from "@/config/platform";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Unified Navigation Component
 *
 * Renders the correct navbar based on auth state:
 * - Logged out: Public navbar (Home->/, Pricing, Resources, About, Login)
 * - Logged in:  User navbar  (Dashboard, Subjects, Mock Tests, Pricing, user menu)
 *
 * Admin pages use their own layout/sidebar — do NOT use this component there.
 */
export function Navigation() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  // Close menus on route change
  React.useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const isLoggedIn = !!user;

  // ── Nav items based on auth state ──────────────────────────────
  const publicNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/pricing", label: "Pricing", icon: Tag },
    { href: "/resources", label: "Resources", icon: BookOpen },
    { href: "/about", label: "About Us", icon: Info },
  ];

  const userNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/subjects", label: "Subjects", icon: BookOpen },
    { href: "/mock-tests", label: "Mock Tests", icon: BarChart3 },
    { href: "/pricing", label: "Pricing", icon: Tag },
  ];

  const navItems = isLoggedIn ? userNavItems : publicNavItems;

  // Logo href: logged in -> dashboard, logged out -> landing
  const logoHref = isLoggedIn ? "/dashboard" : "/";

  // ── Active state detection ─────────────────────────────────────
  function isActive(href: string) {
    if (href === "/" || href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  // ── Logout handler ─────────────────────────────────────────────
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      setUserMenuOpen(false);
      setMobileOpen(false);
      await signOut();
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* ── Logo ─────────────────────────────────────────── */}
        <Link href={logoHref} className="flex items-center flex-shrink-0">
          <Image
            src="/images/Thinqr_logo.png"
            alt={`${PLATFORM.brand} Logo`}
            width={180}
            height={180}
            className="object-contain h-20 w-auto"
          />
        </Link>

        {/* ── Desktop Nav ──────────────────────────────────── */}
        <div className="hidden md:flex md:items-center md:gap-1 lg:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}

          <ThemeToggle />

          {/* ── Auth Section ──────────────────────────────── */}
          {isLoggedIn ? (
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <User className="h-4 w-4" />
                <span className="max-w-[120px] truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50">
                    <div className="p-2">
                      {/* User info */}
                      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 mb-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>

                      <Link
                        href="/analytics"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </Link>

                      <Link
                        href="/upgrade"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-md"
                      >
                        <Crown className="h-4 w-4" />
                        Upgrade Plan
                      </Link>

                      <hr className="my-1 border-slate-200 dark:border-slate-700" />

                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50"
                      >
                        {loggingOut ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Logging out...
                          </>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile Menu Button ───────────────────────────── */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* ── Mobile Menu ──────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 md:hidden">
          <div className="space-y-1 px-6 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(item.href)
                    ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}

            <div className="px-3 py-2">
              <ThemeToggle />
            </div>

            <hr className="my-2 border-slate-200 dark:border-slate-700" />

            {isLoggedIn ? (
              <>
                <Link
                  href="/analytics"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
                <Link
                  href="/upgrade"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Plan
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="block">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

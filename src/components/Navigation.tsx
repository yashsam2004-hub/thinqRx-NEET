"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, LogOut, Menu, X, Home, BookOpen, Tag, Info } from "lucide-react";
import { PLATFORM } from "@/config/platform";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavigationProps {
  showAuthButtons?: boolean;
}

export function Navigation({ showAuthButtons = true }: NavigationProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  // Main navigation items
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/pricing", label: "Pricing", icon: Tag },
    { href: "/resources", label: "Resources", icon: BookOpen },
    { href: "https://your-company-website.com", label: "About Us", icon: Info, external: true },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/Thinqr_logo.png"
            alt={`${PLATFORM.brand} Logo`}
            width={180}
            height={180}
            className="object-contain h-20 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-2">
          {/* Navigation Items */}
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const ItemComponent = item.external ? 'a' : Link;
            const extraProps = item.external 
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {};
            
            return (
              <ItemComponent
                key={item.href}
                href={item.href}
                {...extraProps}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400" 
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
                }`}
                aria-label={item.label}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </ItemComponent>
            );
          })}
          
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Auth Buttons / User Menu */}
          {showAuthButtons && (
            <>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[120px] truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/analytics"
                          className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Analytics
                        </Link>
                        <hr className="my-1 border-slate-200 dark:border-slate-700" />
                        <button
                          onClick={async () => {
                            await signOut();
                            setUserMenuOpen(false);
                            window.location.href = "/";
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="hover:text-teal-600 dark:hover:text-teal-400 text-slate-700 dark:text-slate-300">
                      Login
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 md:hidden">
          <div className="space-y-1 px-6 py-4">
            {/* Navigation Items (Mobile) */}
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const ItemComponent = item.external ? 'a' : Link;
              const extraProps = item.external 
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {};
              
              return (
                <ItemComponent
                  key={item.href}
                  href={item.href}
                  {...extraProps}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </ItemComponent>
              );
            })}
            
            {/* Theme Toggle (Mobile) */}
            <div className="px-3 py-2">
              <ThemeToggle />
            </div>

            {/* Mobile Auth */}
            {showAuthButtons && (
              <>
                <hr className="my-4 border-slate-200 dark:border-slate-700" />
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/analytics"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Analytics
                    </Link>
                    <button
                      onClick={async () => {
                        await signOut();
                        setMobileOpen(false);
                        window.location.href = "/";
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="relative h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 transition-all duration-300 flex items-center justify-center"
        disabled
        aria-label="Loading theme toggle"
      >
        <Sun className="h-5 w-5 text-slate-400" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 dark:from-slate-800 dark:to-slate-900 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <Sun
          className={`absolute inset-0 h-5 w-5 text-amber-500 transition-all duration-500 ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`absolute inset-0 h-5 w-5 text-teal-500 dark:text-teal-400 transition-all duration-500 ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </div>
      
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 dark:from-teal-400 dark:to-blue-400 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300" />
      
      {/* Ripple Effect on Click */}
      <span className="absolute inset-0 rounded-xl bg-white dark:bg-slate-600 opacity-0 group-active:opacity-30 group-active:animate-ping" />
    </button>
  );
}

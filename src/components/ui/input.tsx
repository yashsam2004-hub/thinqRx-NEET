import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, value, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      value={value ?? ""}
      data-slot="input"
      className={cn(
        // Base colors and text
        "text-foreground file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        // Dark mode FIX: Explicit text color for maximum visibility
        "dark:bg-input/30 dark:text-slate-100 dark:placeholder:text-slate-500 dark:caret-slate-100 dark:selection:bg-teal-500/30 dark:selection:text-slate-100",
        // Layout and sizing
        "border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
        // File input specific
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Focus states
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        // Error/invalid states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Responsive text size
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }

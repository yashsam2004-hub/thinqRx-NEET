"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface PricingCTAProps {
  plan: "free" | "plus" | "pro";
  text: string;
  variant?: "default" | "outline";
  className?: string;
}

export function PricingCTA({ plan, text, variant = "default", className = "" }: PricingCTAProps) {
  const router = useRouter();
  const [checking, setChecking] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Free plan always goes to signup
    if (plan === "free") {
      router.push("/signup");
      return;
    }

    setChecking(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // User is logged in → go to upgrade page
        router.push(`/upgrade?plan=${plan}`);
      } else {
        // User is NOT logged in → go to signup
        router.push(`/signup?plan=${plan}`);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // Fallback to signup
      router.push(`/signup?plan=${plan}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      className={className}
      disabled={checking}
    >
      {checking ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking...
        </>
      ) : (
        text
      )}
    </Button>
  );
}

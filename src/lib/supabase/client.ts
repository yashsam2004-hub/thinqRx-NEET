"use client";

import { createBrowserClient } from "@supabase/ssr";
import { assertPublicEnv, publicEnv } from "@/lib/env-public";

export function createSupabaseBrowserClient() {
  assertPublicEnv();
  const { supabaseUrl, supabaseAnonKey } = publicEnv;
  return createBrowserClient(
    supabaseUrl!,
    supabaseAnonKey!,
  );
}



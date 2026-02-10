"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Create Supabase client ONCE, not on every render
  const [supabase] = useState(() => createSupabaseBrowserClient());

  /**
   * CRITICAL FIX: Register auth listener EXACTLY ONCE on mount
   * - No dependencies means this runs once and never re-registers
   * - Prevents infinite loop from loadSession recreation
   * - Auth listener handles all state changes (login, logout, token refresh)
   */
  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("Error loading session:", error);
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        // Update state immediately for all events
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Explicit logout handling
        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
        }

        // Stop loading on any auth event
        setIsLoading(false);
      }
    );

    // Cleanup: unsubscribe on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // EMPTY DEPS = runs once on mount, never again

  /**
   * Sign out function
   * - Calls Supabase signOut (triggers SIGNED_OUT event)
   * - Clears localStorage
   * - Auth listener will handle state updates
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // Clear all localStorage to remove cached data
      localStorage.clear();
      // State will be cleared by onAuthStateChange listener
    } catch (error) {
      console.error("Error signing out:", error);
      // Force clear state even if API fails
      setSession(null);
      setUser(null);
      localStorage.clear();
    }
  }, []); // No deps - supabase client is stable

  /**
   * Refresh session manually
   * - Useful for checking auth status after navigation
   */
  const refreshSession = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
  }, []); // No deps - supabase client is stable

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to get current user (throws if not authenticated)
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  if (!isLoading && !user) {
    throw new Error("User must be authenticated");
  }
  return user;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, session } = useAuth();
  return !!(user && session);
}

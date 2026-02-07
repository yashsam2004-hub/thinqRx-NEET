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
  const supabase = createSupabaseBrowserClient();

  // Load session on mount
  const loadSession = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error loading session:", error);
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Check if session is expired
      if (currentSession?.expires_at) {
        const expiresAt = currentSession.expires_at * 1000; // Convert to ms
        if (Date.now() >= expiresAt) {
          console.warn("Session expired, refreshing...");
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            console.error("Failed to refresh expired session");
            setSession(null);
            setUser(null);
          } else {
            setSession(refreshData.session);
            setUser(refreshData.session.user);
          }
        } else {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // Don't auto sign-out unless explicitly requested
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadSession, supabase.auth]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [supabase.auth]);

  // Refresh session manually
  const refreshSession = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

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

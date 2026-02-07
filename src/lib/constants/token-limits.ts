export type PlanName = "FREE" | "STARTER" | "PRO" | "ULTIMATE";

export interface TokenLimits {
  FREE: number;
  STARTER: number;
  PRO: number;
  ULTIMATE: number | null; // null = unlimited
}

export const TOKEN_LIMITS: TokenLimits = {
  FREE: 500,
  STARTER: 2000,
  PRO: 50000,
  ULTIMATE: null, // unlimited
};

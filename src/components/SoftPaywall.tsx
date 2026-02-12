"use client";

/**
 * Soft Paywall Component
 * Non-aggressive upgrade prompts shown contextually
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Lock, 
  Zap, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2,
  X,
  Crown 
} from "lucide-react";

export type PaywallContext = 
  | 'ai_notes_limit'
  | 'practice_tests_limit'
  | 'explanations_limit'
  | 'analytics_limit';

interface SoftPaywallProps {
  context: PaywallContext;
  remaining?: number;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

const contextMessages = {
  ai_notes_limit: {
    icon: BookOpen,
    title: "You've used your free AI notes",
    description: "Unlock unlimited AI-generated study notes for all GPAT subjects",
    cta: "Upgrade to Full Prep",
    benefits: [
      "Unlimited AI notes for all 4 subjects",
      "Topic-wise organized content",
      "Chemical structures & diagrams",
      "365 days validity"
    ]
  },
  practice_tests_limit: {
    icon: Zap,
    title: "Test limit reached",
    description: "Get unlimited practice tests to ace GPAT exam",
    cta: "Upgrade to Full Prep",
    benefits: [
      "Unlimited full-length mock tests",
      "Subject-wise practice tests",
      "Detailed performance analytics",
      "365 days validity"
    ]
  },
  explanations_limit: {
    icon: CheckCircle2,
    title: "Want detailed explanations?",
    description: "Upgrade to get detailed answer explanations for every question",
    cta: "Upgrade to Full Prep",
    benefits: [
      "Detailed explanations for all questions",
      "Concept clarity for weak areas",
      "Step-by-step solutions",
      "365 days validity"
    ]
  },
  analytics_limit: {
    icon: TrendingUp,
    title: "Unlock advanced analytics",
    description: "Track your progress with detailed performance insights",
    cta: "Upgrade to Full Prep",
    benefits: [
      "Subject-wise performance tracking",
      "Weak area identification",
      "Progress trends & predictions",
      "365 days validity"
    ]
  }
};

export function SoftPaywall({ 
  context, 
  remaining = 0, 
  onDismiss,
  showDismiss = true 
}: SoftPaywallProps) {
  const [dismissed, setDismissed] = useState(false);
  const message = contextMessages[context];
  const Icon = message.icon;

  useEffect(() => {
    // Auto-dismiss after 30 seconds if user doesn't interact
    if (showDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [showDismiss]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <Card 
      className="p-6 border-2 rounded-xl relative"
      style={{ 
        borderColor: '#0F766E',
        backgroundColor: '#E6F4F2'
      }}
    >
      {showDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" style={{ color: '#475569' }} />
        </button>
      )}

      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-xl flex-shrink-0"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <Icon className="h-8 w-8" style={{ color: '#0F766E' }} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold" style={{ color: '#0F172A' }}>
              {message.title}
            </h3>
            {remaining > 0 && (
              <Badge 
                className="text-xs"
                style={{ 
                  backgroundColor: '#FEF3E7',
                  color: '#F4C430',
                  border: 'none'
                }}
              >
                {remaining} left
              </Badge>
            )}
          </div>

          <p className="text-base mb-4" style={{ color: '#475569' }}>
            {message.description}
          </p>

          <ul className="space-y-2 mb-6">
            {message.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle2 
                  className="h-4 w-4 flex-shrink-0" 
                  style={{ color: '#0F766E' }} 
                />
                <span className="text-sm" style={{ color: '#475569' }}>
                  {benefit}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/pricing" className="flex-1">
              <Button 
                className="w-full text-white border-0 rounded-lg gap-2"
                style={{ backgroundColor: '#0F766E' }}
              >
                <Crown className="h-4 w-4" />
                {message.cta}
              </Button>
            </Link>
            
            {showDismiss && (
              <Button 
                variant="outline"
                onClick={handleDismiss}
                className="rounded-lg border-2"
                style={{ 
                  borderColor: '#0F766E',
                  color: '#0F766E'
                }}
              >
                Maybe Later
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Inline soft paywall (for smaller contexts)
 */
export function InlinePaywall({ context }: { context: PaywallContext }) {
  const message = contextMessages[context];
  
  return (
    <div 
      className="p-4 rounded-lg border-2 flex items-center justify-between gap-4"
      style={{ 
        borderColor: '#0F766E',
        backgroundColor: '#FFFFFF'
      }}
    >
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 flex-shrink-0" style={{ color: '#0F766E' }} />
        <div>
          <p className="font-semibold text-sm" style={{ color: '#0F172A' }}>
            {message.title}
          </p>
          <p className="text-xs" style={{ color: '#64748B' }}>
            {message.description}
          </p>
        </div>
      </div>
      
      <Link href="/pricing">
        <Button 
          size="sm"
          className="text-white border-0 rounded-lg whitespace-nowrap"
          style={{ backgroundColor: '#0F766E' }}
        >
          Upgrade
        </Button>
      </Link>
    </div>
  );
}

/**
 * Usage indicator (shows remaining count)
 */
export function UsageIndicator({ 
  label, 
  used, 
  limit 
}: { 
  label: string; 
  used: number; 
  limit: number; 
}) {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: '#0F172A' }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: '#64748B' }}>
          {used} / {limit === 999 ? '∞' : limit}
        </span>
      </div>
      
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: isAtLimit ? '#EF4444' : isNearLimit ? '#F4C430' : '#0F766E'
          }}
        />
      </div>

      {isNearLimit && !isAtLimit && (
        <p className="text-xs" style={{ color: '#F4C430' }}>
          Almost at limit. Consider upgrading for unlimited access.
        </p>
      )}

      {isAtLimit && (
        <p className="text-xs" style={{ color: '#EF4444' }}>
          Limit reached. <Link href="/pricing" className="underline font-medium">Upgrade now</Link>
        </p>
      )}
    </div>
  );
}

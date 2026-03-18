"use client";

import React from 'react';
import Link from 'next/link';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Zap,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface PremiumGuardProps {
  children: React.ReactNode;
  requiredPlan?: 'Plus' | 'Pro';
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * Premium Content Guard
 * 
 * Wraps premium content and shows upgrade prompt for non-qualifying users
 * Now works with any plan type (not just Plus/Pro)
 * 
 * Usage:
 * ```tsx
 * <PremiumGuard requiredPlan="Pro">
 *   <PremiumFeature />
 * </PremiumGuard>
 * ```
 */
export function PremiumGuard({
  children,
  requiredPlan = 'Plus',
  fallback,
  showUpgradePrompt = true,
}: PremiumGuardProps) {
  const { subscription, loading, isPro, isPlus, isPlusOrHigher, isPaid } = useSubscription();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  // Check access based on required plan
  let hasAccess = false;

  if (requiredPlan === 'Plus') {
    // Plus or any paid plan (backward compatible)
    hasAccess = isPaid;
  } else if (requiredPlan === 'Pro') {
    // Pro plan specifically
    hasAccess = isPro;
  }

  // If user has access, show content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt
  if (showUpgradePrompt) {
    return <UpgradePrompt requiredPlan={requiredPlan} currentPlan={subscription?.plan || 'Free'} />;
  }

  // Default: show nothing
  return null;
}

/**
 * Upgrade Prompt Component
 */
function UpgradePrompt({ requiredPlan, currentPlan }: { requiredPlan: 'Plus' | 'Pro'; currentPlan: string }) {
  const icon = requiredPlan === 'Pro' ? <Crown className="h-8 w-8" /> : <Zap className="h-8 w-8" />;
  const color = requiredPlan === 'Pro' ? 'amber' : 'teal';
  const gradient = requiredPlan === 'Pro' 
    ? 'from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20'
    : 'from-teal-50 via-cyan-50 to-teal-50 dark:from-teal-950/20 dark:via-cyan-950/20 dark:to-teal-950/20';
  
  const benefits = requiredPlan === 'Pro' ? [
    'Full-length mock tests (125 MCQs)',
    'Detailed analytics & insights',
    'Priority support',
    'Early access to new features',
  ] : [
    'Unlimited AI-powered notes',
    'Practice tests with feedback',
    'All NEET topics covered',
    'Progress tracking',
  ];

  return (
    <Card className={`relative overflow-hidden border-2 ${color === 'amber' ? 'border-amber-200 dark:border-amber-800' : 'border-teal-200 dark:border-teal-800'}`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      
      {/* Content */}
      <div className="relative p-8 sm:p-12 text-center">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
          color === 'amber' 
            ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
            : 'bg-gradient-to-br from-teal-400 to-cyan-500'
        }`}>
          <span className="text-white">{icon}</span>
        </div>

        {/* Heading */}
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          {requiredPlan} Plan Required
        </h3>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Unlock premium content and supercharge your NEET UG preparation with our {requiredPlan} plan
        </p>

        {/* Current Plan Badge (if applicable) */}
        {currentPlan !== 'Free' && (
          <Badge className="mb-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0">
            Current Plan: {currentPlan}
          </Badge>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-lg mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-left text-sm text-slate-700 dark:text-slate-300"
            >
              <CheckCircle2 className={`h-5 w-5 ${color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'} flex-shrink-0 mt-0.5`} />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/upgrade">
            <Button
              size="lg"
              className={`gap-2 ${
                color === 'amber'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600'
              } text-white font-semibold`}
            >
              Upgrade to {requiredPlan}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <Link href="/pricing">
            <Button size="lg" variant="outline">
              Compare Plans
            </Button>
          </Link>
        </div>

        {/* Lock Icon (decorative) */}
        <div className="absolute top-4 right-4 opacity-10">
          <Lock className="h-24 w-24 text-slate-900 dark:text-slate-100" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Premium Badge Component
 * 
 * Shows a badge for premium content
 */
export function PremiumBadge({ plan = 'Pro' }: { plan?: 'Plus' | 'Pro' }) {
  const icon = plan === 'Pro' ? Crown : Zap;
  const Icon = icon;
  const color = plan === 'Pro' ? 'amber' : 'teal';

  return (
    <Badge
      className={`gap-1 ${
        color === 'amber'
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
      } border-0`}
    >
      <Icon className="h-3 w-3" />
      {plan}
    </Badge>
  );
}

/**
 * Inline Premium Lock
 * 
 * Shows a small lock icon for premium features
 */
export function PremiumLock() {
  return (
    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
      <Lock className="h-3 w-3" />
    </span>
  );
}

"use client";

import { Navigation } from "@/components/Navigation";
import { StructuredData } from "@/components/StructuredData";
import { FAQ } from "@/components/FAQ";
import { getOrganizationSchema, getWebPageSchema, getFAQSchema } from "@/lib/seo/structured-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { PLATFORM } from "@/config/platform";
import { FAQ_DATA } from "@/config/faq";
import { useAuth } from "@/contexts/AuthContext";
import * as React from "react";
import {
  BookOpen,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  
  // Structured Data for SEO/AEO
  const organizationSchema = getOrganizationSchema();
  const webPageSchema = getWebPageSchema(
    `${PLATFORM.brand} - AI-Powered GPAT Exam Preparation`,
    `ThinqRx is an AI-powered exam preparation platform for GPAT (Graduate Pharmacy Aptitude Test) in India. Provides AI-generated study notes, practice tests, and performance analytics for pharmacy students.`,
    "/"
  );
  const faqSchema = getFAQSchema(FAQ_DATA.slice(0, 8));

  return (
    <>
      <StructuredData data={[organizationSchema, webPageSchema, faqSchema]} />

      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
        <Navigation />

        {/* Hero Section with Background Carousel */}
        <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden" style={{ backgroundColor: '#E6F4F2' }}>
          {/* Background Carousel */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="animate-scroll flex gap-8 h-full">
              {/* Pharmacology Icons/Images */}
              <div className="flex-shrink-0 flex items-center justify-center w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-48 h-48">
                  {/* Pills/Tablets */}
                  <ellipse cx="35" cy="35" rx="15" ry="8" fill="currentColor" opacity="0.3" />
                  <ellipse cx="65" cy="65" rx="12" ry="6" fill="currentColor" opacity="0.3" />
                  <rect x="25" y="50" width="20" height="30" rx="10" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-48 h-48">
                  {/* DNA Helix */}
                  <path d="M20,30 Q50,40 80,30 T20,30" stroke="currentColor" fill="none" strokeWidth="2" opacity="0.3" />
                  <path d="M20,50 Q50,60 80,50 T20,50" stroke="currentColor" fill="none" strokeWidth="2" opacity="0.3" />
                  <path d="M20,70 Q50,80 80,70 T20,70" stroke="currentColor" fill="none" strokeWidth="2" opacity="0.3" />
                </svg>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-48 h-48">
                  {/* Molecular Structure */}
                  <circle cx="50" cy="30" r="8" fill="currentColor" opacity="0.3" />
                  <circle cx="30" cy="60" r="8" fill="currentColor" opacity="0.3" />
                  <circle cx="70" cy="60" r="8" fill="currentColor" opacity="0.3" />
                  <line x1="50" y1="30" x2="30" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <line x1="50" y1="30" x2="70" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                </svg>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-48 h-48">
                  {/* Flask/Beaker */}
                  <path d="M40,20 L40,40 L30,70 Q30,80 50,80 Q70,80 70,70 L60,40 L60,20 Z" fill="currentColor" opacity="0.3" />
                  <rect x="38" y="15" width="24" height="5" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-48 h-48">
                  {/* Syringe */}
                  <rect x="30" y="45" width="40" height="10" rx="2" fill="currentColor" opacity="0.3" />
                  <polygon points="70,45 75,50 70,55" fill="currentColor" opacity="0.3" />
                  <rect x="25" y="48" width="5" height="4" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-48 h-48">
                  {/* Heart with ECG */}
                  <path d="M50,70 L35,50 Q30,40 35,30 Q40,25 45,30 L50,35 L55,30 Q60,25 65,30 Q70,40 65,50 Z" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
              {/* Duplicate for seamless loop */}
              <div className="flex-shrink-0 flex items-center justify-center w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-48 h-48">
                  <ellipse cx="35" cy="35" rx="15" ry="8" fill="currentColor" opacity="0.3" />
                  <ellipse cx="65" cy="65" rx="12" ry="6" fill="currentColor" opacity="0.3" />
                  <rect x="25" y="50" width="20" height="30" rx="10" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-6 relative z-10">
            <div className="text-center">
              {/* Logo */}
              <div className="mx-auto mb-12 flex items-center justify-center">
                <div className="p-6 rounded-2xl bg-white border-2 border-[#E5E7EB]">
                  <Image
                    src="/images/Thinqr_logo.png"
                    alt="ThinqRx Logo"
                    width={240}
                    height={180}
                    priority
                    className="object-contain h-32 w-auto"
                  />
                </div>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: '#0F172A' }}>
                AI-Powered Study Platform for<br />
                <span style={{ color: '#0F766E' }}>GPAT Exam Preparation</span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed" style={{ color: '#475569' }}>
                ThinqRx helps pharmacy students prepare for GPAT with AI-generated study notes, practice questions, and performance tracking.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-white px-8 py-6 text-lg rounded-lg border-0" style={{ backgroundColor: '#0F766E' }}>
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-white px-8 py-6 text-lg rounded-lg border-0" style={{ backgroundColor: '#0F766E' }}>
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link href="#how-it-works" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg rounded-lg border-2" style={{ borderColor: '#0F766E', color: '#0F766E' }}>
                    How It Works
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What ThinqRx Does Section */}
        <section className="py-16 md:py-20 bg-white dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0F172A' }}>
                What ThinqRx Does
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#475569' }}>
                A web application designed to help you prepare for the GPAT exam
              </p>
            </div>

            <Card className="p-8 md:p-10 bg-white dark:bg-slate-900 border-2 rounded-xl" style={{ borderColor: '#E5E7EB' }}>
              <ul className="space-y-8">
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg mt-1" style={{ backgroundColor: '#E6F4F2' }}>
                    <CheckCircle2 className="h-5 w-5" style={{ color: '#0F766E' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#0F172A' }}>AI-Generated Study Notes</h3>
                    <p style={{ color: '#475569' }}>
                      Creates topic-wise notes using AI, organized by subject according to the PCI syllabus for GPAT.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg mt-1" style={{ backgroundColor: '#E6F4F2' }}>
                    <CheckCircle2 className="h-5 w-5" style={{ color: '#0F766E' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#0F172A' }}>Practice Tests and Questions</h3>
                    <p style={{ color: '#475569' }}>
                      Offers multiple-choice questions and full-length mock tests to practice exam patterns.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg mt-1" style={{ backgroundColor: '#E6F4F2' }}>
                    <CheckCircle2 className="h-5 w-5" style={{ color: '#0F766E' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#0F172A' }}>Answer Explanations</h3>
                    <p style={{ color: '#475569' }}>
                      Provides detailed explanations for each question to help you understand concepts.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg mt-1" style={{ backgroundColor: '#E6F4F2' }}>
                    <CheckCircle2 className="h-5 w-5" style={{ color: '#0F766E' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: '#0F172A' }}>Performance Analytics</h3>
                    <p style={{ color: '#475569' }}>
                      Tracks your test scores and identifies areas where you need more practice.
                    </p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-20" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0F172A' }}>
                Features
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#475569' }}>
                Study material, practice tests, and analytics for GPAT preparation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Study Material Card */}
              <Card className="p-8 bg-white dark:bg-slate-900 border-2 rounded-xl" style={{ borderColor: '#E5E7EB' }}>
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl mb-6" style={{ backgroundColor: '#E6F4F2' }}>
                    <BookOpen className="h-10 w-10" style={{ color: '#0F766E' }} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#0F172A' }}>
                    Study Material
                  </h3>
                  <p className="text-base leading-relaxed mb-6" style={{ color: '#475569' }}>
                    AI-generated notes covering all four GPAT subjects, aligned with the PCI syllabus
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Covers Pharmaceutics, Pharmaceutical Chemistry, Pharmacology, and Pharmacognosy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Organized by topics for easy navigation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Includes chemical structures and diagrams where relevant</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Based on PCI-approved syllabus</span>
                  </li>
                </ul>

                <Link href="/subjects">
                  <Button className="w-full text-white border-0 py-5 rounded-lg" style={{ backgroundColor: '#0F766E' }}>
                    View Study Material
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </Card>

              {/* Practice Tests Card */}
              <Card className="p-8 bg-white dark:bg-slate-900 border-2 rounded-xl" style={{ borderColor: '#E5E7EB' }}>
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl mb-6" style={{ backgroundColor: '#FEF3E7' }}>
                    <ClipboardList className="h-10 w-10" style={{ color: '#F4C430' }} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#0F172A' }}>
                    Practice Tests
                  </h3>
                  <p className="text-base leading-relaxed mb-6" style={{ color: '#475569' }}>
                    Full-length practice tests designed according to GPAT exam format
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>125 multiple-choice questions per test</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Computer-based test interface</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Answer explanations provided after submission</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Subject-wise score breakdowns</span>
                  </li>
                </ul>

                <Link href="/mock-tests">
                  <Button className="w-full text-white border-0 py-5 rounded-lg" style={{ backgroundColor: '#0F766E' }}>
                    View Practice Tests
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </Card>

              {/* Analytics Card */}
              <Card className="p-8 bg-white dark:bg-slate-900 border-2 rounded-xl" style={{ borderColor: '#E5E7EB' }}>
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl mb-6" style={{ backgroundColor: '#E6F4F2' }}>
                    <BarChart3 className="h-10 w-10" style={{ color: '#0F766E' }} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#0F172A' }}>
                    Performance Tracking
                  </h3>
                  <p className="text-base leading-relaxed mb-6" style={{ color: '#475569' }}>
                    Track your test scores and identify topics that need more practice
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>View your test history and scores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>See which subjects you score better in</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Track your progress over time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#0F766E' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Identify weak areas for focused study</span>
                  </li>
                </ul>

                <Link href="/analytics">
                  <Button className="w-full text-white border-0 py-5 rounded-lg" style={{ backgroundColor: '#0F766E' }}>
                    View Analytics
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-20 bg-white dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0F172A' }}>
                How It Works
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#475569' }}>
                Three simple steps to start your GPAT preparation
              </p>
            </div>

            <div className="space-y-6">
              <Card className="p-6 md:p-8 border-2 rounded-xl bg-white dark:bg-slate-900" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-bold" style={{ backgroundColor: '#0F766E' }}>
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: '#0F172A' }}>
                      Create a free account
                    </h3>
                    <p className="text-base" style={{ color: '#475569' }}>
                      Sign up with your email address. Choose a free plan to start, or select a paid plan for full access to all features.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8 border-2 rounded-xl bg-white dark:bg-slate-900" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-bold" style={{ backgroundColor: '#0F766E' }}>
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: '#0F172A' }}>
                      Access study material and tests
                    </h3>
                    <p className="text-base" style={{ color: '#475569' }}>
                      Browse subjects, read AI-generated notes, and take practice tests. Answer explanations help you learn from mistakes.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8 border-2 rounded-xl bg-white dark:bg-slate-900" style={{ borderColor: '#E5E7EB' }}>
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-bold" style={{ backgroundColor: '#0F766E' }}>
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: '#0F172A' }}>
                      Track your progress
                    </h3>
                    <p className="text-base" style={{ color: '#475569' }}>
                      Check your analytics dashboard to see scores, identify weak topics, and focus your study time where it's needed most.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section className="py-16 md:py-20" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0F172A' }}>
                Who Is ThinqRx For?
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#475569' }}>
                This platform is designed for students preparing for pharmacy entrance exams
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-2 rounded-xl bg-white dark:bg-slate-900" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#0F172A' }}>
                  GPAT Aspirants
                </h3>
                <p className="text-base" style={{ color: '#475569' }}>
                  Students preparing for the Graduate Pharmacy Aptitude Test (GPAT) conducted by NTA.
                </p>
              </Card>

              <Card className="p-6 border-2 rounded-xl bg-white dark:bg-slate-900" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#0F172A' }}>
                  Pharmacy Students
                </h3>
                <p className="text-base" style={{ color: '#475569' }}>
                  B.Pharm and M.Pharm students who want to review core pharmacy subjects systematically.
                </p>
              </Card>

              <Card className="p-6 border-2 rounded-xl bg-white dark:bg-slate-900" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#0F172A' }}>
                  Self-Study Learners
                </h3>
                <p className="text-base" style={{ color: '#475569' }}>
                  Individuals who prefer studying at their own pace with structured material and practice questions.
                </p>
              </Card>

              <Card className="p-6 border-2 rounded-xl bg-white dark:bg-slate-900" style={{ borderColor: '#E5E7EB' }}>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#0F172A' }}>
                  Working Professionals
                </h3>
                <p className="text-base" style={{ color: '#475569' }}>
                  Pharmacy professionals preparing for competitive exams while managing other commitments.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-20" style={{ backgroundColor: '#F8FAFC' }}>
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#0F172A' }}>
                Frequently Asked Questions
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#475569' }}>
                Answers to common questions about ThinqRx
              </p>
            </div>

            <FAQ limit={8} />

            <div className="mt-8 text-center">
              <p style={{ color: '#475569' }}>
                Need help?{" "}
                <a href="mailto:support@thinqrx.com" className="hover:underline font-medium" style={{ color: '#0F766E' }}>
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-white dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#0F172A' }}>
              Start Your GPAT Preparation
            </h2>
            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto" style={{ color: '#475569' }}>
              Create a free account to access AI-generated study material and practice tests
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-white px-8 py-6 text-lg rounded-lg border-0" style={{ backgroundColor: '#0F766E' }}>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-white px-8 py-6 text-lg rounded-lg border-0" style={{ backgroundColor: '#0F766E' }}>
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/pricing" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg rounded-lg border-2" style={{ borderColor: '#0F766E', color: '#0F766E' }}>
                      View Pricing
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12" style={{ borderColor: '#E5E7EB', backgroundColor: '#F8FAFC' }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* About */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#0F172A' }}>About ThinqRx</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                  ThinqRx is an AI-powered exam preparation platform for GPAT and other pharmacy entrance exams in India.
                </p>
              </div>

              {/* Links */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#0F172A' }}>Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/pricing" className="hover:underline" style={{ color: '#64748B' }}>
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:underline" style={{ color: '#64748B' }}>
                      About Us
                    </Link>
                  </li>
                  <li>
                    <a href="mailto:support@thinqrx.com" className="hover:underline" style={{ color: '#64748B' }}>
                      Contact Support
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#0F172A' }}>Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/privacy" className="hover:underline" style={{ color: '#64748B' }}>
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:underline" style={{ color: '#64748B' }}>
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund" className="hover:underline" style={{ color: '#64748B' }}>
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-center justify-center gap-6 mb-6 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: '#64748B' }}
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: '#64748B' }}
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: '#64748B' }}
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: '#64748B' }}
                aria-label="X (formerly Twitter)"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>

            {/* Copyright and Company */}
            <div className="text-center">
              <p className="text-sm mb-1" style={{ color: '#64748B' }}>
                © 2026 Thinqr (OPC) Pvt Ltd. All rights reserved.
              </p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Registered in India
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

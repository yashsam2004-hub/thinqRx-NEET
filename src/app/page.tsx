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

      <div className="min-h-screen bg-[#E6F4F2] dark:bg-[#0F172A]">
        <Navigation />

        {/* Hero Section with Real Pharmacology Images */}
        <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden bg-[#E6F4F2] dark:bg-[#0F172A]">
          {/* Background Image Carousel */}
          <div className="absolute inset-0 opacity-15 dark:opacity-[0.08] pointer-events-none">
            <div className="animate-scroll flex gap-0 h-full">
              <div className="flex-shrink-0 w-screen h-full relative">
                <img
                  src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-shrink-0 w-screen h-full relative">
                <img
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-shrink-0 w-screen h-full relative">
                <img
                  src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-shrink-0 w-screen h-full relative">
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-shrink-0 w-screen h-full relative">
                <img
                  src="https://images.unsplash.com/photo-1584362917165-526a968579e8?w=1200&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Duplicate for seamless loop */}
              <div className="flex-shrink-0 w-screen h-full relative">
                <img
                  src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-6 relative z-10">
            <div className="text-center">
              {/* Logo */}
              <div className="mx-auto mb-12 flex items-center justify-center">
                <Image
                  src="/images/Thinqr_logo.png"
                  alt="ThinqRx Logo"
                  width={480}
                  height={360}
                  priority
                  className="object-contain h-64 w-auto"
                />
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-slate-900 dark:text-slate-100">
                AI-Powered Study Platform for<br />
                <span className="text-[#0F766E] dark:text-teal-400">GPAT Exam Preparation</span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed text-slate-600 dark:text-slate-300">
                ThinqRx helps pharmacy students prepare for GPAT with AI-generated study notes, practice questions, and performance tracking.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-white px-8 py-6 text-lg rounded-lg border-0 bg-[#0F766E] hover:bg-[#115E59]">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-white px-8 py-6 text-lg rounded-lg border-0 bg-[#0F766E] hover:bg-[#115E59]">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link href="#how-it-works" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg rounded-lg border-2 border-[#0F766E] text-[#0F766E] dark:text-teal-400 dark:border-teal-400 bg-transparent">
                    How It Works
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What ThinqRx Does Section */}
        <section className="py-16 md:py-20 bg-[#E6F4F2] dark:bg-[#0F172A]">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                What ThinqRx Does
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
                A web application designed to help you prepare for the GPAT exam
              </p>
            </div>

            <Card className="p-8 md:p-10 bg-white dark:bg-slate-800/50 border-2 rounded-2xl border-[#E5E7EB] dark:border-slate-700 shadow-sm">
              <ul className="space-y-8">
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg mt-1 bg-[#E6F4F2] dark:bg-teal-950/50">
                    <CheckCircle2 className="h-5 w-5 text-[#0F766E] dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">AI-Generated Study Notes</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Creates topic-wise notes using AI, organized by subject according to the PCI syllabus for GPAT.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg mt-1 bg-[#E6F4F2] dark:bg-teal-950/50">
                    <CheckCircle2 className="h-5 w-5 text-[#0F766E] dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Practice Tests and Questions</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Offers multiple-choice questions and full-length mock tests to practice exam patterns.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg mt-1 bg-[#E6F4F2] dark:bg-teal-950/50">
                    <CheckCircle2 className="h-5 w-5 text-[#0F766E] dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Answer Explanations</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Provides detailed explanations for each question to help you understand concepts.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg mt-1 bg-[#E6F4F2] dark:bg-teal-950/50">
                    <CheckCircle2 className="h-5 w-5 text-[#0F766E] dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Performance Analytics</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Tracks your test scores and identifies areas where you need more practice.
                    </p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-20 bg-[#E6F4F2] dark:bg-[#0F172A]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                Features
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
                Study material, practice tests, and analytics for GPAT preparation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Study Material Card */}
              <Card className="flex flex-col p-8 bg-white dark:bg-slate-800/50 border-2 rounded-2xl border-[#E5E7EB] dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl mb-6 bg-[#E6F4F2] dark:bg-teal-950/50">
                    <BookOpen className="h-10 w-10 text-[#0F766E] dark:text-teal-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                    Study Material
                  </h3>
                  <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    AI-generated notes covering all four GPAT subjects, aligned with the PCI syllabus
                  </p>
                </div>

                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Covers Pharmaceutics, Pharmaceutical Chemistry, Pharmacology, and Pharmacognosy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Organized by topics for easy navigation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Includes chemical structures and diagrams where relevant</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Based on PCI-approved syllabus</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <Link href="/subjects">
                    <Button className="w-full text-white border-0 py-5 rounded-xl bg-[#0F766E] hover:bg-[#115E59]">
                      View Study Material
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Practice Tests Card */}
              <Card className="flex flex-col p-8 bg-white dark:bg-slate-800/50 border-2 rounded-2xl border-[#E5E7EB] dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl mb-6 bg-[#FEF3E7] dark:bg-amber-950/50">
                    <ClipboardList className="h-10 w-10 text-[#F4C430] dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                    Practice Tests
                  </h3>
                  <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    Full-length practice tests designed according to GPAT exam format
                  </p>
                </div>

                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">125 multiple-choice questions per test</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Computer-based test interface</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Answer explanations provided after submission</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Subject-wise score breakdowns</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <Link href="/mock-tests">
                    <Button className="w-full text-white border-0 py-5 rounded-xl bg-[#0F766E] hover:bg-[#115E59]">
                      View Practice Tests
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Analytics Card */}
              <Card className="flex flex-col p-8 bg-white dark:bg-slate-800/50 border-2 rounded-2xl border-[#E5E7EB] dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-xl mb-6 bg-[#E6F4F2] dark:bg-teal-950/50">
                    <BarChart3 className="h-10 w-10 text-[#0F766E] dark:text-teal-400" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                    Performance Tracking
                  </h3>
                  <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    Track your test scores and identify topics that need more practice
                  </p>
                </div>

                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">View your test history and scores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">See which subjects you score better in</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Track your progress over time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#0F766E] dark:text-teal-400" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Identify weak areas for focused study</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <Link href="/analytics">
                    <Button className="w-full text-white border-0 py-5 rounded-xl bg-[#0F766E] hover:bg-[#115E59]">
                      View Analytics
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-20 bg-[#E6F4F2] dark:bg-[#0F172A]">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                How It Works
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
                Three simple steps to start your GPAT preparation
              </p>
            </div>

            <div className="space-y-6">
              <Card className="p-6 md:p-8 border-2 rounded-2xl bg-white dark:bg-slate-800/50 border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-bold bg-[#0F766E]">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                      Create a free account
                    </h3>
                    <p className="text-base text-slate-600 dark:text-slate-300">
                      Sign up with your email address. Choose a free plan to start, or select a paid plan for full access to all features.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8 border-2 rounded-2xl bg-white dark:bg-slate-800/50 border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-bold bg-[#0F766E]">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                      Access study material and tests
                    </h3>
                    <p className="text-base text-slate-600 dark:text-slate-300">
                      Browse subjects, read AI-generated notes, and take practice tests. Answer explanations help you learn from mistakes.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8 border-2 rounded-2xl bg-white dark:bg-slate-800/50 border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-bold bg-[#0F766E]">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                      Track your progress
                    </h3>
                    <p className="text-base text-slate-600 dark:text-slate-300">
                      Check your analytics dashboard to see scores, identify weak topics, and focus your study time where it's needed most.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section className="py-16 md:py-20 bg-[#E6F4F2] dark:bg-[#0F172A]">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                Who Is ThinqRx For?
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
                This platform is designed for students preparing for pharmacy entrance exams
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-2 rounded-2xl bg-white dark:bg-slate-800/50 border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  GPAT Aspirants
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Students preparing for the Graduate Pharmacy Aptitude Test (GPAT) conducted by NTA.
                </p>
              </Card>

              <Card className="p-6 border-2 rounded-2xl bg-white dark:bg-slate-800/50 border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  Pharmacy Students
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  B.Pharm and M.Pharm students who want to review core pharmacy subjects systematically.
                </p>
              </Card>

              <Card className="p-6 border-2 rounded-2xl bg-white dark:bg-slate-800/50 border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  Self-Study Learners
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Individuals who prefer studying at their own pace with structured material and practice questions.
                </p>
              </Card>

              <Card className="p-6 border-2 rounded-2xl bg-white dark:bg-slate-800/50 border-[#E5E7EB] dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  Working Professionals
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-300">
                  Pharmacy professionals preparing for competitive exams while managing other commitments.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-20 bg-[#E6F4F2] dark:bg-[#0F172A]">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                Frequently Asked Questions
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
                Answers to common questions about ThinqRx
              </p>
            </div>

            <FAQ limit={8} />

            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-300">
                Need help?{" "}
                <a href="mailto:info@thinqrx.in" className="hover:underline font-medium text-[#0F766E] dark:text-teal-400">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-[#E6F4F2] dark:bg-[#0F172A]">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-slate-100">
              Start Your GPAT Preparation
            </h2>
            <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto text-slate-600 dark:text-slate-300">
              Create a free account to access AI-generated study material and practice tests
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-white px-8 py-6 text-lg rounded-lg border-0 bg-[#0F766E] hover:bg-[#115E59]">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto text-white px-8 py-6 text-lg rounded-lg border-0 bg-[#0F766E] hover:bg-[#115E59]">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/pricing" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg rounded-lg border-2 border-[#0F766E] text-[#0F766E] dark:text-teal-400 dark:border-teal-400 bg-transparent">
                      View Pricing
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12 bg-[#E6F4F2] dark:bg-[#0F172A] border-[#E5E7EB] dark:border-slate-700">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* About */}
              <div>
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">About ThinqRx</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  ThinqRx is an AI-powered exam preparation platform for GPAT and other pharmacy entrance exams in India.
                </p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Contact Us</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="mailto:info@thinqrx.in" className="hover:underline text-slate-500 dark:text-slate-400">
                      info@thinqrx.in
                    </a>
                  </li>
                  <li>
                    <Link href="/pricing" className="hover:underline text-slate-500 dark:text-slate-400">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:underline text-slate-500 dark:text-slate-400">
                      About Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/privacy" className="hover:underline text-slate-500 dark:text-slate-400">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:underline text-slate-500 dark:text-slate-400">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund" className="hover:underline text-slate-500 dark:text-slate-400">
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-center justify-center gap-6 mb-6 pt-6 border-t border-[#E5E7EB] dark:border-slate-700">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="X (formerly Twitter)">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>

            {/* Copyright and Company */}
            <div className="text-center">
              <p className="text-sm mb-1 text-slate-500 dark:text-slate-400">
                &copy; 2026 Thinqr (OPC) Pvt Ltd. All rights reserved.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registered in India
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

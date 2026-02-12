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

      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navigation />

        {/* Hero Section with Background Carousel */}
        <section className="relative overflow-hidden py-20 lg:py-32 min-h-[600px]">
          {/* Background Carousel */}
          <div className="absolute inset-0 z-0">
            <div className="flex animate-scroll h-full">
              {/* First set of images */}
              <div className="relative w-1/3 h-full flex-shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1200&q=80"
                  alt="Pharmacy student studying"
                  fill
                  className="object-cover"
                  unoptimized
                  style={{ opacity: 0.45 }}
                />
              </div>
              <div className="relative w-1/3 h-full flex-shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80"
                  alt="Medical research and pharmacy"
                  fill
                  className="object-cover"
                  unoptimized
                  style={{ opacity: 0.45 }}
                />
              </div>
              <div className="relative w-1/3 h-full flex-shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80"
                  alt="Pharmacy and medicine"
                  fill
                  className="object-cover"
                  unoptimized
                  style={{ opacity: 0.45 }}
                />
              </div>
              {/* Duplicate for seamless loop */}
              <div className="relative w-1/3 h-full flex-shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1200&q=80"
                  alt="Pharmacy student studying"
                  fill
                  className="object-cover"
                  unoptimized
                  style={{ opacity: 0.45 }}
                />
              </div>
              <div className="relative w-1/3 h-full flex-shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80"
                  alt="Medical research and pharmacy"
                  fill
                  className="object-cover"
                  unoptimized
                  style={{ opacity: 0.45 }}
                />
              </div>
              <div className="relative w-1/3 h-full flex-shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80"
                  alt="Pharmacy and medicine"
                  fill
                  className="object-cover"
                  unoptimized
                  style={{ opacity: 0.45 }}
                />
              </div>
            </div>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/70 via-white/60 to-amber-50/70 dark:from-teal-950/70 dark:via-slate-950/60 dark:to-amber-950/70"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="text-center">
              {/* Logo with animation */}
              <div className="mx-auto mb-10 flex items-center justify-center animate-fade-in">
                <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-2xl">
                  <Image
                    src="/images/Thinqr_logo.png"
                    alt="ThinqRx Logo"
                    width={280}
                    height={220}
                    priority
                    className="object-contain h-44 w-auto"
                  />
                </div>
              </div>

              {/* Main Heading - Clear and Factual */}
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-8 leading-tight">
                AI-Powered Study Platform for<br />
                <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-sky-500 dark:from-teal-400 dark:via-teal-300 dark:to-sky-400 bg-clip-text text-transparent">GPAT Exam Preparation</span>
              </h1>

              {/* Subheading - Factual Description */}
              <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
                ThinqRx helps pharmacy students prepare for GPAT with AI-generated study notes, practice questions, and performance tracking.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white px-10 py-7 text-xl shadow-2xl border-0 transform hover:scale-105 transition-all">
                      Go to Dashboard
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button size="lg" className="bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white px-10 py-7 text-xl shadow-2xl border-0 transform hover:scale-105 transition-all">
                      Get Started Free
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </Button>
                  </Link>
                )}
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline" className="border-2 border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30 px-10 py-7 text-xl transform hover:scale-105 transition-all">
                    How It Works
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What ThinqRx Does Section */}
        <section className="py-20 bg-gradient-to-br from-teal-50/30 via-white to-sky-50/30 dark:from-teal-950/20 dark:via-slate-950 dark:to-sky-950/20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                What ThinqRx Does
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                A web application designed to help you prepare for the GPAT exam
              </p>
            </div>

            <Card className="p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700">
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/50 mt-1">
                    <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">AI-Generated Study Notes</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Creates topic-wise notes using AI, organized by subject according to the PCI syllabus for GPAT.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/50 mt-1">
                    <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Practice Tests and Questions</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Offers multiple-choice questions and full-length mock tests to practice exam patterns.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/50 mt-1">
                    <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Answer Explanations</h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Provides detailed explanations for each question to help you understand concepts.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/50 mt-1">
                    <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Performance Analytics</h3>
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
        <section id="features" className="py-24 bg-white dark:bg-slate-950">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                Features
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Study material, practice tests, and analytics for GPAT preparation
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {/* Study Material Card - Enhanced */}
              <Card className="p-10 hover:shadow-2xl transition-all duration-300 border-2 border-teal-100 dark:border-teal-900 dark:bg-slate-900 transform hover:-translate-y-2 group">
                <div className="mb-8">
                  <div className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 mb-6 shadow-xl group-hover:scale-110 transition-transform">
                    <BookOpen className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Study Material
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
                    AI-generated notes covering all four GPAT subjects, aligned with the PCI syllabus
                  </p>
                </div>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Covers Pharmaceutics, Pharmaceutical Chemistry, Pharmacology, and Pharmacognosy</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Organized by topics for easy navigation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Includes chemical structures and diagrams where relevant</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Based on PCI-approved syllabus</span>
                  </li>
                </ul>

                <Link href="/subjects">
                  <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white border-0 py-6 text-base shadow-lg hover:shadow-xl transition-all">
                    View Study Material
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </Card>

              {/* Mock Tests Card - Enhanced */}
              <Card className="p-10 hover:shadow-2xl transition-all duration-300 border-2 border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50/30 to-white dark:from-amber-950/30 dark:to-slate-900 transform hover:-translate-y-2 group">
                <div className="mb-8">
                  <div className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 mb-6 shadow-xl group-hover:scale-110 transition-transform">
                    <ClipboardList className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Practice Tests
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
                    Full-length practice tests designed according to GPAT exam format
                  </p>
                </div>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">125 multiple-choice questions per test</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Computer-based test interface</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Answer explanations provided after submission</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Subject-wise score breakdowns</span>
                  </li>
                </ul>

                <Link href="/mock-tests">
                  <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white border-0 py-6 text-base shadow-lg hover:shadow-xl transition-all">
                    View Practice Tests
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </Card>

              {/* Analytics Card - Enhanced */}
              <Card className="p-10 hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 dark:border-blue-900 dark:bg-slate-900 transform hover:-translate-y-2 group">
                <div className="mb-8">
                  <div className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 mb-6 shadow-xl group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                    Performance Tracking
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
                    Track your test scores and identify topics that need more practice
                  </p>
                </div>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">View your test history and scores</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">See which subjects you score better in</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Track your progress over time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Identify weak areas for focused study</span>
                  </li>
                </ul>

                <Link href="/analytics">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border-0 py-6 text-base shadow-lg hover:shadow-xl transition-all">
                    View Analytics
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-gradient-to-br from-teal-50/30 via-white to-sky-50/30 dark:from-teal-950/20 dark:via-slate-950 dark:to-sky-950/20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Three simple steps to start your GPAT preparation
              </p>
            </div>

            <div className="space-y-8">
              <Card className="p-8 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-500 text-white text-xl font-bold shadow-lg">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Create a free account
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Sign up with your email address. Choose a free plan to start, or select a paid plan for full access to all features.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-500 text-white text-xl font-bold shadow-lg">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Access study material and tests
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Browse subjects, read AI-generated notes, and take practice tests. Answer explanations help you learn from mistakes.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-500 text-white text-xl font-bold shadow-lg">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Track your progress
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Check your analytics dashboard to see scores, identify weak topics, and focus your study time where it's needed most.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Who Is ThinqRx For?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                This platform is designed for students preparing for pharmacy entrance exams
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  GPAT Aspirants
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Students preparing for the Graduate Pharmacy Aptitude Test (GPAT) conducted by NTA.
                </p>
              </Card>

              <Card className="p-6 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Pharmacy Students
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  B.Pharm and M.Pharm students who want to review core pharmacy subjects systematically.
                </p>
              </Card>

              <Card className="p-6 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Self-Study Learners
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Individuals who prefer studying at their own pace with structured material and practice questions.
                </p>
              </Card>

              <Card className="p-6 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  Working Professionals
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Pharmacy professionals preparing for competitive exams while managing other commitments.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Overview Section */}
        <section className="py-20 bg-gradient-to-br from-teal-50/30 via-white to-sky-50/30 dark:from-teal-950/20 dark:via-slate-950 dark:to-sky-950/20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Pricing
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Choose a plan that works for your preparation needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Free</h3>
                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-4">₹0</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Limited access to study material and features</p>
                <Link href="/signup">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white border-0">
                    Get Started
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 border-2 border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Plus</h3>
                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-1">₹199<span className="text-base font-normal">/month</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">More practice tests and features. Annual option available.</p>
                <Link href="/pricing">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white border-0">
                    View Details
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pro</h3>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">₹299<span className="text-base font-normal">/month</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Full access to all features. Annual option available.</p>
                <Link href="/pricing">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white border-0">
                    View Details
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Answers to common questions about ThinqRx
              </p>
            </div>

            <FAQ limit={8} />

            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-300">
                Need help?{" "}
                <a href="mailto:support@thinqrx.com" className="text-teal-600 dark:text-teal-400 hover:underline font-medium">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-teal-600 via-teal-500 to-teal-600">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Start Your GPAT Preparation
            </h2>
            <p className="text-xl text-teal-50 mb-10 leading-relaxed">
              Create a free account to access AI-generated study material and practice tests
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-teal-600 hover:bg-teal-50 px-8 py-6 text-lg shadow-xl">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup">
                    <Button size="lg" className="bg-white text-teal-600 hover:bg-teal-50 px-8 py-6 text-lg shadow-xl">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                      View Pricing
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* About */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">About ThinqRx</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  ThinqRx is an AI-powered exam preparation platform for GPAT and other pharmacy entrance exams in India.
                </p>
              </div>

              {/* Links */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/pricing" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <a href="mailto:support@thinqrx.com" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400">
                      Contact Support
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400">
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-center justify-center gap-6 mb-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
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
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                © 2026 Thinqr (OPC) Pvt Ltd. All rights reserved.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Registered in India
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

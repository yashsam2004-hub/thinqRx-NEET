"use client";

import { Navigation } from "@/components/Navigation";
import { StructuredData } from "@/components/StructuredData";
import { FAQ } from "@/components/FAQ";
import { getCourseSchema, getBreadcrumbSchema, getFAQSchema } from "@/lib/seo/structured-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PLATFORM } from "@/config/platform";
import { FAQ_DATA } from "@/config/faq";
import { useAuth } from "@/contexts/AuthContext";
import { useCourse } from "@/contexts/CourseContext";
import {
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Users,
  Zap,
  Clock,
  Brain,
  Award,
  ArrowRight,
  Lock,
  GraduationCap,
} from "lucide-react";

export default function GPATLandingPage() {
  const { user } = useAuth();
  const { enrollment } = useCourse();
  
  const hasAccess = !!enrollment && enrollment.status === "active" && enrollment.plan !== "free";
  const userPlan = enrollment?.plan || "free";

  // SEO Breadcrumb
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "GPAT", url: "/gpat" },
  ]);

  // Course structured data
  const courseSchema = getCourseSchema(
    "GPAT - Graduate Pharmacy Aptitude Test Preparation",
    "Comprehensive GPAT preparation with AI-powered notes, mock tests, and performance analytics. Master pharmaceutical sciences for M.Pharm entrance.",
    "/gpat"
  );

  // FAQ structured data
  const gpatFAQs = FAQ_DATA.filter((faq) => faq.category === "gpat" || faq.category === "general");
  const faqSchema = getFAQSchema(gpatFAQs);

  const subjects = [
    {
      name: "Medicinal Chemistry",
      topics: 45,
      icon: Sparkles,
      description: "Drug design, SAR, and pharmaceutical chemistry",
    },
    {
      name: "Pharmacology",
      topics: 52,
      icon: Brain,
      description: "Drug mechanisms, toxicology, and therapeutics",
    },
    {
      name: "Pharmaceutics",
      topics: 38,
      icon: Target,
      description: "Dosage forms, NDDS, and biopharmaceutics",
    },
    {
      name: "Pharmacognosy",
      topics: 35,
      icon: BookOpen,
      description: "Natural products, phytochemistry, and herbal drugs",
    },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Notes",
      description: "Quick revision notes and exam-focused summaries for efficient preparation",
      badge: "Plus & Pro",
    },
    {
      icon: Target,
      title: "Full Mock Tests",
      description: "125 MCQs GPAT pattern tests with detailed performance analytics",
      badge: "Pro Only",
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Detailed insights into your strengths, weaknesses, and improvement areas",
      badge: "Pro Only",
    },
  ];

  return (
    <>
      <StructuredData data={[breadcrumbSchema, courseSchema, faqSchema]} />

      <div className="min-h-screen gradient-sky-radial">
        <Navigation />

        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge className="mb-4 bg-sky-100 text-sky-700 hover:bg-sky-200">
                GPAT Preparation
              </Badge>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Master GPAT with<br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI-Powered Preparation
                </span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Comprehensive preparation for <strong>Graduate Pharmacy Aptitude Test (GPAT)</strong> 
                with personalized study notes, adaptive mock tests, and performance analytics designed 
                for pharmacy graduates across India.
              </p>

              {/* Key Stats */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">125</div>
                  <div className="text-sm text-slate-600">MCQs Pattern</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">170+</div>
                  <div className="text-sm text-slate-600">Topics Covered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">3 Hours</div>
                  <div className="text-sm text-slate-600">Exam Duration</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                {user ? (
                  hasAccess ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="gradient-sky-button text-white border-0 w-full sm:w-auto">
                        Access Your Course
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/pricing">
                      <Button size="lg" className="gradient-sky-button text-white border-0 w-full sm:w-auto">
                        Enroll Now
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="gradient-sky-button text-white border-0 w-full sm:w-auto">
                        Start Free Trial
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto">
                        Login
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Feature Highlights Card */}
            <Card className="p-8 bg-white shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                What You'll Get
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">Complete Syllabus Coverage</div>
                    <div className="text-sm text-slate-600">All 4 subjects with 170+ topics</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">AI-Powered Study Notes</div>
                    <div className="text-sm text-slate-600">Personalized, comprehensive, exam-focused</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">Topic-wise Mock Tests</div>
                    <div className="text-sm text-slate-600">Practice with 125 MCQs pattern</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">Performance Analytics</div>
                    <div className="text-sm text-slate-600">Track progress & identify weak areas</div>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Subjects Section */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">
                GPAT Subjects We Cover
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Comprehensive coverage of all pharmaceutical sciences
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {subjects.map((subject) => {
                const SubjectIcon = subject.icon;
                return (
                  <Card key={subject.name} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg">
                      <SubjectIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      {subject.name}
                    </h3>
                    <div className="mt-2 text-sm text-blue-600 font-medium">
                      {subject.topics} Topics
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {subject.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">
                Smart Features for Smart Preparation
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                AI-powered tools to maximize your GPAT score
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {features.map((feature) => {
                const FeatureIcon = feature.icon;
                return (
                  <Card key={feature.title} className="p-8 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                        <FeatureIcon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-slate-600">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">
                GPAT Preparation FAQs
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Common questions about GPAT and exam preparation
              </p>
            </div>

            <FAQ category="gpat" />
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center text-white">
              <h2 className="text-3xl font-bold">
                Ready to Start Your GPAT Preparation?
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                Join thousands of pharmacy students preparing smarter with {PLATFORM.brand}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  hasAccess ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="bg-white text-sky-600 hover:bg-sky-50 shadow-xl">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/pricing">
                      <Button size="lg" className="bg-white text-sky-600 hover:bg-sky-50 shadow-xl">
                        View Pricing Plans
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  )
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="bg-white text-sky-600 hover:bg-sky-50 shadow-xl">
                        Start Free Trial
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/pricing">
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                        See Plans
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}

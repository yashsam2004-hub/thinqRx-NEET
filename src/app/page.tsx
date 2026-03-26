"use client";

import { Navigation } from "@/components/Navigation";
import { StructuredData } from "@/components/StructuredData";
import { FAQ } from "@/components/FAQ";
import { getOrganizationSchema, getWebPageSchema, getFAQSchema } from "@/lib/seo/structured-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  // ✅ SEO OPTIMIZED META
  const organizationSchema = getOrganizationSchema();
  const webPageSchema = getWebPageSchema(
    "SynoRx NEET – AI-Powered NEET Preparation Platform with Mock Tests",
    "SynoRx NEET is an AI-powered NEET preparation platform offering mock tests, NCERT-based study material, and performance analysis to help students improve their NEET UG rank.",
    "/"
  );
  const faqSchema = getFAQSchema(FAQ_DATA.slice(0, 8));

  return (
    <>
      <StructuredData data={[organizationSchema, webPageSchema, faqSchema]} />

      <div className="min-h-screen bg-[#E6F4F2]">
        <Navigation />

        {/* HERO SECTION */}
        <section className="py-20 text-center">
          <div className="max-w-5xl mx-auto px-6">
            
            <Image
              src="/images/SynoRx-Logo.png"
              alt="SynoRx NEET Logo"
              width={250}
              height={120}
              className="mx-auto mb-8"
            />

            {/* ✅ SEO H1 */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI-Powered NEET Preparation Platform with Mock Tests & Performance Analysis
            </h1>

            {/* ✅ SEO PARAGRAPH */}
            <p className="text-lg max-w-3xl mx-auto mb-8 text-gray-600">
              SynoRx NEET is an AI-powered NEET preparation platform designed to help students prepare smarter with personalized performance analysis, full-length mock tests, and NCERT-based study materials. Identify weak areas, improve accuracy, and boost your NEET UG rank.
            </p>

            <div className="flex justify-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg">
                    Go to Dashboard <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button size="lg">
                    Start Free Mock Test <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* WHAT SECTION */}
        <section className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            What SynoRx NEET Does
          </h2>

          <p className="max-w-3xl mx-auto text-gray-600">
            SynoRx NEET is an intelligent NEET UG preparation platform that helps students improve their performance using AI-based analysis, mock tests, and personalized study recommendations based on the NCERT syllabus.
          </p>
        </section>

        {/* FEATURES */}
        <section className="py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">

            {/* Study */}
            <Card className="p-6">
              <BookOpen className="mb-4" />
              <h3 className="text-xl font-bold mb-2">Study Material</h3>
              <p>
                AI-generated NEET study notes covering Physics, Chemistry, and Biology based on NCERT syllabus. Structured topic-wise content helps students revise faster and improve conceptual clarity.
              </p>
            </Card>

            {/* Tests */}
            <Card className="p-6">
              <ClipboardList className="mb-4" />
              <h3 className="text-xl font-bold mb-2">Practice Tests</h3>
              <p>
                Full-length NEET mock tests with real exam pattern, negative marking, and time-based simulation to help students practice effectively and improve exam performance.
              </p>
            </Card>

            {/* Analytics */}
            <Card className="p-6">
              <BarChart3 className="mb-4" />
              <h3 className="text-xl font-bold mb-2">Performance Tracking</h3>
              <p>
                Track your NEET preparation progress with detailed analytics. Identify weak areas, monitor improvement, and focus on topics that need more practice.
              </p>
            </Card>

          </div>
        </section>

        {/* WHY SECTION */}
        <section className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Why Choose SynoRx NEET?
          </h2>

          <p className="max-w-3xl mx-auto text-gray-600">
            SynoRx NEET is an advanced AI-powered NEET preparation platform that provides personalized learning, smart performance tracking, and real exam-level mock tests. Unlike traditional methods, it focuses on identifying weak areas and improving accuracy through data-driven preparation strategies.
          </p>
        </section>

        {/* WHO FOR */}
        <section className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Who Is This For?
          </h2>

          <p className="max-w-3xl mx-auto text-gray-600">
            SynoRx NEET is designed for NEET UG aspirants who want a smart, structured, and AI-driven preparation strategy to improve their exam performance.
          </p>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-6">
              Frequently Asked Questions
            </h2>
            <FAQ limit={8} />
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Your NEET Preparation Today
          </h2>

          <p className="mb-6 text-gray-600">
            Practice mock tests, analyze performance, and improve your NEET rank with AI-powered insights.
          </p>

          <Link href="/signup">
            <Button size="lg">
              Get Started Free
            </Button>
          </Link>
        </section>

      </div>
    </>
  );
}
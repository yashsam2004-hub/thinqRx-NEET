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
  Award,
  Shield,
  Zap,
  Users,
  ChevronLeft,
  ChevronRight,
  Star,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);
  
  // Structured Data for SEO/AEO
  const organizationSchema = getOrganizationSchema();
  const webPageSchema = getWebPageSchema(
    `${PLATFORM.brand} - GPAT Preparation Platform`,
    `India's leading AI-powered platform for GPAT exam preparation. Trusted by pharmacy students across India.`,
    "/"
  );
  const faqSchema = getFAQSchema(FAQ_DATA.slice(0, 8));

  // Testimonials data
  const testimonials = [
    {
      name: "Priya S.",
      text: "ThinqRx was a game-changer for my GPAT preparation! The AI-powered notes and mock tests helped me score in the top percentile. I couldn't have done it without this platform!",
      rating: 5,
    },
    {
      name: "Rahul M.",
      text: "The comprehensive analytics feature helped me identify my weak areas and improve systematically. The mock tests are exactly like the real GPAT exam. Highly recommended!",
      rating: 5,
    },
    {
      name: "Anjali K.",
      text: "Best GPAT preparation platform in India! The subject-wise breakdown and personalized study plans made my preparation efficient. Thank you ThinqRx!",
      rating: 5,
    },
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

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

              {/* Main Heading with enhanced styling */}
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-slate-100 mb-8 leading-tight">
                Your Trusted Resource for<br />
                <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-sky-500 dark:from-teal-400 dark:via-teal-300 dark:to-sky-400 bg-clip-text text-transparent animate-gradient-x">GPAT Preparation</span>
              </h1>

              {/* Subheading with better spacing */}
              <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
                India's #1 AI-powered preparation platform trusted by top pharmacy students. Master GPAT with comprehensive study material, practice tests, and intelligent analytics.
              </p>

              {/* Enhanced CTA Buttons */}
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
                      Start Free Preparation
                      <ArrowRight className="ml-3 h-6 w-6" />
                    </Button>
                  </Link>
                )}
                <Link href="#features">
                  <Button size="lg" variant="outline" className="border-2 border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30 px-10 py-7 text-xl transform hover:scale-105 transition-all">
                    Learn More
                  </Button>
                </Link>
              </div>

              {/* Enhanced Trust Indicator */}
              <div className="mt-12 inline-flex items-center gap-3 px-8 py-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-full border-2 border-teal-200 dark:border-teal-800 shadow-lg">
                <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                <p className="text-slate-700 dark:text-slate-200 text-lg">
                  Trusted by <strong className="text-teal-600 dark:text-teal-400">5,000+ pharmacy students</strong> across India
                </p>
                <Award className="h-6 w-6 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section - Enhanced */}
        <section className="py-20 bg-gradient-to-br from-teal-50/50 via-white to-sky-50/50 dark:from-teal-950/30 dark:via-slate-950 dark:to-sky-950/30">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-12">
              <Badge className="bg-gradient-to-r from-teal-100 to-sky-100 dark:from-teal-950/50 dark:to-sky-950/50 text-teal-700 dark:text-teal-300 border-0 text-sm px-4 py-1 mb-4">
                Student Success Stories
              </Badge>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Loved by Students Across India
              </h2>
            </div>
            
            <div className="relative">
              <Card className="p-12 bg-white dark:bg-slate-900 shadow-2xl border-2 border-teal-100 dark:border-teal-900 hover:shadow-3xl transition-all">
                {/* Rating Stars */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-7 w-7 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <blockquote className="text-xl text-slate-700 dark:text-slate-300 text-center mb-8 leading-relaxed italic font-medium">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>

                {/* Author */}
                <p className="text-center text-teal-600 dark:text-teal-400 font-bold text-lg">
                  — {testimonials[currentTestimonial].name}
                </p>

                {/* Navigation Arrows */}
                <div className="flex items-center justify-center gap-6 mt-10">
                  <button
                    onClick={prevTestimonial}
                    className="p-3 rounded-full bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900 transition-all shadow-md"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </button>
                  <div className="flex gap-3">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTestimonial(index)}
                        className={`h-3 w-3 rounded-full transition-all ${
                          index === currentTestimonial 
                            ? "bg-teal-600 dark:bg-teal-400 w-8" 
                            : "bg-slate-300 dark:bg-slate-600 hover:bg-teal-400"
                        }`}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={nextTestimonial}
                    className="p-3 rounded-full bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900 transition-all shadow-md"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* What We Offer Section - Enhanced */}
        <section id="features" className="py-24 bg-white dark:bg-slate-950">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-20">
              <Badge className="bg-gradient-to-r from-teal-100 to-sky-100 dark:from-teal-950/50 dark:to-sky-950/50 text-teal-700 dark:text-teal-300 border-0 text-sm px-4 py-1 mb-4">
                Complete Preparation Platform
              </Badge>
              <h2 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                What We Offer
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                Everything you need to crack GPAT exam in one comprehensive, AI-powered platform
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
                    AI-Powered Study Material
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
                    Comprehensive notes aligned with PCI syllabus, generated and organized by AI for efficient learning
                  </p>
                </div>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">All 4 GPAT subjects covered comprehensively</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Topic-wise organized content with visual aids</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Chemical structures and diagrams included</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Quick revision guides for last-minute prep</span>
                  </li>
                </ul>

                <Link href="/subjects">
                  <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white border-0 py-6 text-base shadow-lg hover:shadow-xl transition-all">
                    Explore Study Material
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
                    GPAT-Pattern Mock Tests
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
                    Practice with full-length CBT-style mock tests that mirror the actual GPAT exam experience
                  </p>
                </div>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">125 MCQs • 3 hours • +4/-1 marking scheme</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Computer-based test interface simulation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Detailed answer explanations for every question</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Subject-wise and difficulty-wise breakdown</span>
                  </li>
                </ul>

                <Link href="/mock-tests">
                  <Button className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white border-0 py-6 text-base shadow-lg hover:shadow-xl transition-all">
                    Explore Mock Tests
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
                    Performance Analytics
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
                    Track your preparation progress with AI-powered insights and personalized improvement plans
                  </p>
                </div>

                <ul className="space-y-4 mb-10">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Comprehensive performance tracking and trends</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Subject-wise strength and weakness analysis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Personalized study recommendations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-base">Mock test performance reports and insights</span>
                  </li>
                </ul>

                <Link href="/analytics">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border-0 py-6 text-base shadow-lg hover:shadow-xl transition-all">
                    Explore Analytics
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gradient-to-br from-teal-50/30 via-white to-amber-50/30 dark:from-teal-950/30 dark:via-slate-950 dark:to-amber-950/30">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Why Choose ThinqRx?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                India's most trusted GPAT preparation platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* Trust Indicator */}
              <div className="text-center">
                <div className="inline-flex p-4 rounded-2xl bg-amber-100 dark:bg-amber-950 mb-4">
                  <Award className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  Trusted by Thousands
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  5,000+ pharmacy students across India trust ThinqRx for their GPAT preparation
                </p>
              </div>

              {/* Content Experts */}
              <div className="text-center">
                <div className="inline-flex p-4 rounded-2xl bg-teal-100 dark:bg-teal-950 mb-4">
                  <Shield className="h-10 w-10 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  PCI-Aligned Content
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Our content is accurate, up-to-date, and aligned with the latest PCI syllabus and GPAT pattern
                </p>
              </div>

              {/* AI-Powered */}
              <div className="text-center">
                <div className="inline-flex p-4 rounded-2xl bg-amber-100 dark:bg-amber-950 mb-4">
                  <Zap className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  AI-Powered Learning
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Smart recommendations and personalized study plans powered by artificial intelligence
                </p>
              </div>

              {/* Comprehensive */}
              <div className="text-center">
                <div className="inline-flex p-4 rounded-2xl bg-teal-100 dark:bg-teal-950 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  Complete Preparation
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Everything you need in one place - notes, tests, and analytics for complete GPAT preparation
                </p>
              </div>
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
                Common questions about GPAT preparation and ThinqRx
              </p>
            </div>

            <FAQ limit={8} />

            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-300">
                Have more questions?{" "}
                <Link href="/about" className="text-teal-600 dark:text-teal-400 hover:underline font-medium">
                  Contact our support team
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-teal-600 via-teal-500 to-teal-600">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Crack GPAT Exam?
            </h2>
            <p className="text-xl text-teal-50 mb-10 leading-relaxed">
              Join 5,000+ pharmacy students across India preparing with ThinqRx's AI-powered platform
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
                      Start Free Preparation
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" className="bg-white text-teal-600 hover:bg-white/90 px-8 py-6 text-lg shadow-xl font-semibold">
                      View Pricing Plans
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50/30 via-white to-amber-50/30 dark:from-teal-950/30 dark:via-slate-950 dark:to-amber-950/30 py-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center justify-center gap-6">
              {/* Social Media Icons */}
              <div className="flex items-center gap-6">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-6 w-6" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-6 w-6" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
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

              {/* Copyright */}
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © 2026 Thinqr (OPC) Pvt Ltd. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

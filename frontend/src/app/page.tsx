"use client";

import Link from "next/link";
import { Mic2, Brain, Headphones, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                PodcastAI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-transparent to-secondary-50 dark:from-primary-950/20 dark:via-transparent dark:to-secondary-950/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/50 px-4 py-1.5 mb-8">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Powered by Advanced AI
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              Create Professional{" "}
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Podcasts
              </span>{" "}
              with AI
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto leading-relaxed">
              Generate compelling scripts, choose from realistic AI voices, and
              produce studio-quality audio — all from a single platform. No
              recording equipment needed.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-medium text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25 gap-2 w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-6 py-3 text-base font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors w-full sm:w-auto"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))]">
              Everything You Need to Create
            </h2>
            <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
              From script to final audio, our AI-powered tools handle every step
              of podcast production.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-3">
                AI Script Generation
              </h3>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                Generate engaging podcast scripts from just a topic. Choose your
                format — solo, interview, panel discussion — and let AI craft
                the perfect script with natural dialogue and pacing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 hover:border-secondary-300 dark:hover:border-secondary-700 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center mb-6">
                <Mic2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-3">
                Realistic Voice Models
              </h3>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                Choose from a library of natural-sounding AI voices. Customize
                speed, pitch, emotion, and style to match your podcast&apos;s tone
                perfectly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 hover:border-accent-300 dark:hover:border-accent-700 transition-all hover:shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mb-6">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-3">
                Full Audio Production
              </h3>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                Render your scripts into polished audio with text-to-speech
                synthesis. Preview in real-time, adjust timing, and export
                broadcast-ready episodes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
                <Mic2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">PodcastAI</span>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              &copy; 2026 PodcastAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

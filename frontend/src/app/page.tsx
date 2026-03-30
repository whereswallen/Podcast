"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mic2,
  Brain,
  Headphones,
  ArrowRight,
  Sparkles,
  Wand2,
  AudioWaveform,
  Shield,
  Globe,
  Layers,
  FileText,
  Zap,
  Check,
  Star,
  ChevronRight,
  Play,
  Users,
  Clock,
  Volume2,
} from "lucide-react";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { WordRotate } from "@/components/ui/word-rotate";
import { Particles } from "@/components/ui/particles";
import { cn } from "@/lib/utils";

/* ─────────────────── Data ─────────────────── */

const features = [
  {
    Icon: Brain,
    name: "AI Script Generation",
    description:
      "Generate compelling scripts from just a topic. Solo, interview, panel — AI crafts natural dialogue with perfect pacing.",
    href: "/register",
    cta: "Start writing",
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: Mic2,
    name: "50+ Realistic Voices",
    description:
      "Natural-sounding AI voices with customizable speed, pitch, emotion, and style controls.",
    href: "/register",
    cta: "Explore voices",
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: AudioWaveform,
    name: "Full Audio Studio",
    description:
      "Multi-track timeline with music, SFX, volume, pan, and mixing controls.",
    href: "/register",
    cta: "Open studio",
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: Wand2,
    name: "Voice Cloning",
    description:
      "Clone any voice with just 30 seconds of audio. Full consent verification workflow included.",
    href: "/register",
    cta: "Clone a voice",
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: Shield,
    name: "Fact-Check Engine",
    description:
      "Domain-aware AI fact-checking with severity scoring and publish gates for regulated content.",
    href: "/register",
    cta: "Learn more",
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
];

const steps = [
  {
    step: "01",
    title: "Pick a Topic",
    description:
      "Enter any topic, choose your format (solo, interview, panel), set the tone and target duration.",
    icon: FileText,
  },
  {
    step: "02",
    title: "AI Writes the Script",
    description:
      "Our AI generates a fully structured script with natural dialogue, transitions, and pacing.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Choose Voices & Produce",
    description:
      "Assign AI voices to speakers, add music and SFX, then render studio-quality audio instantly.",
    icon: Headphones,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Content Creator",
    body: "CastNode turned my blog posts into a weekly podcast in hours instead of days. The voice quality is incredible.",
    img: null,
  },
  {
    name: "Marcus Rivera",
    role: "Marketing Director",
    body: "We produce 4 branded podcasts a month now. Before CastNode, we couldn't even manage one.",
    img: null,
  },
  {
    name: "Dr. Aisha Patel",
    role: "Educator",
    body: "The fact-check engine gives me confidence that my educational content is accurate before publishing.",
    img: null,
  },
  {
    name: "Jake Thornton",
    role: "Indie Podcaster",
    body: "Voice cloning let me scale my solo show into a multi-host format. Game changer.",
    img: null,
  },
  {
    name: "Emily Larsson",
    role: "Podcast Network",
    body: "We onboarded 12 new shows in a single quarter using CastNode. The ROI is insane.",
    img: null,
  },
  {
    name: "David Kim",
    role: "Startup Founder",
    body: "CastNode is the missing piece for content teams who want to do audio but don't have the budget for a studio.",
    img: null,
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    credits: "50 credits/month",
    description: "Perfect for trying out AI podcasting",
    features: [
      "AI script generation",
      "10+ built-in voices",
      "Basic audio rendering",
      "Up to 3 episodes",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    credits: "500 credits/month",
    description: "For serious creators and small teams",
    features: [
      "Everything in Free",
      "50+ premium voices",
      "Voice cloning (3 voices)",
      "Full audio studio",
      "Show notes & SEO tools",
      "Fact-check engine",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "/month",
    credits: "2,000 credits/month",
    description: "For teams and podcast networks",
    features: [
      "Everything in Pro",
      "Unlimited voice clones",
      "1,000 credit rollover",
      "Brand profiles & knowledge base",
      "Multi-language translation",
      "Admin dashboard",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

/* ─────────────────── Review Card ─────────────────── */

function ReviewCard({
  name,
  role,
  body,
}: {
  name: string;
  role: string;
  body: string;
  img: string | null;
}) {
  return (
    <figure
      className={cn(
        "relative w-64 shrink-0 cursor-pointer overflow-hidden rounded-xl border p-4",
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 text-sm font-bold text-white">
          {name[0]}
        </div>
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-muted-foreground dark:text-white/40">
            {role}
          </p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm">{body}</blockquote>
    </figure>
  );
}

/* ─────────────────── Page ─────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[hsl(222,47%,5%)]">
      {/* ──── Navigation ──── */}
      <nav className="fixed top-0 z-50 w-full border-b border-black/5 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-[hsl(222,47%,5%)]/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-lg shadow-primary-500/25">
              <Mic2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              CastNode
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link href="/register">
              <ShimmerButton
                background="linear-gradient(135deg, #2563eb 0%, #9333ea 100%)"
                shimmerColor="rgba(255,255,255,0.3)"
                shimmerSize="0.05em"
                borderRadius="12px"
                className="px-5 py-2.5 text-sm font-medium"
              >
                Get Started
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── Hero Section ──── */}
      <section className="relative flex min-h-[100vh] items-center justify-center overflow-hidden pt-16">
        {/* Particle background */}
        <Particles
          className="absolute inset-0"
          quantity={80}
          color="#3b82f6"
          size={0.4}
          staticity={40}
          ease={50}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-white dark:from-primary-950/30 dark:via-transparent dark:to-[hsl(222,47%,5%)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedGradientText className="mb-8">
              <Sparkles className="mr-2 inline-block h-4 w-4 text-primary-500" />
              <span className="inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent">
                Powered by Advanced AI
              </span>
              <ChevronRight className="ml-1 inline-block h-3 w-3 text-gray-400 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedGradientText>
          </motion.div>

          <motion.h1
            className="mx-auto max-w-5xl text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Create Professional{" "}
            <span className="bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
              Podcasts
            </span>{" "}
            with
            <WordRotate
              words={["AI Voices", "One Click", "Zero Equipment", "Full Control"]}
              className="inline-block bg-gradient-to-r from-secondary-500 to-primary-500 bg-clip-text text-transparent"
              duration={3000}
            />
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400 sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Generate compelling scripts, choose from 50+ realistic AI voices,
            and produce studio-quality audio — all from a single platform.
            No microphone needed.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/register">
              <ShimmerButton
                background="linear-gradient(135deg, #2563eb 0%, #9333ea 100%)"
                shimmerColor="rgba(255,255,255,0.3)"
                shimmerSize="0.05em"
                borderRadius="14px"
                className="px-8 py-4 text-base font-semibold"
              >
                <Play className="mr-2 h-4 w-4 fill-white" />
                Start Creating Free
              </ShimmerButton>
            </Link>
            <a
              href="#how-it-works"
              className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-6 py-4 text-base font-medium text-gray-700 backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-300 dark:hover:border-gray-700"
            >
              See How It Works
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            className="mx-auto mt-16 flex max-w-2xl flex-wrap items-center justify-center gap-8 sm:gap-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                <NumberTicker value={10000} />+
              </div>
              <p className="mt-1 text-sm text-gray-500">Episodes Created</p>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                <NumberTicker value={50} />+
              </div>
              <p className="mt-1 text-sm text-gray-500">AI Voices</p>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                <NumberTicker value={98} />%
              </div>
              <p className="mt-1 text-sm text-gray-500">Satisfaction Rate</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──── Logos / Social Proof Marquee ──── */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-12 dark:border-gray-800/50 dark:bg-gray-900/30">
        <div className="mx-auto max-w-7xl px-4">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-gray-400">
            Trusted by creators, educators, and teams worldwide
          </p>
          <div className="flex items-center justify-center gap-12 opacity-40 grayscale">
            <div className="flex items-center gap-2 text-lg font-bold text-gray-600 dark:text-gray-400">
              <Globe className="h-5 w-5" /> TechCrunch
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-gray-600 dark:text-gray-400">
              <Layers className="h-5 w-5" /> ProductHunt
            </div>
            <div className="hidden items-center gap-2 text-lg font-bold text-gray-600 dark:text-gray-400 sm:flex">
              <Zap className="h-5 w-5" /> Y Combinator
            </div>
            <div className="hidden items-center gap-2 text-lg font-bold text-gray-600 dark:text-gray-400 md:flex">
              <Star className="h-5 w-5" /> Forbes
            </div>
            <div className="hidden items-center gap-2 text-lg font-bold text-gray-600 dark:text-gray-400 lg:flex">
              <Users className="h-5 w-5" /> Spotify
            </div>
          </div>
        </div>
      </section>

      {/* ──── Features - Bento Grid ──── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <AnimatedShinyText className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider">
              Powerful Features
            </AnimatedShinyText>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                create, produce, and publish
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              From script generation to final master, our AI-powered tools
              handle every step of podcast production.
            </p>
          </div>

          <BentoGrid className="auto-rows-[20rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <BentoCard
                key={feature.name}
                {...feature}
                background={
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-secondary-50/30 dark:from-primary-950/20 dark:to-secondary-950/10" />
                }
              />
            ))}
          </BentoGrid>

          {/* Extra feature highlights */}
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: Globe, label: "Multi-language", desc: "Translate scripts" },
              { icon: FileText, label: "Show Notes", desc: "Auto-generated" },
              { icon: Layers, label: "Brand Profiles", desc: "Stay consistent" },
              { icon: Clock, label: "Version History", desc: "Full rollback" },
            ].map((item) => (
              <div
                key={item.label}
                className="group rounded-xl border border-gray-100 bg-white p-5 text-center transition-all hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800"
              >
                <item.icon className="mx-auto mb-3 h-6 w-6 text-primary-500 transition-transform group-hover:scale-110" />
                <p className="font-semibold text-gray-900 dark:text-white">
                  {item.label}
                </p>
                <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── How It Works ──── */}
      <section
        id="how-it-works"
        className="relative overflow-hidden border-y border-gray-100 bg-gray-50/80 py-24 dark:border-gray-800/50 dark:bg-gray-900/50 sm:py-32"
      >
        <div className="absolute inset-0 opacity-30">
          <Particles
            quantity={40}
            color="#9333ea"
            size={0.3}
            staticity={60}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <AnimatedShinyText className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider">
              Simple Workflow
            </AnimatedShinyText>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              From topic to podcast in{" "}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                three steps
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                className="group relative rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm transition-all hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/10 dark:border-gray-800 dark:bg-gray-900/80 dark:hover:border-primary-800"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="mb-6 flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-600 text-lg font-bold text-white shadow-lg shadow-primary-500/25">
                    {item.step}
                  </span>
                  <item.icon className="h-6 w-6 text-gray-400 transition-colors group-hover:text-primary-500" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-primary-300 to-transparent md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Testimonials ──── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <AnimatedShinyText className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider">
              Testimonials
            </AnimatedShinyText>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Loved by{" "}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                creators worldwide
              </span>
            </h2>
          </div>

          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            <Marquee pauseOnHover className="[--duration:35s]">
              {testimonials.map((review) => (
                <ReviewCard key={review.name} {...review} />
              ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:35s]">
              {testimonials.map((review) => (
                <ReviewCard key={review.name} {...review} />
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-[hsl(222,47%,5%)]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-[hsl(222,47%,5%)]" />
          </div>
        </div>
      </section>

      {/* ──── Pricing ──── */}
      <section
        id="pricing"
        className="relative overflow-hidden border-y border-gray-100 bg-gray-50/80 py-24 dark:border-gray-800/50 dark:bg-gray-900/50 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <AnimatedShinyText className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider">
              Pricing
            </AnimatedShinyText>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Simple, transparent{" "}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                pricing
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Start free. Scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-8 transition-all",
                  plan.popular
                    ? "border-primary-500 bg-white shadow-2xl shadow-primary-500/20 dark:bg-gray-900"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700",
                )}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                      <Star className="h-3 w-3 fill-white" /> Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                  <p className="mt-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                    {plan.credits}
                  </p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/register">
                  {plan.popular ? (
                    <ShimmerButton
                      background="linear-gradient(135deg, #2563eb 0%, #9333ea 100%)"
                      shimmerColor="rgba(255,255,255,0.3)"
                      shimmerSize="0.05em"
                      borderRadius="12px"
                      className="w-full py-3 text-sm font-semibold"
                    >
                      {plan.cta}
                    </ShimmerButton>
                  ) : (
                    <button className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-750">
                      {plan.cta}
                    </button>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA Section ──── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <Particles
          className="absolute inset-0"
          quantity={60}
          color="#9333ea"
          size={0.3}
          staticity={50}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-secondary-50/80 dark:from-primary-950/30 dark:via-[hsl(222,47%,5%)] dark:to-secondary-950/30" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Ready to create your first{" "}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                AI podcast
              </span>
              ?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">
              Join thousands of creators who are already producing professional
              podcasts with CastNode. Start free — no credit card required.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <ShimmerButton
                  background="linear-gradient(135deg, #2563eb 0%, #9333ea 100%)"
                  shimmerColor="rgba(255,255,255,0.3)"
                  shimmerSize="0.05em"
                  borderRadius="14px"
                  className="px-8 py-4 text-base font-semibold"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Get Started Free
                </ShimmerButton>
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-400">
              Free plan includes 50 credits/month. No credit card needed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ──── Footer ──── */}
      <footer className="border-t border-gray-100 bg-white py-16 dark:border-gray-800/50 dark:bg-[hsl(222,47%,5%)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600">
                  <Mic2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  CastNode
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                Create professional podcasts with AI-powered script generation,
                voice synthesis, and full audio production.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                Product
              </h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Voices", "Studio", "API"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
                      >
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                Company
              </h4>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact", "Press"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
                      >
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                Legal
              </h4>
              <ul className="space-y-3">
                {["Privacy", "Terms", "Security", "Cookies"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 dark:border-gray-800/50 sm:flex-row">
            <p className="text-sm text-gray-400">
              &copy; 2026 CastNode. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              Made with
              <Volume2 className="mx-1 h-4 w-4 text-primary-500" />
              by CastNode AI
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

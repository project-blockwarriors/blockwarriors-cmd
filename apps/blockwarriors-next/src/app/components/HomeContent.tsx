'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Code2,
  Users,
  Trophy,
  Zap,
  Target,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Play,
  Github,
  Twitter,
  MessageCircle,
  MapPin,
  Calendar,
  Bot,
  Cpu,
  Gamepad2,
  Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/landing/Navbar';
import { useRef } from 'react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function HomeContent() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-20 overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/blockwarriors-ai-background.webp"
            alt=""
            fill
            className="object-cover object-center opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-transparent to-[#0A0A0A]/90" />
        </div>

        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid opacity-30 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-princeton-orange/5 via-transparent to-transparent z-[1]" />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-princeton-orange/20 rounded-full blur-[120px] animate-float z-[1]" />
        <div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-minecraft-grass/15 rounded-full blur-[120px] animate-float z-[1]"
          style={{ animationDelay: '-3s' }}
        />

        {/* Pixel blocks floating (Minecraft feel) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute inset-0 pointer-events-none z-[1]"
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-princeton-orange/30 rounded-sm"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="container max-w-6xl mx-auto px-4 relative z-10 flex flex-col items-center"
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center space-y-8"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-princeton-orange/20 text-sm">
                <span className="w-2 h-2 bg-minecraft-grass rounded-full animate-pulse" />
                <span className="text-muted-foreground">
                  Registration Open for Spring 2025
                </span>
                <ChevronRight className="w-4 h-4 text-princeton-orange" />
              </div>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight"
            >
              <span className="text-gradient-orange">BlockWarriors</span>
              <br />
              <span className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                AI Meets Minecraft
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Build autonomous bots using Mineflayer or your own Minecraft
              client. Compete in real-time PvP arenas. Finals hosted at
              Princeton University.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-princeton-orange to-princeton-orange-light text-black font-semibold px-8 py-6 rounded-xl text-lg hover:opacity-90 transition-all group glow-orange-sm"
              >
                <Link href="/login" className="flex items-center gap-2">
                  Register Your Team
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/5 px-8 py-6 rounded-xl text-lg group"
              >
                <Link href="#how-it-works" className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  See How It Works
                </Link>
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-8 pt-12"
            >
              {[
                { value: '16', label: 'Teams in Finals' },
                { value: 'TBD', label: 'Prizes' },
                { value: 'April', label: 'Finals Date' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ height: ['20%', '40%', '20%'] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 bg-princeton-orange rounded-full"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 relative">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-16"
          >
            {/* Section header */}
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-princeton-orange/10 text-princeton-orange text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Why BlockWarriors
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                Where Minecraft Meets AI Innovation
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                The perfect sandbox for developing and testing cutting-edge AI
                algorithms in a dynamic, competitive environment.
              </p>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: Cpu,
                  title: 'Real-time AI Testing',
                  description:
                    'Your bots make decisions in milliseconds, adapting to unpredictable opponents and environments.',
                  gradient: 'from-princeton-orange to-princeton-orange-light',
                },
                {
                  icon: Gamepad2,
                  title: 'Familiar Playground',
                  description:
                    "Minecraft's intuitive world provides an accessible yet complex arena for AI development.",
                  gradient: 'from-minecraft-grass to-minecraft-grass-light',
                },
                {
                  icon: Bot,
                  title: 'Emergent Behaviors',
                  description:
                    'Simple rules lead to complex strategies. Watch your AI surprise you with creative solutions.',
                  gradient: 'from-princeton-orange to-minecraft-grass',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  variants={scaleIn}
                  className="group relative p-8 rounded-2xl bg-card border border-white/5 hover:border-princeton-orange/30 transition-all duration-500"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-princeton-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 space-y-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}
                    >
                      <feature.icon className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-32 relative bg-gradient-to-b from-transparent via-princeton-orange/5 to-transparent"
      >
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-16"
          >
            {/* Section header */}
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-minecraft-grass/10 text-minecraft-grass text-sm font-medium">
                <Zap className="w-4 h-4" />
                How It Works
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                From Code to Combat in 5 Steps
              </h2>
            </motion.div>

            {/* Steps */}
            <motion.div variants={staggerContainer} className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'Form Your Team',
                  description:
                    'Gather 2-4 programmers and register on our platform. All skill levels welcome.',
                  icon: Users,
                },
                {
                  step: '02',
                  title: 'Build Your Bot',
                  description:
                    'Use Mineflayer, write your own client, or any approach you prefer. Your code, your strategy.',
                  icon: Code2,
                },
                {
                  step: '03',
                  title: 'Online Qualifiers',
                  description:
                    'Compete remotely against other teams. Top 16 teams advance to the finals.',
                  icon: Target,
                },
                {
                  step: '04',
                  title: 'In-Person Finals',
                  description:
                    'Join us at Princeton University for the championship bracket.',
                  icon: Swords,
                },
                {
                  step: '05',
                  title: 'Win Prizes',
                  description:
                    'Top teams win prizes including potential cash rewards and gaming hardware.',
                  icon: Trophy,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="group relative flex items-start gap-6 p-6 rounded-2xl hover:bg-white/[0.02] transition-colors duration-300"
                >
                  {/* Step number */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-princeton-orange/20 to-transparent border border-princeton-orange/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-princeton-orange font-mono">
                      {item.step}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-grow space-y-2 pt-1">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-princeton-orange" />
                      <h3 className="text-xl font-semibold text-white">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Connector line */}
                  {i < 4 && (
                    <div className="absolute left-[2.45rem] top-20 w-px h-6 bg-gradient-to-b from-princeton-orange/30 to-transparent" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tournament Section */}
      <section id="tournament" className="py-32 relative">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-16"
          >
            {/* Section header */}
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-princeton-orange/10 text-princeton-orange text-sm font-medium">
                <Trophy className="w-4 h-4" />
                The Tournament
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                Spring 2025 Championship
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Online qualifiers followed by in-person finals at Princeton
                University.
              </p>
            </motion.div>

            {/* Tournament details cards */}
            <motion.div
              variants={staggerContainer}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Main event card */}
              <motion.div
                variants={scaleIn}
                className="relative p-8 rounded-2xl bg-gradient-to-br from-princeton-orange/10 to-transparent border border-princeton-orange/20 space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-princeton-orange flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Finals Date
                    </div>
                    <div className="text-xl font-semibold text-white">
                      April 2025 (TBD)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-minecraft-grass flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Finals Location
                    </div>
                    <div className="text-xl font-semibold text-white">
                      Princeton University
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Format</div>
                    <div className="text-xl font-semibold text-white">
                      Online Qualifiers → 16-Team Finals
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Prize breakdown card */}
              <motion.div
                variants={scaleIn}
                className="relative p-8 rounded-2xl glass border border-white/10 space-y-6"
              >
                <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-princeton-orange" />
                  Prizes
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-princeton-orange/10 border border-princeton-orange/20">
                    <p className="text-white font-medium mb-2">
                      Prize pool to be announced
                    </p>
                    <p className="text-sm text-muted-foreground">
                      May include cash prizes, gaming consoles, and more.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      '🏆 1st, 2nd, 3rd place awards',
                      '🎮 Gaming hardware prizes',
                      '📜 Recognition & bragging rights',
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-muted-foreground"
                      >
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeInUp} className="text-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-princeton-orange to-princeton-orange-light text-black font-semibold px-8 py-6 rounded-xl text-lg hover:opacity-90 transition-all group"
              >
                <Link href="/login" className="flex items-center gap-2">
                  Secure Your Spot
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="py-32 relative bg-gradient-to-b from-transparent via-card/50 to-transparent"
      >
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Section header */}
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                Frequently Asked Questions
              </h2>
            </motion.div>

            {/* FAQ items */}
            <motion.div variants={staggerContainer} className="space-y-4">
              {[
                {
                  q: 'How do I build my bot?',
                  a: 'You can use Mineflayer (JavaScript), write your own Minecraft client, or use any approach that connects to a Minecraft server. Bring your own code!',
                },
                {
                  q: 'What programming languages can I use?',
                  a: 'Any language that can interface with Minecraft! Mineflayer uses JavaScript/TypeScript, but you can write custom clients in Python, Java, or anything else.',
                },
                {
                  q: 'How large should teams be?',
                  a: 'Teams can have 2-4 members. Solo participants can join our Discord to find teammates.',
                },
                {
                  q: 'Is there a cost to participate?',
                  a: 'BlockWarriors is completely free to enter. We believe in accessible AI education.',
                },
                {
                  q: 'How does the tournament work?',
                  a: 'Online qualifiers determine the top 16 teams who advance to the in-person finals at Princeton University in April.',
                },
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="p-6 rounded-2xl bg-card border border-white/5 hover:border-princeton-orange/20 transition-colors duration-300"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-princeton-orange/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-princeton-orange/20 rounded-full blur-[150px]" />

        <div className="container max-w-4xl mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center space-y-8"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white"
            >
              Ready to
              <br />
              <span className="text-gradient-orange">Enter the Arena?</span>
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-xl mx-auto"
            >
              Build your bot, crush the qualifiers, and compete for glory at
              Princeton.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-princeton-orange to-princeton-orange-light text-black font-semibold px-10 py-7 rounded-xl text-lg hover:opacity-90 transition-all group glow-orange"
              >
                <Link href="/login" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <Image
                src="/blockwarriors-logo.png"
                alt="BlockWarriors"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="font-bold text-lg text-white tracking-tight">
                Block<span className="text-princeton-orange">Warriors</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <Link
                href="#about"
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="#tournament"
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Tournament
              </Link>
              <Link
                href="#faq"
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                FAQ
              </Link>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 BlockWarriors. Hosted at Princeton University.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

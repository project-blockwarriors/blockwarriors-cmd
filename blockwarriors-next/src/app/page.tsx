'use client';

import { useState } from 'react';
import { Header } from './components/Header';
import { RegistrationBanner } from './components/RegistrationBanner';
import { motion } from 'framer-motion';
import {
  BeakerIcon,
  LightBulbIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const shimmer = {
    animate: {
      background: [
        'linear-gradient(to right, #FF9900 0%, #FFAA33 50%, #FF9900 100%)',
        'linear-gradient(to right, #FFAA33 0%, #FF9900 50%, #FFAA33 100%)',
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: 'reverse',
      },
    },
  };

  const [expandedCard, setExpandedCard] = useState(-1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D] relative overflow-hidden">
      <div className="min-h-screen text-gray-100">
        <RegistrationBanner />

        <div className="container mx-auto py-12 space-y-32 max-w-[100vw] px-4 sm:px-6 md:px-8 relative">
          <Header />

          {/* Hero Section */}
          <section id="home" className="relative">
            <motion.div
              className="mb-24 relative overflow-hidden rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div className="relative flex justify-center">
                <Image
                  src="/blockwarriors-ai-challenge-artwork.webp"
                  alt="BlockWarriors AI Challenge Artwork"
                  width={1200}
                  height={675}
                  className="w-full h-auto rounded-2xl shadow-[0_0_50px_rgba(255,153,0,0.15)]"
                  priority
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF9900]/20 to-transparent"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              className="max-w-4xl mx-auto text-center space-y-8 relative"
              variants={staggerChildren}
              initial="initial"
              animate="animate"
            >
              <motion.h1 className="text-6xl font-bold" variants={fadeInUp}>
                <motion.span
                  className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-[#FF9900] via-[#FFAA33] to-[#FF9900] relative"
                  animate={{
                    backgroundPosition: ['0% center', '200% center'],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    backgroundSize: '200% auto',
                  }}
                >
                  BlockWarriors: Redefining AI through Minecraft
                </motion.span>
              </motion.h1>
              <motion.p
                className="text-2xl text-gray-300 leading-relaxed"
                variants={fadeInUp}
              >
                Compete. Innovate. Dominate. Join the global challenge to create
                AI bots that think, adapt, and win in dynamic, player-driven
                arenas.
              </motion.p>
            </motion.div>
          </section>

          {/* Vision Section */}
          <section className="relative">
            {/* Animated background */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              {/* Radial gradient background */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FFD700]/20 via-[#B8860B]/10 to-[#8B6914]/5" />

              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 via-[#FFA500]/5 to-transparent" />

              {/* Grid pattern */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(255,215,0,0.1) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,215,0,0.1) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Animated border */}
              <div className="absolute inset-0">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/30 via-[#FFA500]/20 to-[#FFD700]/30 animate-shimmer"
                  style={{
                    maskImage:
                      'linear-gradient(to bottom, transparent, black, transparent)',
                    WebkitMaskImage:
                      'linear-gradient(to bottom, transparent, black, transparent)',
                  }}
                />
              </div>
            </div>

            <motion.div
              className="max-w-4xl mx-auto text-center space-y-8 relative p-12 rounded-3xl"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerChildren}
            >
              <motion.div
                className="flex items-center justify-center gap-4 mb-16"
                variants={fadeInUp}
              >
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                  The Vision
                </h2>
                <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />
              </motion.div>

              <div className="space-y-16 relative backdrop-blur-sm">
                {/* Vision Statement Subsection */}
                <div className="space-y-6 relative">
                  {/* Glowing orbs with reduced opacity */}
                  <motion.div
                    className="absolute -top-10 -left-20 w-40 h-40 bg-[#FFD700] rounded-full blur-[100px] opacity-20"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.2 }}
                    transition={{ duration: 1 }}
                  />
                  <motion.div
                    className="absolute -bottom-10 -right-20 w-40 h-40 bg-[#FFA500] rounded-full blur-[100px] opacity-20"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.2 }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />

                  <motion.p
                    className="text-4xl font-semibold text-gray-100 leading-relaxed relative"
                    variants={fadeInUp}
                  >
                    Where the beloved game of Minecraft meets the future of AI
                    development.
                  </motion.p>
                  <motion.p
                    className="text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto relative"
                    variants={fadeInUp}
                  >
                    Pioneering the future of AI development through the world's
                    most beloved sandbox game.
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Competition Flow Section */}
          <section className="relative mt-32">
            <motion.div
              className="max-w-4xl mx-auto"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <motion.h2
                className="text-4xl font-bold text-center text-[#FFD700] mb-16"
                variants={fadeInUp}
              >
                Your Journey in Game-based AI
              </motion.h2>

              <div className="grid grid-cols-1 gap-8">
                {[
                  {
                    step: 1,
                    title: 'Team Formation',
                    description: 'Register and join a team of innovators',
                    icon: '👥',
                  },
                  {
                    step: 2,
                    title: 'Bot Development',
                    description: "Code your AI bot's strategy and behavior",
                    icon: '🤖',
                  },
                  {
                    step: 3,
                    title: 'Server Integration',
                    description:
                      'Your code is communicates with our Minecraft server',
                    icon: '🖥️',
                  },
                  {
                    step: 4,
                    title: 'Live Competition',
                    description: 'Bots compete in real-time matches',
                    icon: '⚔️',
                  },
                  {
                    step: 5,
                    title: 'Victory Conditions',
                    description: 'First team to complete objectives wins',
                    icon: '🏆',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    className="relative flex items-center gap-6 bg-black/30 p-6 rounded-xl border border-[#FFD700]/20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {/* Connector Line */}
                    {index < 4 && (
                      <div className="absolute -bottom-8 left-12 w-0.5 h-8 bg-gradient-to-b from-[#FFD700]/50 to-transparent" />
                    )}

                    {/* Step Number and Icon */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-black font-bold">
                      {item.icon}
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-xl font-semibold text-[#FFD700] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-gray-300">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Why Minecraft Section */}
          <section className="relative">
            <motion.div
              className="relative"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <motion.div
                className="flex items-center justify-center gap-4 mb-16"
                variants={fadeInUp}
              >
                <div className="h-[1px] w-12 section-divider" />
                <h2 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#FF9900] via-[#E68A00] to-[#FFAA33]">
                  Why Minecraft as a Testbed for AI?
                </h2>
                <div className="h-[1px] w-12 section-divider" />
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-500 group relative overflow-hidden cursor-pointer"
                  variants={fadeInUp}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 0 30px rgba(255,153,0,0.15)',
                  }}
                  onClick={() => setExpandedCard(expandedCard === 0 ? -1 : 0)}
                >
                  <motion.div
                    className="w-12 h-12 mx-auto mb-6 text-[#FF9900]"
                    whileHover={{ scale: 1.1 }}
                  >
                    <BeakerIcon />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-center mb-4 bg-gradient-to-r from-[#FF9900] to-[#FFAA33] bg-clip-text text-transparent">
                    Perfect Testing Environment
                  </h3>
                  <motion.div
                    className="overflow-hidden"
                    animate={{
                      height: expandedCard === 0 ? 'auto' : 0,
                      opacity: expandedCard === 0 ? 1 : 0,
                    }}
                    transition={{
                      height: {
                        duration: 0.4,
                        ease: 'easeOut',
                      },
                      opacity: {
                        duration: 0.3,
                        ease: 'easeInOut',
                        delay: expandedCard === 0 ? 0.2 : 0,
                      },
                    }}
                  >
                    <p className="text-gray-300 text-center transform">
                      Minecraft provides a controlled yet flexible environment
                      for testing AI algorithms. Its sandbox nature allows for
                      infinite possibilities while maintaining measurable
                      outcomes.
                    </p>
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-[#FF9900]/10 to-transparent opacity-0 transition-opacity duration-300"
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  />
                  <motion.div
                    className="mt-6 flex items-center justify-center gap-2 text-[#FF9900]/80 group-hover:text-[#FF9900] transition-colors duration-300"
                    animate={{ opacity: expandedCard === 0 ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-sm font-medium">Learn more</span>
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{
                        x: expandedCard === 0 ? 0 : [0, 5, 0],
                        rotate: expandedCard === 0 ? 0 : [0, 0, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </motion.svg>
                  </motion.div>
                </motion.div>

                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-500 group relative overflow-hidden cursor-pointer"
                  variants={fadeInUp}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 0 30px rgba(255,153,0,0.15)',
                  }}
                  onClick={() => setExpandedCard(expandedCard === 1 ? -1 : 1)}
                >
                  <motion.div
                    className="w-12 h-12 mx-auto mb-6 text-[#FF9900]"
                    whileHover={{ scale: 1.1 }}
                  >
                    <CpuChipIcon />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-center mb-4 bg-gradient-to-r from-[#FF9900] to-[#FFAA33] bg-clip-text text-transparent">
                    Real-time Decision Making
                  </h3>
                  <motion.div
                    className="overflow-hidden"
                    animate={{
                      height: expandedCard === 1 ? 'auto' : 0,
                      opacity: expandedCard === 1 ? 1 : 0,
                    }}
                    transition={{
                      height: {
                        duration: 0.4,
                        ease: 'easeOut',
                      },
                      opacity: {
                        duration: 0.3,
                        ease: 'easeInOut',
                        delay: expandedCard === 1 ? 0.2 : 0,
                      },
                    }}
                  >
                    <p className="text-gray-300 text-center transform">
                      Challenge your AI to make split-second decisions in a
                      dynamic world. From resource management to combat
                      strategy, every moment counts.
                    </p>
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-[#FF9900]/10 to-transparent opacity-0 transition-opacity duration-300"
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  />
                  <motion.div
                    className="mt-6 flex items-center justify-center gap-2 text-[#FF9900]/80 group-hover:text-[#FF9900] transition-colors duration-300"
                    animate={{ opacity: expandedCard === 1 ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-sm font-medium">Learn more</span>
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{
                        x: expandedCard === 1 ? 0 : [0, 5, 0],
                        rotate: expandedCard === 1 ? 0 : [0, 0, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </motion.svg>
                  </motion.div>
                </motion.div>

                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-500 group relative overflow-hidden cursor-pointer"
                  variants={fadeInUp}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: '0 0 30px rgba(255,153,0,0.15)',
                  }}
                  onClick={() => setExpandedCard(expandedCard === 2 ? -1 : 2)}
                >
                  <motion.div
                    className="w-12 h-12 mx-auto mb-6 text-[#FF9900]"
                    whileHover={{ scale: 1.1 }}
                  >
                    <LightBulbIcon />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-center mb-4 bg-gradient-to-r from-[#FF9900] to-[#FFAA33] bg-clip-text text-transparent">
                    Emergent Complexity
                  </h3>
                  <motion.div
                    className="overflow-hidden"
                    animate={{
                      height: expandedCard === 2 ? 'auto' : 0,
                      opacity: expandedCard === 2 ? 1 : 0,
                    }}
                    transition={{
                      height: {
                        duration: 0.4,
                        ease: 'easeOut',
                      },
                      opacity: {
                        duration: 0.3,
                        ease: 'easeInOut',
                        delay: expandedCard === 2 ? 0.2 : 0,
                      },
                    }}
                  >
                    <p className="text-gray-300 text-center transform">
                      Simple rules lead to complex behaviors. Watch as your AI
                      learns to navigate, build, and interact in ways you never
                      explicitly programmed.
                    </p>
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-[#FF9900]/10 to-transparent opacity-0 transition-opacity duration-300"
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  />
                  <motion.div
                    className="mt-6 flex items-center justify-center gap-2 text-[#FF9900]/80 group-hover:text-[#FF9900] transition-colors duration-300"
                    animate={{ opacity: expandedCard === 2 ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-sm font-medium">Learn more</span>
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{
                        x: expandedCard === 2 ? 0 : [0, 5, 0],
                        rotate: expandedCard === 2 ? 0 : [0, 0, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </motion.svg>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Competition CTA Section */}
          <section className="relative mt-32">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <motion.div
                className="inline-block card-gradient p-12 rounded-2xl border border-[#A67F5C]/20 relative overflow-hidden group hover:border-[#FF9900]/40 transition-all duration-500"
                variants={fadeInUp}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 0 30px rgba(255,153,0,0.15)',
                }}
              >
                {/* Animated border */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF9900]/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF9900]/30 to-transparent" />
                  <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-transparent via-[#FF9900]/30 to-transparent" />
                  <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-transparent via-[#FF9900]/30 to-transparent" />
                </motion.div>

                {/* Background effects */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FF9900]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-orange-500 bg-repeat opacity-10" />

                <motion.h2
                  className="text-4xl font-bold text-gray-100 mb-6"
                  variants={fadeInUp}
                >
                  Ready to Push the Boundaries?
                </motion.h2>
                <motion.p
                  className="text-xl text-gray-200 mb-8"
                  variants={fadeInUp}
                >
                  Join the competition and be part of the next generation of AI
                  innovation.
                </motion.p>
                <motion.div variants={fadeInUp}>
                  <Link
                    href="/competition"
                    className="inline-block group relative"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#FFA500] to-[#FFB733] rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                    <span className="relative px-8 py-3 bg-gradient-to-r from-[#FFA500] to-[#FFB733] rounded-lg text-black font-semibold inline-block">
                      Learn About the Competition →
                    </span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .card-gradient {
          background: rgba(26, 26, 26, 0.8);
          backdrop-filter: blur(20px);
        }

        .section-divider {
          background: linear-gradient(
            to right,
            transparent,
            #ff9900,
            transparent
          );
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}

'use client';

import { Header } from '../components/Header';
import { RegistrationBanner } from '../components/RegistrationBanner';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  CodeBracketIcon,
  UserGroupIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export default function Competition() {
  const sectionVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: 'easeOut' },
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="min-h-screen text-gray-100">
        <RegistrationBanner />

        <div className="container mx-auto py-12 space-y-24 max-w-[100vw] px-4 sm:px-6 md:px-8">
          <Header />

          {/* Futuristic Lab Hero */}
          <section className="relative h-[70vh] w-full overflow-hidden rounded-2xl mb-24">
            <Image
              src="/futuristic-computer-lab.avif"
              alt="Futuristic Computer Lab"
              fill
              className="object-cover"
              priority
              quality={100}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1A1A1A]/50 to-[#1A1A1A]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-4xl px-4">
                <motion.h1 
                  className="text-6xl font-bold text-white mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  The Future of AI Gaming
                </motion.h1>
                <motion.p 
                  className="text-2xl text-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Where Innovation Meets Competition
                </motion.p>
              </div>
            </div>
          </section>

          {/* Hero Section */}
          <section className="relative">
            <motion.div
              className="max-w-4xl mx-auto text-center space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF9900] via-[#E68A00] to-[#FFAA33]">
                Competition Details
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Join us in this groundbreaking tournament where AI meets gaming
                innovation. Showcase your skills, compete with the best, and
                push the boundaries of AI development.
              </p>
            </motion.div>
          </section>

          {/* Project Overview Section */}
          <section className="relative">
            <motion.div
              className="relative max-w-6xl mx-auto"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 p-8 rounded-2xl bg-[#1A1A1A]/80 border border-[#333333]">
                  <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF9900] via-[#E68A00] to-[#FFAA33]">
                    The Largest AI Gaming Competition
                  </h2>
                  <p className="text-xl text-gray-100 leading-relaxed">
                    Blockwarriors stands as the premier AI gaming competition, uniting the brightest minds from all Ivy League institutions and other top universities worldwide.
                  </p>
                  <div className="grid grid-cols-2 gap-6 mt-8">
                    <div className="p-6 rounded-xl border border-[#333333] bg-[#1A1A1A]">
                      <div className="text-3xl font-bold text-[#FF9900] mb-2">8+</div>
                      <div className="text-gray-100">Ivy League Universities</div>
                    </div>
                    <div className="p-6 rounded-xl border border-[#333333] bg-[#1A1A1A]">
                      <div className="text-3xl font-bold text-[#FF9900] mb-2">20+</div>
                      <div className="text-gray-100">Partner Institutions</div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF9900]/20 to-transparent rounded-2xl filter blur-3xl opacity-30"></div>
                  <div className="p-8 rounded-2xl border border-[#333333] relative bg-[#1A1A1A]/80">
                    <h3 className="text-2xl font-semibold mb-6 text-gray-100">Why Blockwarriors?</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[10px]"></div>
                        <span className="text-gray-100">Unprecedented collaboration between top academic institutions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[10px]"></div>
                        <span className="text-gray-100">Cutting-edge AI research opportunities in gaming</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[10px]"></div>
                        <span className="text-gray-100">Network with leading minds in AI and technology</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[10px]"></div>
                        <span className="text-gray-100">Push the boundaries of AI innovation through competition</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Competition Overview Section */}
          <section className="relative">
            <motion.div
              className="relative"
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-4 mb-16">
                <div className="h-[1px] w-12 section-divider" />
                <h2 className="text-4xl font-bold text-center text-gray-300">
                  Tournament Format
                </h2>
                <div className="h-[1px] w-12 section-divider" />
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300 group"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center mb-6">
                    <CodeBracketIcon className="w-12 h-12 text-[#FF9900] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-center text-gray-300">
                    The Arena
                  </h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    Custom-built Minecraft environments designed to test AI
                    capabilities in resource gathering, combat, and strategy.
                  </p>
                </motion.div>

                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300 group"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center mb-6">
                    <UserGroupIcon className="w-12 h-12 text-[#FF9900] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-center text-gray-300">
                    Global Qualifiers
                  </h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    Teams compete in preliminary rounds to showcase their AI's
                    abilities and secure a spot in the finals.
                  </p>
                </motion.div>

                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300 group"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center mb-6">
                    <TrophyIcon className="w-12 h-12 text-[#FF9900] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-center text-gray-300">
                    Princeton Finals
                  </h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    Top teams gather at Princeton University for the ultimate
                    showdown of AI strategy and innovation.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Tournament Structure Section */}
          <section className="relative">
            <motion.div
              className="relative"
              variants={sectionVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <motion.div
                className="card-gradient p-12 rounded-2xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-300 max-w-5xl mx-auto"
                whileHover={{ scale: 1.01 }}
              >
                <h3 className="text-3xl font-bold mb-12 text-center text-gray-300">
                  How It Works
                </h3>

                <div className="grid md:grid-cols-2 gap-16">
                  {/* Qualification Phase */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#FF9900]/10 flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-[#FF9900]" />
                      </div>
                      <h4 className="text-2xl font-semibold text-gray-300">
                        Qualification Phase
                      </h4>
                    </div>
                    <ul className="space-y-3 text-gray-300 ml-4">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>
                          Teams submit their AI agents for preliminary testing
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>
                          Automated evaluation in various challenge scenarios
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>
                          Top performers advance to elimination rounds
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Elimination Phase */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#FF9900]/10 flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-[#FF9900]" />
                      </div>
                      <h4 className="text-2xl font-semibold text-gray-300">
                        Elimination Phase
                      </h4>
                    </div>
                    <ul className="space-y-3 text-gray-300 ml-4">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>
                          Head-to-head matches between qualified teams
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>
                          Double elimination format ensures fair competition
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>Live streaming of all tournament matches</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* Join the Movement Section */}
          <section className="relative pb-12">
            <motion.div
              className="relative"
              variants={sectionVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center gap-4 mb-16">
                <div className="h-[1px] w-12 section-divider" />
                <h2 className="text-4xl font-bold text-center text-gray-300">
                  Get Involved
                </h2>
                <div className="h-[1px] w-12 section-divider" />
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-2xl font-semibold mb-6 text-gray-300">
                    For Competitors
                  </h3>
                  <div className="space-y-6 text-gray-300">
                    <p className="leading-relaxed">
                      Form your team and develop cutting-edge AI algorithms
                      using Python, or Javascript. Your bots will compete in
                      thrilling matches that test their ability to:
                    </p>
                    <ul className="space-y-3 ml-4">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>Manage resources strategically</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>Coordinate team movements</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>Adapt to unexpected challenges</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-2xl font-semibold mb-6 text-gray-300">
                    For Contributors
                  </h3>
                  <div className="space-y-6 text-gray-300">
                    <p className="leading-relaxed">
                      Be part of the team that's revolutionizing AI research
                      through gaming. We're looking for passionate individuals
                      to help with:
                    </p>
                    <ul className="space-y-3 ml-4">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>Technical infrastructure and development</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>Event organization and production</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>Community engagement and outreach</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-2xl font-semibold mb-6 text-gray-300">
                    For Sponsors
                  </h3>
                  <div className="space-y-6 text-gray-300">
                    <p className="leading-relaxed">
                      Join us as a sponsor to drive innovation in AI gaming and
                      research. Gain exclusive perks including:
                    </p>
                    <ul className="space-y-3 ml-4">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>Access to a pool of talented participants</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>
                          Unique marketing opportunities during events
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                        <span>Engagement with cutting-edge AI projects</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .card-gradient {
          background: rgba(26, 26, 26, 0.6);
          backdrop-filter: blur(20px);
        }

        .section-divider {
          background: linear-gradient(
            to right,
            transparent,
            #a67f5c,
            transparent
          );
        }
      `}</style>
    </div>
  );
}

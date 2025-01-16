'use client';

import { Header } from './components/Header';
import { RegistrationBanner } from './components/RegistrationBanner';
import { motion } from 'framer-motion';

import {
  CodeBracketIcon,
  UserGroupIcon,
  TrophyIcon,
  RocketLaunchIcon,
  BeakerIcon,
  LightBulbIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function Home() {

  // const user = getUser();

  const sectionVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  return (
    <div
      className="min-h-screen bg-[#1A1A1A]"
    >
      <div className="min-h-screen text-gray-100">
        <RegistrationBanner />

        <div className="container mx-auto px-4 py-12 space-y-32">
          <Header />

          {/* Hero Section */}
          <section id="home" className="relative">
            <motion.div
              className="mb-24 relative overflow-hidden rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative flex justify-center">
                <Image
                  src="/blockwarriors-ai-challenge-artwork.webp"
                  alt="BlockWarriors AI Challenge Artwork"
                  width={1200}
                  height={675}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                  priority
                />
                <div className="absolute inset-0 rounded-2xl" />
              </div>
            </motion.div>

            <motion.div
              className="max-w-4xl mx-auto text-center space-y-8 relative -mt-12"
              variants={sectionVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF9900] via-[#E68A00] to-[#FFAA33]">
                BlockWarriors: Redefining AI through Minecraft
              </h1>
              <p className="text-2xl text-gray-100 leading-relaxed">
                Compete. Innovate. Dominate. Join the global challenge to create AI bots that think, adapt, and win in dynamic, player-driven arenas.
              </p>
            </motion.div>
          </section>

          {/* Section Styles - Apply to all sections */}
          <style jsx>{`
            section h2 {
              background: linear-gradient(to right, #FF9900, #E68A00);
              -webkit-background-clip: text;
              color: transparent;
            }
            
            .card-gradient {
              background: rgba(26, 26, 26, 0.6);
              backdrop-filter: blur(20px);
            }

            .section-divider {
              background: linear-gradient(to right, transparent, #A67F5C, transparent);
            }
          `}</style>

          {/* Why Minecraft Section */}
          <section className="relative">
            <motion.div
              className="relative"
              variants={sectionVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center gap-4 mb-16">
                <div className="h-[1px] w-12 section-divider" />
                <h2 className="text-4xl font-bold text-center">Why Minecraft as a Testbed for AI?</h2>
                <div className="h-[1px] w-12 section-divider" />
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <LightBulbIcon className="w-12 h-12 text-[#FF9900] mb-6" />
                  <h3 className="text-2xl font-semibold mb-4 text-[#E68A00]">Promoting Interest</h3>
                  <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                  <span>Curiosity through gamified AI challenges</span>
                  </li>
                  <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                  <span>Groundbreaking research and innovation</span>
                  </li>
                  </ul>
                </motion.div>


                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <BeakerIcon className="w-12 h-12 text-[#FF9900] mb-6" />
                  <h3 className="text-2xl font-semibold mb-4 text-[#E68A00]">Sandbox Environment</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                      <span>Open-ended gameplay enables creativity and problem-solving</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                      <span>Dynamic, unpredictable challenges for AI experimentation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                      <span>Scalable platform for complex AI systems testing</span>
                    </li>
                  </ul>
                </motion.div>

                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <CpuChipIcon className="w-12 h-12 text-[#FF9900] mb-6" />
                  <h3 className="text-2xl font-semibold mb-4 text-[#E68A00]">Real-World Research</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                      <span>Multi-agent coordination and team algorithms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                      <span>Real-time strategy and adaptation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                      <span>Resource management and obstacle navigation</span>
                    </li>
                  </ul>
                </motion.div>

              </div>
            </motion.div>
          </section>

          {/* The Importance of AI Section */}
          <section className="relative">
            <motion.div
              className="relative"
              variants={sectionVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center gap-4 mb-16">
                <div className="h-[1px] w-12 section-divider" />
                <h2 className="text-4xl font-bold text-center">The Impact of AI Agent Research</h2>
                <div className="h-[1px] w-12 section-divider" />
              </div>

              <motion.div
                className="max-w-3xl mx-auto mb-16 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-xl leading-relaxed text-gray-300">
                Artificial Intelligence is at the heart of solving complex real-world challenges,
                from logistics optimization to autonomous robotics. Researching AI in a controlled
                yet dynamic environment like Minecraft allows us to simulate and tackle these
                challenges with precision and creativity. The game’s open-ended mechanics provide a
                unique platform to develop and refine:
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-2xl font-semibold mb-6 text-[#E68A00]">Why This Matters</h3>
                  <div className="space-y-4 text-gray-300">
                    <p className="mb-4">Minecraft provides a safe, controlled setting to develop:</p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Team-based algorithms that scale to real-world applications</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Decision-making strategies under adversarial conditions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Advances applicable to robotics, logistics, and automation</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-2xl font-semibold mb-6 text-[#E68A00]">Future Impact</h3>
                  <div className="space-y-6 text-gray-300">
                    <p>
                      Projects like BlockWarriors bridge the gap between gaming and groundbreaking research, fostering innovations in:
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Resource optimization and complex decision-making</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Reinforcement learning and adaptive AI systems</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Multi-agent coordination and emergent behavior</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Competition Details */}
          <section id="tournament" className="relative">
            <motion.div
              className="relative"
              variants={sectionVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center gap-4 mb-16">
                <div className="h-[1px] w-12 section-divider" />
                <h2 className="text-4xl font-bold text-center">Competition Overview</h2>
                <div className="h-[1px] w-12 section-divider" />
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <motion.div
                  className="group card-gradient p-8 rounded-xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center mb-6">
                    <CodeBracketIcon className="w-12 h-12 text-[#FF9900] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-center text-[#E68A00]">The Arena</h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    A pre-configured environment where your AI bots will face dynamic challenges, processing real-time data streams for strategic decision-making.
                  </p>
                </motion.div>

                <motion.div
                  className="group card-gradient p-8 rounded-xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center mb-6">
                    <UserGroupIcon className="w-12 h-12 text-[#FF9900] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-center text-[#E68A00]">Global Qualifiers</h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    Teams worldwide compete in online elimination matches, showcasing their AI strategies on an international stage.
                  </p>
                </motion.div>

                <motion.div
                  className="group card-gradient p-8 rounded-xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center mb-6">
                    <TrophyIcon className="w-12 h-12 text-[#FF9900] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-center text-[#E68A00]">Princeton Finals</h3>
                  <p className="text-gray-300 text-center leading-relaxed">
                    Experience the excitement live at Princeton University, with professional commentary and immersive match coverage.
                  </p>
                </motion.div>
              </div>

              <div className="mt-16 max-w-4xl mx-auto">
                <motion.div
                  className="card-gradient p-12 rounded-2xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.01 }}
                >
                  <h3 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#FF9900] to-[#FFAA33]">
                    Tournament Structure
                  </h3>

                  <div className="grid md:grid-cols-2 gap-12">

                    <motion.div 
                      className="space-y-6"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-center items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FF9900]/10 flex items-center justify-center">
                          <TrophyIcon className="w-6 h-6 text-[#FF9900]" />
                        </div>
                        <h4 className="text-2xl font-semibold text-[#E68A00]">Qualification Phase</h4>
                      </div>
                      <ul className="space-y-4 text-gray-300 ml-16">
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#FFAA33] mt-2" />
                          <span className="text-lg">Online qualification matches</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#FFAA33] mt-2" />
                          <span className="text-lg"><strong>Top 16</strong> teams advance</span>
                        </li>
                      </ul>
                    </motion.div>

                    <motion.div 
                      className="space-y-6"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-center items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FF9900]/10 flex items-center justify-center">
                          <TrophyIcon className="w-6 h-6 text-[#FF9900]" />
                        </div>
                        <h4 className="text-2xl font-semibold text-[#E68A00]">Elimination Phase</h4>
                      </div>
                      <ul className="space-y-4 text-gray-300 ml-16">
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#FFAA33] mt-2" />
                          <span className="text-lg">Sixteen teams compete <strong>in person</strong></span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#FFAA33] mt-2" />
                          <span className="text-lg">Single elimination playoffs</span>
                        </li>
                      </ul>
                    </motion.div>

                  </div>
                </motion.div>
              </div>
              
            </motion.div>
          </section>

          {/* Get Involved */}
          <section className="relative">
            <motion.div
              className="relative"
              variants={sectionVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center gap-4 mb-16">
                <div className="h-[1px] w-12 section-divider" />
                <h2 className="text-4xl font-bold text-center">Join the Movement</h2>
                <div className="h-[1px] w-12 section-divider" />
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-2xl font-semibold mb-6 text-[#E68A00]">For Competitors</h3>
                  <div className="space-y-6 text-gray-300">
                    <p className="leading-relaxed">
                      Form your team and develop cutting-edge AI algorithms using Python, or Javascript. Your bots will compete in thrilling matches that test their ability to:
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Manage resources strategically</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Coordinate team movements</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Adapt to unexpected challenges</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>

                <motion.div
                  className="card-gradient p-8 rounded-xl border border-[#333333] hover:border-[#FF9900]/40 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <h3 className="text-2xl font-semibold mb-6 text-[#E68A00]">For Contributors</h3>
                  <div className="space-y-6 text-gray-300">
                    <p className="leading-relaxed">
                      Be part of the team that's revolutionizing AI research through gaming. We're looking for passionate individuals to help with:
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Technical infrastructure and development</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Event organization and production</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-2" />
                        <span>Community engagement and outreach</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Vision */}
          <section className="relative pb-24">
            <motion.div
              className="max-w-4xl mx-auto text-center space-y-8"
              variants={sectionVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center gap-4 mb-16">
                <div className="h-[1px] w-12 section-divider" />
                <h2 className="text-4xl font-bold text-center">Our Vision</h2>
                <div className="h-[1px] w-12 section-divider" />
              </div>

              <p className="text-2xl text-gray-300 leading-relaxed">
                BlockWarriors is more than a competition—it's a movement to combine gaming with real-world AI research.
              </p>
              <p className="text-xl text-[#A67F5C] leading-relaxed">
                By using Minecraft as a research platform, we're fostering the next generation of intelligent, adaptable systems.
              </p>
              <motion.p
                className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#FF9900] via-[#E68A00] to-[#FFAA33]"
                whileHover={{ scale: 1.05 }}
              >
                Join us in transforming Minecraft into the ultimate AI research and competition playground.
              </motion.p>
            </motion.div>
          </section>
        </div>
      </div>
    </div>
  );
}

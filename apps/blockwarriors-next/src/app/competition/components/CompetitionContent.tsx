'use client';

import { motion } from 'framer-motion';
import {
  CodeBracketIcon,
  UserGroupIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { PageLayout } from '../../components/(pageLayout)/PageLayout';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';

export default function CompetitionContent() {
  const startTournament = useQuery(api.settings.getTournamentSettings) ?? false;
  const sectionVariants = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: 'easeOut' },
  };

  return (
    <PageLayout>
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
            innovation. Showcase your skills, compete with the best, and push
            the boundaries of AI development.
          </p>
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
                Teams compete in preliminary rounds to showcase their AI&apos;s
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
                    <span>Top performers advance to elimination rounds</span>
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
                    <span>Head-to-head matches between qualified teams</span>
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

      <section className="relative pb-12">
        <motion.div
          className="flex items-center justify-center gap-4 mb-16"
          variants={sectionVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <div className="h-[1px] w-12 section-divider" />
          <h2 className="text-4xl font-bold text-center text-gray-300">
            Get Involved
          </h2>
          <div className="h-[1px] w-12 section-divider" />
        </motion.div>

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
                Form your team and develop cutting-edge AI algorithms using
                Python, or Javascript. Your bots will compete in thrilling
                matches that test their ability to:
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
                Be part of the team that&apos;s revolutionizing AI research through
                gaming. We&apos;re looking for passionate individuals to help with:
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
                  <span>Unique marketing opportunities during events</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFAA33] mt-[5px]" />
                  <span>Engagement with cutting-edge AI projects</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative pb-12">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={sectionVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <div className="card-gradient p-12 rounded-2xl border border-[#A67F5C]/20 hover:border-[#FF9900]/40 transition-all duration-300 relative overflow-hidden">
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

            <h2 className="text-4xl font-bold text-gray-100 mb-6">
              Ready to Join the Competition?
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              Register now to secure your team&apos;s spot in this groundbreaking
              tournament.
            </p>
            <motion.button
              className={`inline-block px-8 py-3 bg-gradient-to-r from-[#FFA500] to-[#FFB733] rounded-lg text-black font-semibold relative group overflow-hidden ${!startTournament && 'opacity-50 cursor-not-allowed'}`}
              whileHover={startTournament ? { scale: 1.05 } : undefined}
              whileTap={startTournament ? { scale: 0.95 } : undefined}
              disabled={!startTournament}
            >
              <span className="relative z-10">
                {startTournament ? 'Register Your Team →' : 'Registration Coming Soon'}
              </span>
              <div className={`absolute inset-0 bg-gradient-to-r from-[#FFB733] to-[#FFA500] opacity-0 ${startTournament ? 'group-hover:opacity-100' : ''} transition-opacity duration-300`} />
            </motion.button>
          </div>
        </motion.div>
      </section>
    </PageLayout>
  );
}

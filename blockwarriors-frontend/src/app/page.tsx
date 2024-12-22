'use client';

import { Header } from './components/Header';
import { RegistrationBanner } from './components/RegistrationBanner';
import { motion } from 'framer-motion';
// import { getUser } from '@/lib/auth';

import {
  CodeBracketIcon,
  UserGroupIcon,
  TrophyIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

export default function Home() {

  // const user = getUser();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(/blockwarriors-ai-background.webp)`,
      }}
    >
      <div className="min-h-screen bg-black/70 backdrop-blur-sm text-white">
        
        <RegistrationBanner />

        <div className="container mx-auto px-4 py-12">
          
          <Header />

          {/* Hero Section */}
          <motion.div
            className="mb-12 relative overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative flex justify-center">
              <img
                src="/blockwarriors-ai-challenge-artwork.webp"
                alt="BlockWarriors AI Challenge Artwork"
                className="w-full h-auto rounded-2xl"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </motion.div>

          <div className="space-y-12">
            {/* Competition Introduction Block */}
            <motion.div
              className="bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-md rounded-lg p-8 border border-white/5 max-w-3xl mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
            >
              <motion.h1
                className="text-4xl font-bold mb-6 text-white flex items-center gap-3 justify-center"
                initial={fadeIn.initial}
                whileInView={fadeIn.animate}
                viewport={{ once: true, margin: '-100px' }}
                transition={fadeIn.transition}
              >
                <RocketLaunchIcon className="w-10 h-10 text-blue-400" />
                BlockWarriors AI Challenge
              </motion.h1>
              <motion.p
                className="text-xl text-gray-200 leading-relaxed tracking-wide text-center"
                initial={fadeIn.initial}
                whileInView={fadeIn.animate}
                viewport={{ once: true, margin: '-100px' }}
                transition={fadeIn.transition}
              >
                We are excited to announce the BlockWarriors AI Challenge, a
                unique global competition hosted by Princeton&apos;s E-Club.
                This event is designed to bring together the brightest minds in
                computer science to compete in Minecraft-based PvP minigames.
                Participants will form teams to design and implement algorithms
                that control a team of four AI bots.
              </motion.p>
            </motion.div>

            {/* Competition Details Block */}
            <motion.h2
              className="text-5xl font-bold text-white text-center mb-12"
              initial={{ scale: 1.2 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
            >
              Competition Details
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
            >
              <motion.div
                className="bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-md p-6 rounded-lg border border-white/5 transform hover:scale-105 transition-all"
                variants={fadeIn}
              >
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4 border-b border-white/10 pb-3 justify-center">
                  <CodeBracketIcon className="w-7 h-7 text-blue-400" />
                  Environment
                </h3>
                <p className="text-gray-200 leading-relaxed text-center">
                  Teams will deploy their code in a pre-configured environment.
                  The bots will operate autonomously, receiving a fixed-rate
                  stream of input data including position, health, hunger, and
                  more.
                </p>
              </motion.div>
              <motion.div
                className="bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-md p-6 rounded-lg border border-white/5 transform hover:scale-105 transition-all"
                variants={fadeIn}
              >
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4 border-b border-white/10 pb-3 justify-center">
                  <UserGroupIcon className="w-7 h-7 text-blue-400" />
                  Virtual Qualifier
                </h3>
                <p className="text-gray-200 leading-relaxed text-center">
                  Open to all. Teams from around the world are invited to
                  participate in this initial qualifying round.
                </p>
              </motion.div>
              <motion.div
                className="bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-md p-6 rounded-lg border border-white/5 transform hover:scale-105 transition-all"
                variants={fadeIn}
              >
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4 border-b border-white/10 pb-3 justify-center">
                  <TrophyIcon className="w-7 h-7 text-blue-400" />
                  Finals
                </h3>
                <p className="text-gray-200 leading-relaxed text-center">
                  The top 16 student teams will be invited to compete in-person,
                  with a maximum of 4 participants per team.
                </p>
              </motion.div>
            </motion.div>

            {/* Final Notes Block */}
            <motion.div
              className="bg-gradient-to-br from-white/10 to-black/20 backdrop-blur-md rounded-lg p-8 border border-white/5 max-w-3xl mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
            >
              <motion.p
                className="text-lg text-gray-200 leading-relaxed text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ delay: 0.8 }}
              >
                This competition not only tests programming prowess but also
                strategic thinking in dynamic and challenging scenarios. Join us
                to showcase your skills and innovate in this exciting event!
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Header } from './components/Header';
import { RegistrationBanner } from './components/RegistrationBanner';
import { motion } from 'framer-motion';
import {
  CodeBracketIcon,
  UserGroupIcon,
  TrophyIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
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
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1607988795691-3d0147b43231?auto=format&fit=crop&q=80')] bg-cover bg-center">
      <div className="min-h-screen bg-black/70 backdrop-blur-sm text-white">
        <RegistrationBanner />
        <div className="container mx-auto px-4 py-12">
          <Header />
          <motion.div
            className="max-w-3xl mx-auto bg-black/40 backdrop-blur-md rounded-lg p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="text-4xl font-bold mb-6 text-white flex items-center gap-3"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={fadeIn.transition}
            >
              <RocketLaunchIcon className="w-10 h-10 text-blue-400" />
              BlockWarriors AI Challenge
            </motion.h1>
            <motion.p
              className="text-xl mb-8 text-gray-200 leading-relaxed tracking-wide max-w-2xl mx-auto"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={fadeIn.transition}
            >
              We are excited to announce the BlockWarriors AI Challenge, a
              unique global competition hosted by Princeton&apos;s E-Club. This
              event is designed to bring together the brightest minds in
              computer science to compete in Minecraft-based PvP minigames.
              Participants will form teams to design and implement algorithms
              that control a team of four AI bots.
            </motion.p>

            <motion.h2
              className="text-2xl font-bold mb-4 text-white"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={fadeIn.transition}
            >
              Competition Details
            </motion.h2>
            <motion.div
              className="space-y-4"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              <motion.div
                className="bg-white/10 p-6 rounded-lg transform hover:scale-105 transition-transform"
                variants={fadeIn}
              >
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                  <CodeBracketIcon className="w-7 h-7 text-blue-400" />
                  Environment
                </h3>
                <p className="text-gray-200 leading-relaxed">
                  Teams will deploy their code in a pre-configured environment.
                  The bots will operate autonomously, receiving a fixed-rate
                  stream of input data including position, health, hunger, and
                  more.
                </p>
              </motion.div>
              <motion.div
                className="bg-white/10 p-6 rounded-lg transform hover:scale-105 transition-transform"
                variants={fadeIn}
              >
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                  <UserGroupIcon className="w-7 h-7 text-blue-400" />
                  Virtual Qualifier
                </h3>
                <p className="text-gray-200 leading-relaxed">
                  Open to all. Teams from around the world are invited to
                  participate in this initial qualifying round.
                </p>
              </motion.div>
              <motion.div
                className="bg-white/10 p-6 rounded-lg transform hover:scale-105 transition-transform"
                variants={fadeIn}
              >
                <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                  <TrophyIcon className="w-7 h-7 text-blue-400" />
                  Finals
                </h3>
                <p className="text-gray-200 leading-relaxed">
                  The top 16 student teams will be invited to compete in-person,
                  with a maximum of 4 participants per team.
                </p>
              </motion.div>
            </motion.div>

            <motion.p
              className="mt-12 text-lg text-gray-200 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
  );
}

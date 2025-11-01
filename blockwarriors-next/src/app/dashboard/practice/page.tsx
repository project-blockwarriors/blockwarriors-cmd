'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  ServerIcon,
  PlayIcon,
  UsersIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/auth/client';

type GameMode = 'bedwars' | 'pvp' | 'ctf';

interface ServerStatus {
  activeSessions: number;
  playersOnline: number;
  serverLoad: number;
}

export default function PracticePage() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    activeSessions: 0,
    playersOnline: 0,
    serverLoad: 0,
  });
  const [tokensGenerated, setTokensGenerated] = useState(false);

  const [matchId, setMatchId] = useState<string | null>(null);
  const [tokens, setTokens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const gameModes = [
    {
      id: 'bedwars',
      name: 'Bed Wars',
      description: 'Protect your bed and destroy others',
      players: '4v4',
      tokens: 8,
    },
    {
      id: 'pvp',
      name: 'Normal PvP',
      description: 'Classic player versus player combat',
      players: '1v1',
      tokens: 2,
    },
    {
      id: 'ctf',
      name: 'Capture the Flag',
      description: 'Strategic team-based gameplay',
      players: '5v5',
      tokens: 10,
    },
  ];

  const serverAddress = 'play.blockwarriors.ai';

  const generateTokens = async () => {
    console.log("generate tokens called");
    if (!selectedMode) return;

    setIsLoading(true);
    
    try {
      // Simulate token generation - this will eventually be handled by the Express server
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockToken = 'PLACEHOLDER_' + Math.random().toString(36).substring(2, 15);
      setToken('GAME_' + mockToken);
      
      // get jwttoken
      const session = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session found');
        return;
      }
      const { access_token } = session.data.session;
      console.log('Access Token:', access_token);

      const response = await fetch('http://localhost:3001/api/match/generate_tokens', {
        method: 'POST',
        // add authorization header
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${access_token}`,
      },
      body: JSON.stringify({ selectedMode }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start match');
      }

      const prefixedTokens = [];      
      const data = await response.json(); // a list of tokens
      data['tokens'].map((token) => {
        prefixedTokens.push('GAME_' + token);
      });

      setMatchId(data['matchId']);

      if (response.ok) {
        // response is ok, so display new start match button
        setTokensGenerated(true);
      }

      setTokens(prefixedTokens);
    } catch (error) {
      setTokensGenerated(false);
      console.error('Failed to start match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Invariant, tokens have been generated (within the last 10 minutes <-- IMPLEMENT THIS)
  const startMatch = async () => { 
    setIsLoading(true);

    const session = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      return;
    }

    // Get the associated match from any one of the tokens:
    const token = tokens[0];
    


    const response = await fetch('http://localhost:3001/api/match/start_match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokens, matchId }),
      });

    if (!response.ok) {
      throw new Error('Failed to start match');
    }

    setIsLoading(false);
  }



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <ServerIcon className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-white">Practice Arena</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {gameModes.map((mode) => (
          <motion.div
            key={mode.id}
            className={`bg-black/40 backdrop-blur-md rounded-lg p-6 cursor-pointer border-2 transition-all ${
              selectedMode === mode.id
                ? 'border-blue-500 bg-black/60'
                : 'border-transparent hover:border-white/20'
            }`}
            onClick={() => setSelectedMode(mode.id as GameMode)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              {mode.name}
            </h3>
            <p className="text-gray-400 text-sm mb-4">{mode.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{mode.players}</span>
              {selectedMode === mode.id && (
                <span className="text-blue-400">Selected</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-black/40 backdrop-blur-md rounded-lg p-6 mb-6"
      >
        <div className="border-b border-white/10 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-xl font-bold text-yellow-500">
              Important Notice
            </h3>
          </div>
          <div className="space-y-5 text-sm text-gray-300 leading-relaxed px-2">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-bold text-yellow-500 text-base mb-3 underline decoration-yellow-500/30 underline-offset-4">
                Current Setup
              </h4>
              <p className="italic">
                The server is currently configured to accept{' '}
                <span className="font-semibold text-white">client players</span>{' '}
                with valid tokens. This setup is temporary and is only available
                for{' '}
                <span className="font-semibold text-white">
                  practice matches
                </span>
                .
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-bold text-yellow-500 text-base mb-3 underline decoration-yellow-500/30 underline-offset-4">
                Future Changes
              </h4>
              <p className="italic">
                In upcoming tournament phases, contestants will need to{' '}
                <span className="font-semibold text-white">
                  upload their Minflayer code
                </span>{' '}
                directly through this dashboard. The code will then be{' '}
                <span className="font-semibold text-white">
                  executed server-side
                </span>{' '}
                for enhanced security and fairness.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <UsersIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Active Sessions</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {serverStatus.activeSessions}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <UsersIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Players Online</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {serverStatus.playersOnline}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <ServerIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Server Load</span>
            </div>
            <p className="text-2xl font-semibold text-white">
              {serverStatus.serverLoad}%
            </p>
          </div>
        </div>

        {!tokensGenerated ? <Button
          onClick={generateTokens}
          disabled={!selectedMode || isLoading}
          className="w-full flex items-center justify-center gap-2 py-6 text-lg"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
          {isLoading ? 'Generating Tokens...' : 'Generate Tokens'}
        </Button> : <Button
          onClick={startMatch}
          disabled={(!selectedMode || isLoading) && false}
          className="w-full flex items-center justify-center gap-2 py-6 text-lg"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
          {isLoading ? 'Starting Match...' : 'Start Match'}
        </Button>}
      </motion.div>

      {tokens && tokens.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <CommandLineIcon className="w-5 h-5 text-green-400" />
            <h3 className="text-green-400 font-medium">Connection Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm text-gray-400 mb-1">Server Address</h4>
              <div className="font-mono bg-black/20 p-2 rounded text-green-400 select-all flex items-center justify-between group">
                <span>{serverAddress}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(serverAddress)}
                  className="text-xs text-gray-500 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Copy
                </button>
              </div>
            </div>

            {tokens.map((token, index) => (
              <div key={token}>
                <h4 className="text-sm text-gray-400 mb-1">Login Token {tokens.length > 1 ? `#${index + 1}` : ''}</h4>
                <div className="font-mono bg-black/20 p-2 rounded text-green-400 select-all flex items-center justify-between group">
                  <span>{token}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(token)}
                    className="text-xs text-gray-500 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-sm text-gray-400">To join the game:</p>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Open Minecraft Java Edition</li>
              <li>Go to Multiplayer → Add Server</li>
              <li>Enter the server address</li>
              <li>
                Join the server and use{' '}
                <span className="text-green-400">/login [token]</span> to start
                playing
              </li>
            </ol>
            <p className="text-sm text-gray-400 mt-4">
              Tokens will expire in 5 minutes
            </p>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}

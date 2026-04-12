'use client';

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function TournamentsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Tournaments</h1>
      <p className="text-gray-400 mb-8">
        How competitive matches are organized, from registration through finals.
      </p>

      {/* Overview */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          How it works
        </h2>
        <div className="space-y-6">
          <Step
            number="1"
            title="Register your team"
            description="Create a team of 2-5 members on the dashboard. Each team programs bots collaboratively — you share a codebase."
          />
          <Step
            number="2"
            title="Join a tournament"
            description="Browse open tournaments on the dashboard and join with your team. Tournaments specify game types and bracket format."
          />
          <Step
            number="3"
            title="Get match tokens"
            description="When a match is created, each player slot gets a unique token. Find your tokens on the dashboard under your upcoming matches."
          />
          <Step
            number="4"
            title="Run your bots"
            description="Launch your bots with the match tokens. They connect, authenticate, and play autonomously. You cannot control them during the match."
          />
          <Step
            number="5"
            title="Results"
            description="Match results are recorded automatically. Win/loss records, stats, and replays (when available) appear on the dashboard."
          />
        </div>
      </section>

      {/* Match flow */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">Match flow</h2>
        <div className="space-y-2">
          <FlowStep status="Queuing" description="Match created by tournament system" />
          <FlowArrow />
          <FlowStep status="Waiting" description="Server acknowledges, generates tokens for each player slot" />
          <FlowArrow />
          <FlowStep status="Playing" description="All players connected and authenticated — match begins" />
          <FlowArrow />
          <FlowStep status="Finished" description="Win condition met — results recorded to leaderboard" />
        </div>
      </section>

      {/* Formats */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          Tournament formats
        </h2>
        <div className="space-y-3">
          <FormatCard
            name="Round Robin"
            status="Available"
            description="Every team plays every other team. Best overall record wins. Good for smaller tournaments."
          />
          <FormatCard
            name="Double Elimination"
            status="Coming Soon"
            description="Teams are eliminated after two losses. Includes winners and losers brackets."
          />
        </div>
      </section>

      {/* Team sizes */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">
          Team & bot counts by game
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="text-left py-2 text-gray-500 font-medium">
                  Game
                </th>
                <th className="text-left py-2 text-gray-500 font-medium">
                  Format
                </th>
                <th className="text-left py-2 text-gray-500 font-medium">
                  Bots per team
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-[#222]">
                <td className="py-2">PvP</td>
                <td className="py-2">1v1</td>
                <td className="py-2">1</td>
              </tr>
              <tr className="border-b border-[#222]">
                <td className="py-2 text-gray-500">Bridge</td>
                <td className="py-2 text-gray-500">1v1</td>
                <td className="py-2 text-gray-500">1</td>
              </tr>
              <tr className="border-b border-[#222]">
                <td className="py-2 text-gray-500">CTF</td>
                <td className="py-2 text-gray-500">4v4</td>
                <td className="py-2 text-gray-500">4</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <Alert className="bg-[#111] border-[#333]">
        <Info className="h-4 w-4 text-princeton-orange" />
        <AlertTitle className="text-white text-sm">
          Fully autonomous
        </AlertTitle>
        <AlertDescription className="text-gray-500 text-sm">
          Once a match starts, you cannot send commands or intervene. Your code
          must handle all situations autonomously. Test thoroughly before
          tournament day!
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-princeton-orange/10 flex items-center justify-center text-princeton-orange text-sm font-bold shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-white font-medium text-sm">{title}</h3>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}

function FlowStep({
  status,
  description,
}: {
  status: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111] border border-[#222]">
      <Badge
        variant="outline"
        className="border-princeton-orange/40 text-princeton-orange text-[10px] shrink-0"
      >
        {status}
      </Badge>
      <span className="text-gray-400 text-sm">{description}</span>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center">
      <div className="w-px h-4 bg-[#333]" />
    </div>
  );
}

function FormatCard({
  name,
  status,
  description,
}: {
  name: string;
  status: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-[#111] border border-[#222]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-white font-medium text-sm">{name}</span>
        <Badge
          variant="outline"
          className={
            status === 'Available'
              ? 'border-green-800/40 text-green-500 text-[10px]'
              : 'border-[#444] text-gray-600 text-[10px]'
          }
        >
          {status}
        </Badge>
      </div>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}

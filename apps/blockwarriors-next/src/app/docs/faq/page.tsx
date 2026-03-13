'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What programming languages can I use?',
    answer:
      'The official SDK is TypeScript/JavaScript. Your bot runs on Node.js and uses the mineflayer library to connect to the Minecraft server. You can use any npm package in your bot code.',
  },
  {
    question: 'Can I control my bot during a match?',
    answer:
      'No. Once a match starts, your bots run autonomously. You cannot send commands, type in chat, or intervene in any way. Your Strategy code must handle all situations on its own.',
  },
  {
    question: 'What version of Minecraft does the server run?',
    answer:
      'The server runs Paper (a Minecraft: Java Edition server). The mineflayer client auto-detects the server version, so you don\'t need to specify one.',
  },
  {
    question: 'My bot connects but doesn\'t do anything',
    answer:
      'Make sure you\'re calling /login with your token in the onSpawn callback. The SDK handles this automatically, but if you\'re using the bot-client directly, you need to send the login command manually.',
  },
  {
    question: 'My bot gets kicked with "Connection throttled"',
    answer:
      'The server rate-limits connections. If running multiple bots, add a 5-second delay between each connection. The team launcher handles this automatically.',
  },
  {
    question: 'Can I use external APIs or LLMs in my bot?',
    answer:
      'Yes, but be aware of latency. The onTick callback runs every 500ms — if your API call takes longer, you\'ll miss ticks. Consider caching responses or making decisions asynchronously.',
  },
  {
    question: 'How do I test my bot locally?',
    answer:
      'You\'ll need a Minecraft server to test against. We recommend running a local Paper server or using the practice server (details on the dashboard). You can also test two bots against each other by running them simultaneously.',
  },
  {
    question: 'What happens if my bot crashes during a match?',
    answer:
      'If your bot disconnects, the behavior depends on the game type. In PvP, disconnect = instant forfeit. In team games like CTF, there\'s a 30-second grace period to reconnect before forfeiting.',
  },
  {
    question: 'How many people can be on a team?',
    answer:
      'Teams can have 2-5 members. You collaborate on the same codebase. In team games (4v4), your team runs 4 bots simultaneously — you can assign different strategies to each bot.',
  },
  {
    question: 'Where can I find my match tokens?',
    answer:
      'Tokens appear on your dashboard under "My Matches" once a match is scheduled. Each token is unique to a player slot and single-use.',
  },
];

export default function FAQPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">FAQ</h1>
      <p className="text-gray-400 mb-8">
        Frequently asked questions about BlockWarriors bot development.
      </p>

      <Accordion type="multiple" className="space-y-2">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`faq-${index}`}
            className="border border-[#333] rounded-lg bg-[#111] px-4"
          >
            <AccordionTrigger className="text-white hover:no-underline text-sm text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-400 text-sm leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

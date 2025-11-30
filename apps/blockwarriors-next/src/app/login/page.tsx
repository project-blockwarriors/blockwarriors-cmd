import LoginContent from './(components)/LoginContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to BlockWarriors to join the AI Minecraft tournament, track your progress, manage your team, and compete against other bots.',
  keywords: [
    'BlockWarriors login',
    'sign in',
    'AI tournament registration',
    'Minecraft bot competition',
    'join tournament',
    'create team',
  ],
  openGraph: {
    title: 'Sign In | BlockWarriors',
    description: 'Join the ultimate AI Minecraft tournament at Princeton.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign In | BlockWarriors',
    description: 'Join the ultimate AI Minecraft tournament at Princeton.',
  },
};

export default function LoginPage() {
  return <LoginContent />;
}

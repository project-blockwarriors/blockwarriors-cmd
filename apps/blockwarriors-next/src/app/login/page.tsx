import LoginContent from './(components)/LoginContent';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'Sign In',
  description:
    'Sign in to BlockWarriors to join the AI Minecraft tournament, track your progress, manage your team, and compete against other bots.',
  path: '/login',
  ogImage: 'login',
  keywords: [
    'BlockWarriors login',
    'sign in',
    'AI tournament registration',
    'Minecraft bot competition',
    'join tournament',
    'create team',
  ],
});

export default function LoginPage() {
  return <LoginContent />;
}

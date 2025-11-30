'use client';

import GoogleSignInButton from '@/components/common/GoogleSignInButton';
import LoginForm from '@/app/login/(components)/LoginForm';
import { PageLayout } from '@/app/components/(pageLayout)/PageLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';

export default function LoginContent() {
  return (
    <PageLayout>
      <div className="flex justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="p-8 bg-card/80 backdrop-blur-md border-primary/20 shadow-xl shadow-primary/5">
            <CardHeader className="text-center pb-6">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Image
                    src="/blockwarriors-logo.png"
                    alt="BlockWarriors"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Sign in to <span className="text-primary">BlockWarriors</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Join the battle, become a legend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LoginForm />
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                </div>
              </div>
              <GoogleSignInButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

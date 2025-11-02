'use client';

import LoginForm from '@/app/login/(components)/LoginForm';
import { PageLayout, PageLayoutProps } from '@/app/components/(pageLayout)/PageLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type LoginContentProps = Omit<PageLayoutProps, 'children'> & {
  startTournament: boolean;
  showTopBanner: boolean;
  bannerTextContent: string;
  bannerButtonContent: string;
};

export default function LoginContent(props: LoginContentProps) {
  return (
    <PageLayout {...props}>
      <div className="flex justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="p-6 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Sign in to BlockWarriors
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                Join the battle, become a legend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

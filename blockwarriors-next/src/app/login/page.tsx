'use client';

import GoogleSignInButton from '@/app/components/GoogleSignInButton';

function LoginPage() {
  return (
    <div className="space-y-8">
      <GoogleSignInButton></GoogleSignInButton>
    </div>
  );
}

export default LoginPage;

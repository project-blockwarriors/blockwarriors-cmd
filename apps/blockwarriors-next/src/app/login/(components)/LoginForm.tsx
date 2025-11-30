'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Authentication logic will be implemented later
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-white mb-1.5"
        >
          Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          disabled
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="block w-full px-3 py-2 bg-secondary border border-primary/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder:text-muted-foreground"
          placeholder="Enter username"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-white mb-1.5"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          disabled
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="block w-full px-3 py-2 bg-secondary border border-primary/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder:text-muted-foreground"
          placeholder="Enter password"
          required
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            disabled
            className="h-4 w-4 text-primary focus:ring-primary border-primary/30 rounded bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 text-muted-foreground"
          >
            Remember me
          </label>
        </div>

        <Link
          href="/forgot-password"
          className="font-medium text-primary/50 hover:text-primary pointer-events-none"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Sign in'
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-primary/50 hover:text-primary pointer-events-none"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}

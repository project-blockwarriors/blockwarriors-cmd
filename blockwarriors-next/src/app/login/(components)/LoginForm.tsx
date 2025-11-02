"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (isSignUp) {
          // Validate password length on client side
          if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
          }
          
          const defaultName = formData.email.split("@")[0] || "User";
          await authClient.signUp.email(
            {
              email: formData.email.trim(),
              password: formData.password,
              name: defaultName.trim() || "User",
            },
            {
              onSuccess: async () => {
                toast.success("Account created successfully!");
                // New users always need to complete setup
                router.push("/dashboard/setup");
                router.refresh();
              },
              onError: (ctx) => {
                console.error("Sign up error:", ctx.error);
                console.error("Sign up error response:", ctx.response);
                // Better Auth provides detailed error messages
                const errorMessage = ctx.error.message || "Failed to sign up. Please check your email and password.";
                toast.error(errorMessage);
              },
            }
          );
        } else {
          await authClient.signIn.email(
            {
              email: formData.email,
              password: formData.password,
            },
            {
              onSuccess: () => {
                toast.success("Signed in successfully!");
                // Redirect to dashboard - middleware will handle redirect to setup if profile is incomplete
                router.push("/dashboard");
                router.refresh();
              },
              onError: (ctx) => {
                toast.error(ctx.error.message || "Failed to sign in");
              },
            }
          );
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.");
        console.error("Login error:", error);
      }
    });
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social(
        {
          provider: "google",
          callbackURL: "/dashboard", // Middleware will handle redirect to setup if profile is incomplete
        },
        {
          onSuccess: () => {
            // For OAuth flows, this callback might not execute immediately
            // Better Auth handles the redirect automatically via redirectURL
            toast.success("Redirecting to dashboard...");
          },
          onError: (ctx) => {
            setIsGoogleLoading(false);
            toast.error(ctx.error.message || "Failed to sign in with Google");
            console.error("Google sign in error:", ctx.error);
          },
        }
      );
      // Note: For OAuth flows, Better Auth automatically redirects to Google,
      // then Google redirects back to Better Auth's callback,
      // which then redirects to the callbackURL specified above
    } catch (error) {
      setIsGoogleLoading(false);
      toast.error("An error occurred. Please try again.");
      console.error("Google sign in error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="mt-1 block w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="mt-1 block w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex justify-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          isSignUp ? "Sign up" : "Sign in"
        )}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Image
              src="/google-logo.svg"
              alt="Google logo"
              width={18}
              height={18}
              className="w-[18px] h-[18px]"
            />
            <span>Continue with Google</span>
          </>
        )}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </button>
      </p>
    </form>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function DebugPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const sessionData = await authClient.getSession();
        if (sessionData?.data) {
          setSession(sessionData.data);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        toast.error("Failed to get session");
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();
  }, []);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      setSession(null);
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[url('/blockwarriors-ai-background.webp')] bg-cover bg-center">
        <div className="min-h-screen bg-black/60 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('/blockwarriors-ai-background.webp')] bg-cover bg-center">
      <div className="min-h-screen bg-black/60">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-gray-900 rounded-lg p-6 shadow-lg">
            <h1 className="text-2xl font-bold text-center mb-6 text-white">
              Debug Page
            </h1>

            <div className="space-y-6">
              <div className="p-4 bg-gray-800 rounded-md">
                <h2 className="font-semibold mb-2 text-white">
                  Authentication Status
                </h2>
                <p className="text-sm mb-4 text-gray-300">
                  Currently: {session?.user ? "Logged In" : "Not Logged In"}
                </p>

                {session?.user ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-300">
                      <p>
                        <strong>User ID:</strong> {session.user.id}
                      </p>
                      <p>
                        <strong>Email:</strong> {session.user.email}
                      </p>
                      <p>
                        <strong>Name:</strong> {session.user.name || "N/A"}
                      </p>
                    </div>
                    <Button
                      onClick={handleLogout}
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-300">
                    <p>Please log in to see your session information.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-800 rounded-md">
                <h2 className="font-semibold mb-2 text-white">
                  Debug Information
                </h2>
                <p className="text-sm text-gray-300">
                  Time: {new Date().toLocaleString()}
                </p>
                <p className="text-sm text-gray-300">
                  Auth Provider: Better Auth
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

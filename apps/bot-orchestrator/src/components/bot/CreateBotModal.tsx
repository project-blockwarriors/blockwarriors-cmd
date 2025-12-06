"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Bot, Key, User } from "lucide-react";

interface CreateBotModalProps {
  onCreateBot: (ign: string, token: string) => void;
}

export function CreateBotModal({ onCreateBot }: CreateBotModalProps) {
  const [open, setOpen] = useState(false);
  const [ign, setIgn] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!ign.trim()) {
      setError("IGN is required");
      return;
    }

    if (!token.trim()) {
      setError("Token is required");
      return;
    }

    // Validate IGN (Minecraft username rules)
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(ign)) {
      setError("IGN must be 3-16 characters (letters, numbers, underscore)");
      return;
    }

    onCreateBot(ign.trim(), token.trim());
    setIgn("");
    setToken("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Bot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-princeton" />
            Create New Bot
          </DialogTitle>
          <DialogDescription>
            Add a new bot to the orchestrator. The bot will join the
            BlockWarriors server and automatically login with the provided
            token.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="ign"
                className="text-sm font-medium flex items-center gap-2"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                In-Game Name (IGN)
              </label>
              <Input
                id="ign"
                placeholder="Steve"
                value={ign}
                onChange={(e) => setIgn(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                3-16 characters, letters, numbers, and underscores only
              </p>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="token"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Key className="h-4 w-4 text-muted-foreground" />
                Login Token
              </label>
              <Input
                id="token"
                type="password"
                placeholder="Enter your game token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                The token used for /login authentication
              </p>
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Bot</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

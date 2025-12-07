"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useBotStore } from "@/lib/store";

export function ServerSettingsModal() {
  const { serverConfig, updateServerConfig } = useBotStore();
  const [isOpen, setIsOpen] = useState(false);
  const [host, setHost] = useState(serverConfig.host);
  const [port, setPort] = useState(serverConfig.port.toString());

  useEffect(() => {
    setHost(serverConfig.host);
    setPort(serverConfig.port.toString());
  }, [serverConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = parseInt(port, 10);
    if (host && !isNaN(portNum) && portNum > 0 && portNum <= 65535) {
      console.log("Updating server config to:", host, portNum);
      updateServerConfig(host, portNum);
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset form to current server config when opening
      setHost(serverConfig.host);
      setPort(serverConfig.port.toString());
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Server Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Minecraft Server Settings</DialogTitle>
            <DialogDescription>
              Configure the Minecraft server IP and port that bots will connect
              to. This applies to all new bots created during this session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="host" className="text-sm font-medium">
                Server Host
              </label>
              <Input
                id="host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="mcpanel.blockwarriors.ai"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="port" className="text-sm font-medium">
                Server Port
              </label>
              <Input
                id="port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="25565"
                min="1"
                max="65535"
                required
              />
            </div>
            <div className="text-sm text-muted-foreground border-l-2 border-yellow-500 pl-3 py-1">
              <strong>Note:</strong> This will only affect new bots. Existing
              bots will remain connected to their original server.
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

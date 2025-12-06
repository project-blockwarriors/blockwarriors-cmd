"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/types/bot";
import { MessageSquare } from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  botNames: Map<string, string>;
}

export function ChatPanel({ messages, botNames }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-princeton" />
          Chat Log
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 space-y-1">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No messages yet
              </div>
            ) : (
              messages.map((msg, index) => {
                const botName = botNames.get(msg.botId) || "Unknown";
                return (
                  <div
                    key={index}
                    className="text-sm font-mono py-1 border-b border-border/50 last:border-0"
                  >
                    <span className="text-muted-foreground text-xs">
                      [{formatTime(msg.timestamp)}]
                    </span>{" "}
                    <span className="text-princeton text-xs">({botName})</span>{" "}
                    <span className="text-blue-400">{msg.username}:</span>{" "}
                    <span className="text-foreground">{msg.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

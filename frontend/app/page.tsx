"use client";

import { ConversationList } from "@/components/ConversationList";
import { ChatWindow } from "@/components/ChatWindow";
import { RobotAvatar } from "@/components/RobotAvatar";
import { RobotStatusPanel } from "@/components/RobotStatusPanel";
import { EnvironmentVisualizer } from "@/components/EnvironmentVisualizer";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-800 flex flex-col bg-slate-900">
        <ConversationList />
      </aside>

      {/* Center: chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatWindow />
      </main>

      {/* Right panel: avatar + status */}
      <aside className="w-72 shrink-0 border-l border-slate-800 flex flex-col bg-slate-900">
        <div className="flex flex-col items-center pt-6 px-4">
          <RobotAvatar />
        </div>
        <div className="flex-1 overflow-y-auto">
          <RobotStatusPanel />
          <EnvironmentVisualizer />
        </div>
      </aside>
    </div>
  );
}

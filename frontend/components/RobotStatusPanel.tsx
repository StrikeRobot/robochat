"use client";

import { useRobotStore } from "@/lib/store";
import { Zap, Radio, Activity, Clock } from "lucide-react";

const COMMAND_ICONS: Record<string, string> = {
  wave: "👋",
  dance: "💃",
  move_forward: "⬆️",
  move_back: "⬇️",
  turn_left: "↩️",
  turn_right: "↪️",
  pick_up: "🤏",
  put_down: "📦",
  scan: "🔍",
  charge: "⚡",
  sleep: "😴",
  wake: "👁️",
  report: "📋",
};

export function RobotStatusPanel() {
  const { lastCommand, commandFeed, avatarState } = useRobotStore();

  const isOnline = true;
  const battery = 87;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Divider */}
      <div className="border-t border-slate-800" />

      {/* System vitals */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          System
        </p>
        <div className="space-y-2">
          {/* Online status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Radio size={12} />
              <span>Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-xs text-emerald-400">Online</span>
            </div>
          </div>

          {/* Battery */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Zap size={12} />
              <span>Battery</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${battery}%` }}
                />
              </div>
              <span className="text-xs text-slate-300">{battery}%</span>
            </div>
          </div>

          {/* CPU / mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Activity size={12} />
              <span>Mode</span>
            </div>
            <span className="text-xs text-slate-300 capitalize">{avatarState}</span>
          </div>
        </div>
      </div>

      {/* Last command */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Last Command
        </p>
        {lastCommand ? (
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-lg" role="img" aria-label={lastCommand.command}>
                {COMMAND_ICONS[lastCommand.command] ?? "🤖"}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">
                  {lastCommand.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(lastCommand.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-600 italic">No commands yet</p>
        )}
      </div>

      {/* Command history */}
      {commandFeed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Command History
          </p>
          <div className="space-y-1">
            {commandFeed.slice(0, 8).map((cmd, i) => (
              <div
                key={`${cmd.command}-${cmd.timestamp}`}
                className="flex items-center gap-2 py-1"
              >
                <Clock size={10} className="text-slate-600 shrink-0" />
                <span className="text-xs text-slate-500 shrink-0">
                  {new Date(cmd.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="text-xs text-slate-400 truncate">
                  {COMMAND_ICONS[cmd.command] ?? "🤖"} {cmd.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

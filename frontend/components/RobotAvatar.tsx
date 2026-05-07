"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRobotStore, type AvatarState } from "@/lib/store";

const STATE_LABELS: Record<AvatarState, string> = {
  idle: "Idle",
  listening: "Listening...",
  thinking: "Thinking...",
  speaking: "Speaking",
  executing: "Executing",
};

const LED_COLORS: Record<AvatarState, string> = {
  idle: "#22d3ee",
  listening: "#67e8f9",
  thinking: "#fbbf24",
  speaking: "#34d399",
  executing: "#f97316",
};

const STATE_BADGE_COLORS: Record<AvatarState, string> = {
  idle: "bg-slate-700 text-slate-300",
  listening: "bg-cyan-900 text-cyan-300",
  thinking: "bg-yellow-900 text-yellow-300",
  speaking: "bg-emerald-900 text-emerald-300",
  executing: "bg-orange-900 text-orange-300",
};

// Mouth path d-attribute for each state
const MOUTH_PATHS: Record<AvatarState, string> = {
  idle: "M 72 116 Q 100 119 128 116",
  listening: "M 72 116 Q 100 116 128 116",
  thinking: "M 76 118 Q 100 114 124 118",
  speaking: "M 70 112 Q 100 128 130 112",
  executing: "M 68 110 Q 100 130 132 110",
};

export function RobotAvatar() {
  const avatarState = useRobotStore((s) => s.avatarState);
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Idle blink timer
  useEffect(() => {
    if (avatarState !== "idle" && avatarState !== "listening") return;

    const schedule = () =>
      setTimeout(
        () => {
          setIsBlinking(true);
          setTimeout(() => {
            setIsBlinking(false);
            schedule();
          }, 150);
        },
        2500 + Math.random() * 2000
      );

    const timer = schedule();
    return () => clearTimeout(timer);
  }, [avatarState]);

  // Speaking mouth animation
  useEffect(() => {
    if (avatarState !== "speaking") {
      setMouthOpen(false);
      return;
    }
    const interval = setInterval(() => setMouthOpen((v) => !v), 180);
    return () => clearInterval(interval);
  }, [avatarState]);

  const ledColor = LED_COLORS[avatarState];
  const mouthPath =
    avatarState === "speaking" && mouthOpen
      ? MOUTH_PATHS.executing
      : MOUTH_PATHS[avatarState];

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Robot SVG */}
      <svg
        viewBox="0 0 200 220"
        width="180"
        height="198"
        role="img"
        aria-label={`RoboChat avatar — ${STATE_LABELS[avatarState]}`}
      >
        {/* Antenna */}
        <line
          x1="100"
          y1="32"
          x2="100"
          y2="12"
          stroke="#475569"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <motion.circle
          cx={100}
          cy={8}
          r={7}
          fill={ledColor}
          animate={{
            opacity: avatarState === "thinking" ? [1, 0.3, 1] : 1,
            scale: avatarState === "executing" ? [1, 1.3, 1] : 1,
          }}
          transition={{
            duration: avatarState === "thinking" ? 1 : 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ filter: `drop-shadow(0 0 6px ${ledColor})` }}
        />

        {/* Head */}
        <rect
          x={18}
          y={32}
          width={164}
          height={120}
          rx={18}
          fill="#0f172a"
          stroke="#0e7490"
          strokeWidth="2"
        />

        {/* Corner bolts */}
        {[
          [30, 46],
          [170, 46],
          [30, 134],
          [170, 134],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={4} fill="#1e293b" stroke="#334155" strokeWidth="1" />
        ))}

        {/* Cheek circuit panels */}
        <rect x={22} y={85} width={28} height={24} rx={4} fill="#0a1628" stroke="#0e7490" strokeWidth="1" />
        <line x1={26} y1={92} x2={46} y2={92} stroke="#0e7490" strokeWidth="1" opacity={0.7} />
        <line x1={26} y1={97} x2={40} y2={97} stroke="#0e7490" strokeWidth="1" opacity={0.5} />
        <line x1={26} y1={102} x2={44} y2={102} stroke="#0e7490" strokeWidth="1" opacity={0.4} />

        <rect x={150} y={85} width={28} height={24} rx={4} fill="#0a1628" stroke="#0e7490" strokeWidth="1" />
        <line x1={154} y1={92} x2={174} y2={92} stroke="#0e7490" strokeWidth="1" opacity={0.7} />
        <line x1={160} y1={97} x2={174} y2={97} stroke="#0e7490" strokeWidth="1" opacity={0.5} />
        <line x1={156} y1={102} x2={174} y2={102} stroke="#0e7490" strokeWidth="1" opacity={0.4} />

        {/* Left eye */}
        <motion.ellipse
          cx={68}
          cy={82}
          rx={26}
          fill="#0891b2"
          initial={{ ry: 22 }}
          animate={{ ry: isBlinking ? 2 : 22 }}
          transition={{ duration: 0.07 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <motion.circle
          cx={68}
          r={13}
          fill="#020817"
          initial={{ cy: 82 }}
          animate={{ cy: isBlinking ? 82 : avatarState === "listening" ? 79 : 82 }}
          transition={{ duration: 0.15 }}
        />
        <circle cx={62} cy={76} r={4} fill="white" opacity={0.9} />
        {/* Listening iris ring */}
        {avatarState === "listening" && (
          <motion.circle
            cx={68}
            cy={79}
            r={16}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={1.5}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}

        {/* Right eye */}
        <motion.ellipse
          cx={132}
          cy={82}
          rx={26}
          fill="#0891b2"
          initial={{ ry: 22 }}
          animate={{ ry: isBlinking ? 2 : 22 }}
          transition={{ duration: 0.07 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <motion.circle
          cx={132}
          r={13}
          fill="#020817"
          initial={{ cy: 82 }}
          animate={{ cy: isBlinking ? 82 : avatarState === "listening" ? 79 : 82 }}
          transition={{ duration: 0.15 }}
        />
        <circle cx={126} cy={76} r={4} fill="white" opacity={0.9} />
        {avatarState === "listening" && (
          <motion.circle
            cx={132}
            cy={79}
            r={16}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={1.5}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
          />
        )}

        {/* Nose sensor */}
        <rect x={93} y={100} width={14} height={10} rx={3} fill="#1e293b" />
        <motion.rect
          x={96}
          y={103}
          width={8}
          height={4}
          rx={2}
          fill={ledColor}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Mouth */}
        <motion.path
          d={mouthPath}
          stroke="#22d3ee"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          animate={{ d: mouthPath }}
          transition={{ duration: 0.12, ease: "easeInOut" }}
        />

        {/* Thinking dots */}
        <AnimatePresence>
          {avatarState === "thinking" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx={86 + i * 14}
                  cy={116}
                  r={3}
                  fill="#fbbf24"
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 1, 0], y: [-2, -6, -2] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Neck */}
        <rect x={82} y={152} width={36} height={14} rx={5} fill="#1e293b" stroke="#334155" strokeWidth="1" />

        {/* Body */}
        <rect x={16} y={166} width={168} height={42} rx={12} fill="#0f172a" stroke="#0e7490" strokeWidth="1.5" />

        {/* Body indicator lights */}
        {[
          { x: 32, color: avatarState === "executing" ? "#f97316" : "#0e7490" },
          { x: 85, color: ledColor },
          { x: 138, color: avatarState === "speaking" ? "#34d399" : "#0e7490" },
        ].map(({ x, color }, i) => (
          <motion.rect
            key={i}
            x={x}
            y={177}
            width={30}
            height={20}
            rx={4}
            fill="#0a1628"
            stroke={color}
            strokeWidth={1.5}
            animate={{ opacity: avatarState !== "idle" ? [0.7, 1, 0.7] : 0.7 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </svg>

      {/* State badge */}
      <div className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${STATE_BADGE_COLORS[avatarState]}`}>
        {STATE_LABELS[avatarState]}
      </div>
    </div>
  );
}

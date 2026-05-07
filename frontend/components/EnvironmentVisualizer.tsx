"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRobotStore } from "@/lib/store";

// ── Types ────────────────────────────────────────────────────────────────────

type ObjType = "wall" | "furniture" | "person" | "obstacle" | "device";

interface EnvObject {
  id: number;
  label: string;
  type: ObjType;
  /** 0 = north, clockwise degrees */
  angle: number;
  /** 0–1, fraction of radar radius */
  distance: number;
  pingDelay: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<ObjType, string> = {
  wall: "#f97316",
  furniture: "#22d3ee",
  person: "#4ade80",
  obstacle: "#fb7185",
  device: "#a78bfa",
};

const TYPE_LABELS: Record<ObjType, string> = {
  wall: "Structure",
  furniture: "Furniture",
  person: "Person",
  obstacle: "Obstacle",
  device: "Device",
};

const SIZE = 224;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 14;
const SWEEP_MS = 2800;

// Pool of possible objects — walls are always included, others sampled randomly
const POOL: Omit<EnvObject, "id" | "pingDelay">[] = [
  { label: "North Wall",      type: "wall",      angle: 358, distance: 0.88 },
  { label: "East Wall",       type: "wall",      angle: 91,  distance: 0.90 },
  { label: "South Wall",      type: "wall",      angle: 181, distance: 0.86 },
  { label: "West Wall",       type: "wall",      angle: 270, distance: 0.91 },
  { label: "Sofa",            type: "furniture", angle: 46,  distance: 0.58 },
  { label: "Coffee Table",    type: "furniture", angle: 158, distance: 0.44 },
  { label: "Armchair",        type: "furniture", angle: 222, distance: 0.52 },
  { label: "Bookshelf",       type: "furniture", angle: 312, distance: 0.71 },
  { label: "Door",            type: "obstacle",  angle: 129, distance: 0.87 },
  { label: "Window",          type: "wall",      angle: 31,  distance: 0.90 },
  { label: "Potted Plant",    type: "furniture", angle: 258, distance: 0.64 },
  { label: "Floor Lamp",      type: "device",    angle: 76,  distance: 0.42 },
  { label: "TV Stand",        type: "furniture", angle: 196, distance: 0.67 },
  { label: "Person detected", type: "person",    angle: 332, distance: 0.36 },
  { label: "Cabinet",         type: "furniture", angle: 103, distance: 0.72 },
  { label: "Charging Dock",   type: "device",    angle: 285, distance: 0.55 },
  { label: "Rug",             type: "furniture", angle: 170, distance: 0.28 },
  { label: "Fire Sensor",     type: "device",    angle: 60,  distance: 0.93 },
];

function generateScan(): EnvObject[] {
  const walls = POOL.filter((o) => o.type === "wall");
  const others = POOL.filter((o) => o.type !== "wall")
    .sort(() => Math.random() - 0.5)
    .slice(0, 5 + Math.floor(Math.random() * 5));

  return [...walls, ...others]
    .sort((a, b) => a.angle - b.angle)
    .map((o, i) => ({
      ...o,
      id: i,
      angle: (o.angle + (Math.random() * 8 - 4) + 360) % 360,
      distance: Math.min(0.95, Math.max(0.2, o.distance + (Math.random() * 0.06 - 0.03))),
      pingDelay: Math.random() * 0.4,
    }));
}

// Convert polar coords (0=north, CW) to SVG x/y
function polar(angleDeg: number, dist: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + dist * R * Math.cos(rad), y: CY + dist * R * Math.sin(rad) };
}

// SVG arc path for the sweep fan sector
function fanPath(leadAngle: number, spanDeg: number): string {
  const trailAngle = leadAngle - spanDeg;
  const lead = polar(leadAngle, 1);
  const trail = polar(trailAngle, 1);
  const large = spanDeg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${trail.x} ${trail.y} A ${R} ${R} 0 ${large} 1 ${lead.x} ${lead.y} Z`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EnvironmentVisualizer() {
  const commandFeed = useRobotStore((s) => s.commandFeed);

  const [objects, setObjects] = useState<EnvObject[]>([]);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const [scanCount, setScanCount] = useState(0);

  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const lastScanTsRef = useRef<number | undefined>(undefined);

  const triggerScan = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const objs = generateScan();
    setObjects(objs);
    setVisibleIds(new Set());
    setSweepAngle(0);
    setScanning(true);
    setScanCount((n) => n + 1);
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - startRef.current) / SWEEP_MS, 1);
      const angle = t * 360;
      setSweepAngle(angle);
      setVisibleIds((prev) => {
        const next = new Set(prev);
        objs.forEach((o) => {
          if (angle >= o.angle) next.add(o.id);
        });
        return next;
      });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setVisibleIds(new Set(objs.map((o) => o.id)));
        setScanning(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Watch for new scan commands
  useEffect(() => {
    const latestScan = commandFeed.find((c) => c.command === "scan");
    if (latestScan && latestScan.timestamp !== lastScanTsRef.current) {
      lastScanTsRef.current = latestScan.timestamp;
      triggerScan();
    }
  }, [commandFeed, triggerScan]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const hasData = objects.length > 0;
  const leadPt = polar(sweepAngle, 1);

  // Derive unique types present for legend
  const presentTypes = Array.from(new Set(objects.map((o) => o.type))) as ObjType[];

  return (
    <AnimatePresence>
      {hasData && (
        <motion.div
          key="env-vis"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <div className="px-4 pt-1 pb-4">
            {/* Section header */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Environment Scan
              </p>
              {scanning ? (
                <span className="text-[10px] text-cyan-400 animate-pulse">● Scanning…</span>
              ) : (
                <span className="text-[10px] text-emerald-400">
                  {visibleIds.size} objects
                </span>
              )}
            </div>

            {/* Radar display */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#020f0f]">
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" className="block">
                <defs>
                  {/* Radial glow behind centre */}
                  <radialGradient id={`bgGlow-${scanCount}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="#0e7490" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0e7490" stopOpacity="0" />
                  </radialGradient>
                  {/* Fan gradient: opaque at leading edge, transparent behind */}
                  <linearGradient id={`fanGrad-${scanCount}`}
                    x1="0%" y1="0%" x2="100%" y2="0%"
                    gradientTransform={`rotate(${sweepAngle - 90}, ${CX}, ${CY})`}
                  >
                    <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.28" />
                  </linearGradient>
                </defs>

                {/* Background glow circle */}
                <circle cx={CX} cy={CY} r={R} fill={`url(#bgGlow-${scanCount})`} />

                {/* Range rings */}
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <circle
                    key={f} cx={CX} cy={CY} r={R * f}
                    fill="none"
                    stroke={f === 1 ? "#134e4a" : "#0d3535"}
                    strokeWidth={f === 1 ? 1.5 : 1}
                    strokeDasharray={f < 1 ? "3 4" : undefined}
                  />
                ))}

                {/* Cardinal cross-hairs */}
                {[0, 90, 180, 270].map((a) => {
                  const pt = polar(a, 1);
                  return (
                    <line key={a} x1={CX} y1={CY} x2={pt.x} y2={pt.y}
                      stroke="#0d3535" strokeWidth={1} />
                  );
                })}

                {/* Compass labels */}
                {[
                  { l: "N", a: 0 }, { l: "E", a: 90 },
                  { l: "S", a: 180 }, { l: "W", a: 270 },
                ].map(({ l, a }) => {
                  const { x, y } = polar(a, 1.12);
                  return (
                    <text key={l} x={x} y={y} textAnchor="middle"
                      dominantBaseline="middle" fontSize={7}
                      fill="#1e5c5c" fontFamily="monospace">
                      {l}
                    </text>
                  );
                })}

                {/* Range labels */}
                {[0.25, 0.5, 0.75].map((f) => (
                  <text key={f} x={CX + 3} y={CY - R * f - 2}
                    fontSize={5} fill="#1a4a4a" fontFamily="monospace">
                    {Math.round(f * 8)}m
                  </text>
                ))}

                {/* Sweep fan */}
                {scanning && (
                  <path
                    d={fanPath(sweepAngle, 55)}
                    fill={`url(#fanGrad-${scanCount})`}
                    opacity={0.9}
                  />
                )}

                {/* Sweep line */}
                {scanning && (
                  <line
                    x1={CX} y1={CY}
                    x2={leadPt.x} y2={leadPt.y}
                    stroke="#22d3ee"
                    strokeWidth={1.5}
                    opacity={0.95}
                    style={{ filter: "drop-shadow(0 0 3px #22d3ee)" }}
                  />
                )}

                {/* Detected objects */}
                <AnimatePresence>
                  {objects
                    .filter((o) => visibleIds.has(o.id))
                    .map((obj) => {
                      const { x, y } = polar(obj.angle, obj.distance);
                      const color = TYPE_COLORS[obj.type];
                      return (
                        <motion.g
                          key={`${obj.id}-${scanCount}`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                          {/* Ping ripple */}
                          <motion.circle cx={x} cy={y} fill="none"
                            stroke={color} strokeWidth={0.8}
                            initial={{ r: 3, opacity: 0.7 }}
                            animate={{ r: 10, opacity: 0 }}
                            transition={{
                              duration: 1.4,
                              repeat: Infinity,
                              delay: obj.pingDelay,
                              ease: "easeOut",
                            }}
                          />
                          {/* Dot */}
                          <circle cx={x} cy={y} r={3.5} fill={color} opacity={0.9}
                            style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
                          <circle cx={x} cy={y} r={1.5} fill="white" opacity={0.85} />
                        </motion.g>
                      );
                    })}
                </AnimatePresence>

                {/* Robot at centre */}
                <circle cx={CX} cy={CY} r={5} fill="#0e7490" opacity={0.9}
                  style={{ filter: "drop-shadow(0 0 4px #22d3ee)" }} />
                <circle cx={CX} cy={CY} r={2.5} fill="#22d3ee" />
                <motion.circle cx={CX} cy={CY} r={8} fill="none"
                  stroke="#22d3ee" strokeWidth={0.8}
                  animate={{ r: [8, 16], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              </svg>

              {/* Legend */}
              <div className="px-3 pb-2.5 flex flex-wrap gap-x-3 gap-y-1">
                {presentTypes.map((type) => (
                  <div key={type} className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: TYPE_COLORS[type] }} />
                    <span className="text-[10px] text-slate-500">{TYPE_LABELS[type]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detected object list */}
            <AnimatePresence>
              {!scanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 max-h-36 overflow-y-auto space-y-0.5 pr-0.5"
                >
                  {objects.map((obj) => {
                    const color = TYPE_COLORS[obj.type];
                    const distM = (obj.distance * 8).toFixed(1);
                    const bearing = Math.round(obj.angle);
                    return (
                      <div key={obj.id}
                        className="flex items-center gap-2 py-0.5 px-1.5 rounded hover:bg-slate-800/50 transition-colors">
                        <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }} />
                        <span className="text-[11px] text-slate-400 truncate flex-1">
                          {obj.label}
                        </span>
                        <span className="text-[10px] text-slate-600 shrink-0 font-mono">
                          {bearing}°
                        </span>
                        <span className="text-[10px] text-slate-600 shrink-0 font-mono w-8 text-right">
                          {distM}m
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

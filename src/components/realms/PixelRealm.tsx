import React, { useEffect, useRef, useState } from 'react';
import type { SubjectId } from '../../types';

interface RealmCanvasProps {
  subjectId: SubjectId;
  unlockedElements: string[];
  level: number;
  totalMinutes: number;
  width?: number;
  height?: number;
  miniMode?: boolean;
  animated?: boolean;
}

// ============================================================
// ISOMETRIC 3D DIORAMA REALM ENGINE
// Inspired by Forest: Stay Focused isometric diorama gardens
// ============================================================

interface TreeObject {
  gx: number;
  gy: number;
  kind: 'round' | 'pine' | 'cherry' | 'autumn' | 'celestial' | 'mushroom' | 'bush' | 'landmark' | 'flower';
  color: string;
  accentColor?: string;
  size: number;
  minProgress: number; // 0 to 1 threshold of unlock/study
  subType?: string;
}

// Theme configurations for all 5 subjects
interface SubjectTheme {
  name: string;
  badge: string;
  skyTop: string;
  skyBottom: string;
  grassLight: string;
  grassDark: string;
  cliffLeft: string;
  cliffRight: string;
  cliffLayer: string;
  accent: string;
  treePalettes: {
    round: string[];
    pine: string[];
    cherry: string[];
    autumn: string[];
    celestial: string[];
    mushroom: string[];
    bush: string[];
  };
}

const THEMES: Record<SubjectId, SubjectTheme> = {
  daa: {
    name: 'Algorithmic Forest',
    badge: '🌲 DAA Forest',
    skyTop: '#081c15',
    skyBottom: '#1b4332',
    grassLight: '#74c655',
    grassDark: '#5fb240',
    cliffLeft: '#6b4c2b',
    cliffRight: '#543b20',
    cliffLayer: '#402c18',
    accent: '#4ade80',
    treePalettes: {
      round: ['#2d9348', '#38b000', '#55a630', '#70e000'],
      pine: ['#1b4332', '#2d6a4f', '#40916c'],
      cherry: ['#f472b6', '#fb7185', '#fbcfe8'],
      autumn: ['#f59e0b', '#d97706', '#ea580c'],
      celestial: ['#38bdf8', '#0284c7', '#0369a1'],
      mushroom: ['#ef4444', '#dc2626', '#b91c1c'],
      bush: ['#4ade80', '#22c55e', '#86efac'],
    },
  },
  os: {
    name: 'Mountain of Systems',
    badge: '⛰️ OS Mountain',
    skyTop: '#0b132b',
    skyBottom: '#1c2541',
    grassLight: '#8ecae6',
    grassDark: '#72b6d6',
    cliffLeft: '#4a5568',
    cliffRight: '#334155',
    cliffLayer: '#1e293b',
    accent: '#60a5fa',
    treePalettes: {
      round: ['#48cae4', '#0096c7', '#0077b6'],
      pine: ['#1e3a8a', '#1d4ed8', '#2563eb', '#93c5fd'],
      cherry: ['#c084fc', '#a855f7', '#ddd6fe'],
      autumn: ['#64748b', '#94a3b8', '#cbd5e1'],
      celestial: ['#60a5fa', '#93c5fd', '#bfdbfe'],
      mushroom: ['#38bdf8', '#0ea5e9', '#0284c7'],
      bush: ['#93c5fd', '#60a5fa', '#7dd3fc'],
    },
  },
  nosql: {
    name: 'Data City',
    badge: '🏙️ NoSQL City',
    skyTop: '#130026',
    skyBottom: '#2d004d',
    grassLight: '#ec4899',
    grassDark: '#db2777',
    cliffLeft: '#581c87',
    cliffRight: '#3b0764',
    cliffLayer: '#240046',
    accent: '#f472b6',
    treePalettes: {
      round: ['#c026d3', '#a21caf', '#86198f'],
      pine: ['#7c3aed', '#6d28d9', '#5b21b6'],
      cherry: ['#f472b6', '#f43f5e', '#fb7185'],
      autumn: ['#f97316', '#ea580c', '#c2410c'],
      celestial: ['#06b6d4', '#0891b2', '#22d3ee'],
      mushroom: ['#e11d48', '#be123c', '#9f1239'],
      bush: ['#f472b6', '#ec4899', '#f9a8d4'],
    },
  },
  hda_cognitive: {
    name: 'Mind & Healthcare Discovery',
    badge: '🔬 Mind & Healthcare',
    skyTop: '#0f172a',
    skyBottom: '#1e1b4b',
    grassLight: '#a78bfa',
    grassDark: '#8b5cf6',
    cliffLeft: '#4338ca',
    cliffRight: '#312e81',
    cliffLayer: '#1e1b4b',
    accent: '#c4b5fd',
    treePalettes: {
      round: ['#8b5cf6', '#7c3aed', '#6d28d9'],
      pine: ['#0284c7', '#0369a1', '#075985'],
      cherry: ['#f472b6', '#e879f9', '#d946ef'],
      autumn: ['#10b981', '#059669', '#047857'],
      celestial: ['#c084fc', '#a855f7', '#9333ea'],
      mushroom: ['#6366f1', '#4f46e5', '#4338ca'],
      bush: ['#c4b5fd', '#a78bfa', '#ddd6fe'],
    },
  },
  gv: {
    name: 'Graph Realm',
    badge: '🔗 Graph Realm',
    skyTop: '#1a0b00',
    skyBottom: '#3d1a00',
    grassLight: '#fb923c',
    grassDark: '#f97316',
    cliffLeft: '#78350f',
    cliffRight: '#5c2707',
    cliffLayer: '#451a03',
    accent: '#fdba74',
    treePalettes: {
      round: ['#ea580c', '#c2410c', '#9a3412'],
      pine: ['#d97706', '#b45309', '#92400e'],
      cherry: ['#fbbf24', '#f59e0b', '#fde047'],
      autumn: ['#ef4444', '#dc2626', '#b91c1c'],
      celestial: ['#facc15', '#eab308', '#ca8a04'],
      mushroom: ['#f97316', '#ea580c', '#c2410c'],
      bush: ['#fdba74', '#fb923c', '#fed7aa'],
    },
  },
};

// Deterministic layout generator for 8x8 island
function buildIslandLayout(theme: SubjectTheme, subjectId: SubjectId): TreeObject[] {
  const gridSize = 8;
  const objects: TreeObject[] = [];

  const types: ('round' | 'pine' | 'cherry' | 'autumn' | 'celestial' | 'mushroom' | 'bush')[] = [
    'round', 'pine', 'cherry', 'autumn', 'celestial', 'mushroom', 'bush',
  ];

  // Fill grid tiles
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      // Center landmark spot
      if (gx === 3 && gy === 3) {
        objects.push({
          gx,
          gy,
          kind: 'landmark',
          color: theme.accent,
          size: 38,
          minProgress: 0.15,
        });
        continue;
      }

      // Pseudo-random deterministic hashing
      const seed = (gx * 37 + gy * 73 + subjectId.charCodeAt(0) * 11) % 100;
      const typeIdx = seed % types.length;
      const kind = types[typeIdx];
      const palette = theme.treePalettes[kind];
      const color = palette[seed % palette.length];

      // Sizing variation
      const size = 18 + (seed % 10);

      // Radial distance for unlock progression: center unlocks first, edges last
      const distFromCenter = Math.hypot(gx - 3.5, gy - 3.5) / 5;
      const minProgress = Math.min(0.95, Math.max(0.02, distFromCenter * 0.8 + (seed % 15) * 0.01));

      objects.push({
        gx,
        gy,
        kind,
        color,
        size,
        minProgress,
      });
    }
  }

  return objects;
}

// Cache layouts so they are stable
const LAYOUT_CACHE: Partial<Record<SubjectId, TreeObject[]>> = {};
function getIslandLayout(subjectId: SubjectId): TreeObject[] {
  if (!LAYOUT_CACHE[subjectId]) {
    LAYOUT_CACHE[subjectId] = buildIslandLayout(THEMES[subjectId], subjectId);
  }
  return LAYOUT_CACHE[subjectId]!;
}

// Convert grid (gx, gy) to 2.5D isometric screen coords
function toIso(gx: number, gy: number, tw: number, th: number, ox: number, oy: number) {
  return {
    sx: (gx - gy) * (tw / 2) + ox,
    sy: (gx + gy) * (th / 2) + oy,
  };
}

// ============================================================
// DRAWING ROUTINES FOR CHARMING TREES & STRUCTURES
// ============================================================

// 1. Lush Round Tree (Fruit / Apple / Blossom style)
function drawLushRoundTree(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  size: number,
  color: string,
  time: number
) {
  const sway = Math.sin(time * 1.5 + sx * 0.1) * 1.2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, size * 0.42, size * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brown trunk
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(sx - 2.5 + sway * 0.2, sy - size * 0.25, 5, size * 0.3);

  // Canopy base (dark)
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.arc(sx + sway, sy - size * 0.45, size * 0.46, 0, Math.PI * 2);
  ctx.fill();

  // Canopy main
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx + sway, sy - size * 0.5, size * 0.44, 0, Math.PI * 2);
  ctx.fill();

  // Fluffy clouds highlight
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.arc(sx + sway - size * 0.12, sy - size * 0.62, size * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Cute fruits or stars
  ctx.fillStyle = '#fef08a';
  for (let i = 0; i < 3; i++) {
    const fx = sx + sway + Math.cos(i * 2.1) * size * 0.22;
    const fy = sy - size * 0.5 + Math.sin(i * 2.1) * size * 0.2;
    ctx.fillRect(fx - 1.5, fy - 1.5, 3, 3);
  }
}

// 2. Evergreen Pine / Cedar Tree
function drawEvergreenPine(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  size: number,
  color: string,
  time: number
) {
  const sway = Math.sin(time * 1.2 + sx * 0.08) * 1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, size * 0.35, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#4a2e1b';
  ctx.fillRect(sx - 2, sy - size * 0.2, 4, size * 0.25);

  // 3-tiered pine layers
  const tiers = [0.85, 0.6, 0.38];
  tiers.forEach((scale, i) => {
    const layerBaseY = sy - size * (0.15 + i * 0.25);
    const w = size * scale * 0.55;
    const h = size * 0.32;

    // Dark base
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.moveTo(sx + sway, layerBaseY - h);
    ctx.lineTo(sx - w - 1 + sway, layerBaseY + 1);
    ctx.lineTo(sx + w + 1 + sway, layerBaseY + 1);
    ctx.closePath();
    ctx.fill();

    // Leaf body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx + sway, layerBaseY - h);
    ctx.lineTo(sx - w + sway, layerBaseY);
    ctx.lineTo(sx + w + sway, layerBaseY);
    ctx.closePath();
    ctx.fill();

    // Snow or frost tip
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(sx + sway, layerBaseY - h);
    ctx.lineTo(sx - w * 0.4 + sway, layerBaseY - h * 0.5);
    ctx.lineTo(sx + w * 0.4 + sway, layerBaseY - h * 0.5);
    ctx.closePath();
    ctx.fill();
  });
}

// 3. Cherry Blossom / Sakura Tree
function drawCherryBlossom(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  size: number,
  time: number
) {
  const sway = Math.sin(time * 1.4 + sx * 0.1) * 1.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, size * 0.45, size * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Curved dark wood trunk
  ctx.strokeStyle = '#4c2e1e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(sx + 3, sy - size * 0.25, sx + sway, sy - size * 0.4);
  ctx.stroke();

  // Cloud of pastel pink petals
  const clusters = [
    { dx: 0, dy: -0.5, r: 0.38, c: '#f472b6' },
    { dx: -0.2, dy: -0.45, r: 0.28, c: '#fb7185' },
    { dx: 0.2, dy: -0.48, r: 0.3, c: '#fbcfe8' },
    { dx: -0.05, dy: -0.65, r: 0.25, c: '#ffffff' },
  ];

  clusters.forEach(cl => {
    ctx.fillStyle = cl.c;
    ctx.beginPath();
    ctx.arc(sx + sway + cl.dx * size, sy + cl.dy * size, size * cl.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 4. Golden Autumn Tree
function drawGoldenAutumn(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  size: number,
  time: number
) {
  const sway = Math.sin(time * 1.3 + sx * 0.1) * 1.2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, size * 0.4, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#653a1a';
  ctx.fillRect(sx - 2.5, sy - size * 0.25, 5, size * 0.3);

  // Gradient warm canopy
  const colors = ['#dc2626', '#ea580c', '#f59e0b', '#fde047'];
  colors.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(sx + sway - (i - 1.5) * 3, sy - size * (0.35 + i * 0.1), size * (0.4 - i * 0.06), 0, Math.PI * 2);
    ctx.fill();
  });
}

// 5. Celestial Glowing / Magic Tree
function drawCelestialTree(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  size: number,
  color: string,
  time: number
) {
  const sway = Math.sin(time * 1.6 + sx * 0.1) * 1.5;
  const pulse = 0.8 + 0.2 * Math.sin(time * 3 + sx);

  // Soft aura glow
  ctx.fillStyle = `${color}33`;
  ctx.beginPath();
  ctx.arc(sx + sway, sy - size * 0.5, size * 0.6 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Silver trunk
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(sx - 2, sy - size * 0.25, 4, size * 0.3);

  // Magic canopy
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx + sway, sy - size * 0.5, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Floating star / crescent on top
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx + sway - 2, sy - size * 0.95, 4, 4);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(sx + sway - 3, sy - size * 0.94, 6, 2);
  ctx.fillRect(sx + sway - 1, sy - size * 0.98, 2, 6);
}

// 6. Magic Mushroom Tree
function drawMagicMushroom(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  size: number,
  color: string,
  time: number
) {
  const bob = Math.sin(time * 2 + sx * 0.1) * 1;

  // Stem
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(sx - 4, sy);
  ctx.lineTo(sx - 2.5, sy - size * 0.35);
  ctx.lineTo(sx + 2.5, sy - size * 0.35);
  ctx.lineTo(sx + 4, sy);
  ctx.closePath();
  ctx.fill();

  // Cap dome
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx, sy - size * 0.4 + bob, size * 0.45, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  // Polka dots
  ctx.fillStyle = '#ffffff';
  [
    { x: 0, y: -0.65, r: 0.08 },
    { x: -0.22, y: -0.48, r: 0.07 },
    { x: 0.22, y: -0.48, r: 0.07 },
  ].forEach(dot => {
    ctx.beginPath();
    ctx.arc(sx + dot.x * size, sy + dot.y * size + bob, size * dot.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 7. Flowering Bush
function drawFloweringBush(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  size: number,
  color: string,
  time: number
) {
  const sway = Math.sin(time * 1.8 + sx * 0.1) * 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx + sway, sy - size * 0.2, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Flowers
  ctx.fillStyle = '#fef08a';
  for (let i = 0; i < 3; i++) {
    const fx = sx + sway + Math.cos(i * 2) * size * 0.18;
    const fy = sy - size * 0.25 + Math.sin(i * 2) * size * 0.12;
    ctx.fillRect(fx - 1.5, fy - 1.5, 3, 3);
  }
}

// 8. Realm Specific Central Landmark
function drawLandmark(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  size: number,
  subjectId: SubjectId,
  _theme: SubjectTheme,
  time: number
) {
  const pulse = Math.sin(time * 2) * 2;

  if (subjectId === 'daa') {
    // Ancient Giant Knowledge Tree of Algorithms
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(sx - 6, sy - size * 0.5, 12, size * 0.55);

    // Glowing rune canopy
    ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
    ctx.beginPath();
    ctx.arc(sx, sy - size * 0.8, size * 0.65 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(sx, sy - size * 0.8, size * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(sx, sy - size * 0.85, size * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Floating knowledge crown
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('⚡', sx - 6, sy - size * 1.35 + pulse);
  } else if (subjectId === 'os') {
    // OS Summit Observatory & Flag
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(sx, sy - size * 0.4, 18, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(sx - 1, sy - size * 0.8, 2, 24);

    // Summit Flag
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(sx + 1, sy - size * 0.8, 14, 8);
  } else if (subjectId === 'nosql') {
    // Cyber Data Obelisk
    ctx.fillStyle = '#581c87';
    ctx.fillRect(sx - 10, sy - size * 0.9, 20, size * 0.9);

    ctx.fillStyle = '#f472b6';
    ctx.fillRect(sx - 8, sy - size * 0.85, 16, size * 0.8);

    // Neon signal ring
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy - size * 0.9 + pulse, 18, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (subjectId === 'hda_cognitive') {
    // Mind & Healthcare Observatory Temple
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(sx - 14, sy - size * 0.6, 28, size * 0.6);

    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.arc(sx, sy - size * 0.65, 16, Math.PI, 0);
    ctx.fill();

    // Dual glow beacon
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(sx - 8, sy - size * 0.9 + pulse, 4, 4);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(sx + 4, sy - size * 0.9 + pulse, 4, 4);
  } else {
    // Graph Nexus Crystal
    ctx.fillStyle = 'rgba(251, 146, 60, 0.3)';
    ctx.beginPath();
    ctx.arc(sx, sy - size * 0.5, size * 0.5 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(sx, sy - size * 0.9);
    ctx.lineTo(sx + 14, sy - size * 0.4);
    ctx.lineTo(sx, sy + 2);
    ctx.lineTo(sx - 14, sy - size * 0.4);
    ctx.closePath();
    ctx.fill();
  }
}

// ============================================================
// MAIN ISOMETRIC RENDER LOOP
// ============================================================

export const PixelRealm: React.FC<RealmCanvasProps> = ({
  subjectId,
  unlockedElements,
  level,
  totalMinutes,
  width,
  height,
  miniMode = false,
  animated = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [size, setSize] = useState<{ w: number; h: number }>({
    w: width || 600,
    h: height || 400,
  });

  // Track container size dynamically if fixed width/height aren't enforced
  useEffect(() => {
    if (width && height) {
      setSize({ w: width, h: height });
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(200, Math.floor(rect.width));
      const h = Math.max(160, Math.floor(rect.height));
      setSize(prev => (prev.w !== w || prev.h !== h ? { w, h } : prev));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const theme = THEMES[subjectId] || THEMES.daa;
    const allObjects = getIslandLayout(subjectId);

    // Calculate progression ratio (0 to 1) based on unlocks & minutes
    const maxProgressionElements = 12;
    const progressFromElements = Math.min(1, unlockedElements.length / maxProgressionElements);
    const progressFromMinutes = Math.min(1, totalMinutes / 300);
    const overallProgress = Math.max(0.1, Math.max(progressFromElements, progressFromMinutes));

    const curW = size.w;
    const curH = size.h;

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;

      ctx.clearRect(0, 0, curW, curH);

      // 1. Dreamy Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, curH);
      bg.addColorStop(0, theme.skyTop);
      bg.addColorStop(1, theme.skyBottom);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, curW, curH);

      // Atmospheric twinkling stars / magical fireflies
      for (let i = 0; i < 28; i++) {
        const starX = ((i * 71.3 + subjectId.charCodeAt(0) * 19) % curW);
        const starY = ((i * 47.7 + t * 4) % (curH * 0.9));
        const alpha = 0.2 + 0.5 * Math.abs(Math.sin(t * 1.5 + i));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(starX, starY, 1.5, 1.5);
      }

      // 2. Isometric Diorama Island Geometry
      const gridSize = 8;
      // Calculate tile size so the island comfortably fits both width and height
      const maxTileWFromWidth = Math.floor((curW * 0.76) / gridSize);
      const maxTileWFromHeight = Math.floor((curH * 0.56) / (gridSize * 0.5 + 1.2));
      const tileW = Math.max(24, Math.min(maxTileWFromWidth, maxTileWFromHeight, 76));
      const tileH = Math.floor(tileW * 0.5);
      const cliffDepth = Math.max(16, Math.floor(tileW * 0.65));

      const islandVisualHeight = gridSize * tileH + cliffDepth;
      const offsetX = Math.floor(curW / 2);
      const offsetY = Math.floor((curH - islandVisualHeight) / 2) + Math.floor(tileH * 0.4);
      const treeScale = tileW / 40;

      // Grid corner vertices:
      // Bottom: (gridSize, gridSize)
      const botPt = toIso(gridSize, gridSize, tileW, tileH, offsetX, offsetY);
      // Right: (gridSize, 0)
      const rightPt = toIso(gridSize, 0, tileW, tileH, offsetX, offsetY);
      // Left: (0, gridSize)
      const leftPt = toIso(0, gridSize, tileW, tileH, offsetX, offsetY);

      // 3. Floating Island Bedrock Cliff Base (3D depth)
      // Left cliff face
      ctx.fillStyle = theme.cliffLeft;
      ctx.beginPath();
      ctx.moveTo(leftPt.sx, leftPt.sy);
      ctx.lineTo(botPt.sx, botPt.sy);
      ctx.lineTo(botPt.sx, botPt.sy + cliffDepth);
      ctx.lineTo(leftPt.sx, leftPt.sy + cliffDepth);
      ctx.closePath();
      ctx.fill();

      // Right cliff face (darker shaded)
      ctx.fillStyle = theme.cliffRight;
      ctx.beginPath();
      ctx.moveTo(botPt.sx, botPt.sy);
      ctx.lineTo(rightPt.sx, rightPt.sy);
      ctx.lineTo(rightPt.sx, rightPt.sy + cliffDepth);
      ctx.lineTo(botPt.sx, botPt.sy + cliffDepth);
      ctx.closePath();
      ctx.fill();

      // Earth strata layer line
      ctx.fillStyle = theme.cliffLayer;
      ctx.beginPath();
      ctx.moveTo(leftPt.sx, leftPt.sy + cliffDepth * 0.45);
      ctx.lineTo(botPt.sx, botPt.sy + cliffDepth * 0.45);
      ctx.lineTo(botPt.sx, botPt.sy + cliffDepth * 0.6);
      ctx.lineTo(leftPt.sx, leftPt.sy + cliffDepth * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(botPt.sx, botPt.sy + cliffDepth * 0.45);
      ctx.lineTo(rightPt.sx, rightPt.sy + cliffDepth * 0.45);
      ctx.lineTo(rightPt.sx, rightPt.sy + cliffDepth * 0.6);
      ctx.lineTo(botPt.sx, botPt.sy + cliffDepth * 0.6);
      ctx.closePath();
      ctx.fill();

      // 4. Grass Top Surface Tiles (Diamond checkerboard)
      for (let gx = 0; gx < gridSize; gx++) {
        for (let gy = 0; gy < gridSize; gy++) {
          const { sx, sy } = toIso(gx, gy, tileW, tileH, offsetX, offsetY);
          const hw = tileW / 2;
          const hh = tileH / 2;

          ctx.fillStyle = (gx + gy) % 2 === 0 ? theme.grassLight : theme.grassDark;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + hw, sy + hh);
          ctx.lineTo(sx, sy + tileH);
          ctx.lineTo(sx - hw, sy + hh);
          ctx.closePath();
          ctx.fill();

          // Front-edge grass overhang rim
          if (gx === gridSize - 1 || gy === gridSize - 1) {
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            ctx.fillRect(sx - hw, sy + hh, tileW, 2);
          }
        }
      }

      // 5. Render Trees & Structures (Sorted back-to-front by gx + gy)
      // Filter objects based on user's unlock / study progress
      const visibleObjects = allObjects.filter(obj => obj.minProgress <= overallProgress);
      visibleObjects.sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));

      visibleObjects.forEach(obj => {
        const { sx, sy } = toIso(obj.gx, obj.gy, tileW, tileH, offsetX, offsetY);
        const baseSx = sx;
        const baseSy = sy + tileH * 0.65; // Anchor tree root to tile center
        const treeSize = Math.round(obj.size * treeScale);

        switch (obj.kind) {
          case 'round':
            drawLushRoundTree(ctx, baseSx, baseSy, treeSize, obj.color, t);
            break;
          case 'pine':
            drawEvergreenPine(ctx, baseSx, baseSy, treeSize, obj.color, t);
            break;
          case 'cherry':
            drawCherryBlossom(ctx, baseSx, baseSy, treeSize, t);
            break;
          case 'autumn':
            drawGoldenAutumn(ctx, baseSx, baseSy, treeSize, t);
            break;
          case 'celestial':
            drawCelestialTree(ctx, baseSx, baseSy, treeSize, obj.color, t);
            break;
          case 'mushroom':
            drawMagicMushroom(ctx, baseSx, baseSy, treeSize, obj.color, t);
            break;
          case 'bush':
            drawFloweringBush(ctx, baseSx, baseSy, treeSize, obj.color, t);
            break;
          case 'landmark':
            drawLandmark(ctx, baseSx, baseSy, treeSize, subjectId, theme, t);
            break;
        }
      });

      // 6. UI Overlays on the Diorama
      if (!miniMode) {
        // Realm Title Badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(12, 12, 180, 26);
        ctx.strokeStyle = `${theme.accent}66`;
        ctx.lineWidth = 1;
        ctx.strokeRect(12, 12, 180, 26);

        ctx.fillStyle = theme.accent;
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText(theme.badge, 22, 29);

        // Tree Counter (Inspired by Forest screenshot "🌱 153")
        const treeCount = visibleObjects.length;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(curW - 110, curH - 34, 98, 24);
        ctx.strokeStyle = `${theme.accent}55`;
        ctx.strokeRect(curW - 110, curH - 34, 98, 24);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillText(`🌱 ${treeCount} trees`, curW - 100, curH - 18);
      }

      if (animated) {
        animFrameRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [subjectId, unlockedElements, level, totalMinutes, size, miniMode, animated]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={size.w}
        height={size.h}
        style={{
          width: `${size.w}px`,
          height: `${size.h}px`,
          imageRendering: 'pixelated',
        }}
        className="block"
      />
    </div>
  );
};

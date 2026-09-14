import React, { useEffect, useRef } from 'react';
import type { SubjectId } from '../../types';

interface IsometricRealmPlotProps {
  subjectId: SubjectId;
  level?: number;
  totalMinutes?: number;
  width?: number;
  height?: number;
  className?: string;
  showRelic?: boolean;
  animated?: boolean;
}

export const IsometricRealmPlot: React.FC<IsometricRealmPlotProps> = ({
  subjectId,
  level = 1,
  totalMinutes = 0,
  width = 360,
  height = 240,
  className = '',
  showRelic = true,
  animated = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      if (animated) {
        timeRef.current += 0.04;
      }
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      // Adaptive isometric parameters
      const originX = Math.floor(width / 2);
      const originY = Math.floor(height * 0.32);
      const tileW = Math.max(28, Math.floor(width / 8.5));
      const tileH = Math.floor(tileW * 0.52);
      const halfW = tileW / 2;
      const halfH = tileH / 2;

      // Coordinate converter: grid (gx, gy, gz) -> screen (x, y)
      const toScreen = (gx: number, gy: number, gz: number = 0) => {
        return {
          x: originX + (gx - gy) * halfW,
          y: originY + (gx + gy) * halfH - gz,
        };
      };

      // Helper: draw single flat diamond tile
      const drawDiamond = (
        p: { x: number; y: number },
        fillColor: string,
        strokeColor?: string
      ) => {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - halfH);
        ctx.lineTo(p.x + halfW, p.y);
        ctx.lineTo(p.x, p.y + halfH);
        ctx.lineTo(p.x - halfW, p.y);
        ctx.closePath();
        ctx.fill();

        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      };

      // Helper: draw 4-pointed sparkle cross (+) for water or magic
      const drawSparkle = (x: number, y: number, alpha: number, color: string = '#ffffff') => {
        if (alpha <= 0.05) return;
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
        ctx.fillStyle = color;
        // Center pixel
        ctx.fillRect(x, y, 2, 2);
        // Arms
        ctx.fillRect(x - 2, y, 2, 2);
        ctx.fillRect(x + 2, y, 2, 2);
        ctx.fillRect(x, y - 2, 2, 2);
        ctx.fillRect(x, y + 2, 2, 2);
        ctx.restore();
      };

      // Helper: draw stepped cliff block with masonry walls and scalloped grass lip
      const drawSteppedBlock = (
        gx: number,
        gy: number,
        gz: number,
        blockDepth: number,
        type: 'grass' | 'sand' | 'stone' | 'snow' | 'ruins' | 'quartz' | 'darkstone',
        options?: {
          scalloped?: boolean;
          wallBaseColor?: string;
          wallMortarColor?: string;
          wallHighlightColor?: string;
          topCustomColor?: string;
        }
      ) => {
        const p = toScreen(gx, gy, gz);
        const scalloped = options?.scalloped ?? (type === 'grass' || type === 'snow');

        // Palette presets per surface type
        let topFill = '#7ec850';
        let topStroke = 'rgba(0,0,0,0.06)';
        let wallBaseLeft = options?.wallBaseColor || '#b89270';
        let wallBaseRight = '#8d6848';
        let wallMortar = options?.wallMortarColor || '#5d402b';
        let wallHighlight = options?.wallHighlightColor || '#d4ae8a';

        if (type === 'grass') {
          topFill = options?.topCustomColor || '#76c444';
        } else if (type === 'sand') {
          topFill = '#f3ca94';
          wallBaseLeft = '#cfa170';
          wallBaseRight = '#9f7347';
        } else if (type === 'stone') {
          topFill = '#cbd5e1';
          wallBaseLeft = '#94a3b8';
          wallBaseRight = '#64748b';
          wallMortar = '#475569';
          wallHighlight = '#e2e8f0';
        } else if (type === 'snow') {
          topFill = '#f8fafc';
          wallBaseLeft = '#cbd5e1';
          wallBaseRight = '#94a3b8';
          wallMortar = '#64748b';
          wallHighlight = '#ffffff';
        } else if (type === 'ruins') {
          topFill = '#fdf4ff';
          wallBaseLeft = '#d8b4fe';
          wallBaseRight = '#a855f7';
          wallMortar = '#7e22ce';
          wallHighlight = '#fae8ff';
        } else if (type === 'quartz') {
          topFill = '#fdf4ff';
          wallBaseLeft = '#d8b4fe';
          wallBaseRight = '#a855f7';
          wallMortar = '#6b21a8';
          wallHighlight = '#fae8ff';
        } else if (type === 'darkstone') {
          topFill = '#475569';
          wallBaseLeft = '#334155';
          wallBaseRight = '#1e293b';
          wallMortar = '#0f172a';
          wallHighlight = '#64748b';
        }

        // Draw Left Face (Sunlit masonry)
        ctx.fillStyle = wallBaseLeft;
        ctx.beginPath();
        ctx.moveTo(p.x - halfW, p.y);
        ctx.lineTo(p.x, p.y + halfH);
        ctx.lineTo(p.x, p.y + halfH + blockDepth);
        ctx.lineTo(p.x - halfW, p.y + blockDepth);
        ctx.closePath();
        ctx.fill();

        // Draw Right Face (Shadow masonry)
        ctx.fillStyle = wallBaseRight;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + halfH);
        ctx.lineTo(p.x + halfW, p.y);
        ctx.lineTo(p.x + halfW, p.y + blockDepth);
        ctx.lineTo(p.x, p.y + halfH + blockDepth);
        ctx.closePath();
        ctx.fill();

        // Stone Brick Courses (Horizontal Mortar Lines) on both faces
        const courseHeight = 7;
        const courses = Math.floor(blockDepth / courseHeight);

        for (let c = 1; c <= courses; c++) {
          const dy = c * courseHeight;

          // Left face mortar line
          ctx.strokeStyle = wallMortar;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - halfW, p.y + dy);
          ctx.lineTo(p.x, p.y + halfH + dy);
          ctx.stroke();

          // Left face brick top highlight
          ctx.strokeStyle = wallHighlight;
          ctx.beginPath();
          ctx.moveTo(p.x - halfW, p.y + dy - 1);
          ctx.lineTo(p.x, p.y + halfH + dy - 1);
          ctx.stroke();

          // Vertical mortar joints on left face
          const vOffset = (c % 2 === 0 ? halfW * 0.45 : halfW * 0.75);
          ctx.strokeStyle = wallMortar;
          ctx.beginPath();
          ctx.moveTo(p.x - halfW + vOffset, p.y + (vOffset * (halfH / halfW)) + dy - courseHeight);
          ctx.lineTo(p.x - halfW + vOffset, p.y + (vOffset * (halfH / halfW)) + dy);
          ctx.stroke();

          // Right face mortar line
          ctx.strokeStyle = wallMortar;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + halfH + dy);
          ctx.lineTo(p.x + halfW, p.y + dy);
          ctx.stroke();
        }

        // Draw Top Diamond Face
        drawDiamond(p, topFill, topStroke);

        // Top surface micro-details: grass flecks or sand speckles
        if (type === 'grass') {
          ctx.fillStyle = '#a4e044';
          ctx.fillRect(p.x - 4, p.y - 2, 2, 2);
          ctx.fillRect(p.x + 3, p.y + 1, 2, 2);
          ctx.fillStyle = '#589e30';
          ctx.fillRect(p.x - 2, p.y + 3, 2, 2);
        } else if (type === 'sand') {
          ctx.fillStyle = '#deb37d';
          ctx.fillRect(p.x - 3, p.y - 1, 1, 1);
          ctx.fillRect(p.x + 2, p.y + 2, 1, 1);
        }

        // Scalloped Grass / Snow Overhang Lip
        if (scalloped && blockDepth >= 6) {
          const fringeColor = type === 'snow' ? '#ffffff' : (options?.topCustomColor || '#76c444');
          const shadowColor = type === 'snow' ? '#94a3b8' : '#4d8a28';

          // Shadow under fringe
          ctx.fillStyle = shadowColor;
          ctx.fillRect(p.x - halfW + 3, p.y + 3, 4, 3);
          ctx.fillRect(p.x - halfW + 10, p.y + 6, 4, 4);
          ctx.fillRect(p.x - 6, p.y + halfH + 1, 4, 4);
          ctx.fillRect(p.x + 2, p.y + halfH + 1, 4, 4);
          ctx.fillRect(p.x + halfW - 12, p.y + 6, 4, 4);

          // Grass fringe teeth
          ctx.fillStyle = fringeColor;
          ctx.fillRect(p.x - halfW + 3, p.y + 1, 4, 3);
          ctx.fillRect(p.x - halfW + 10, p.y + 4, 4, 3);
          ctx.fillRect(p.x - 6, p.y + halfH - 1, 4, 3);
          ctx.fillRect(p.x + 2, p.y + halfH - 1, 4, 3);
          ctx.fillRect(p.x + halfW - 12, p.y + 4, 4, 3);
        }
      };

      // Helper: draw crystal lagoon water tile with caustics, submerged sand, ripples
      const drawWaterTile = (
        gx: number,
        gy: number,
        gz: number = 0,
        options?: { tint?: string; showSubmergedPaver?: boolean }
      ) => {
        const p = toScreen(gx, gy, gz);
        const waterColor = options?.tint || 'rgba(88, 182, 180, 0.82)';

        // Deep riverbed / submerged stone
        drawDiamond(p, '#3b8686');

        if (options?.showSubmergedPaver) {
          ctx.fillStyle = '#327272';
          ctx.fillRect(p.x - 6, p.y - 3, 12, 6);
        }

        // Crystal water surface overlay
        drawDiamond(p, waterColor);

        // Water surface ripples
        const wave = Math.sin(t * 2.5 + gx * 1.5 + gy * 0.8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x - 8 + wave * 2, p.y);
        ctx.lineTo(p.x + 4 + wave * 2, p.y);
        ctx.stroke();

        // Shimmering sun sparkle crosses
        const sparklePhase = Math.sin(t * 3.5 + gx * 4 + gy * 2);
        if (sparklePhase > 0.4) {
          const alpha = (sparklePhase - 0.4) / 0.6;
          drawSparkle(p.x + 2, p.y - 2, alpha, '#ffffff');
        }
      };

      // Helper: draw submerged wooden dock post
      const drawDockPost = (screenX: number, screenY: number) => {
        ctx.fillStyle = 'rgba(30, 60, 60, 0.5)';
        ctx.fillRect(screenX - 3, screenY, 6, 8);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX - 5, screenY - 1, 10, 3);

        ctx.fillStyle = '#8c603a';
        ctx.fillRect(screenX - 3, screenY - 14, 6, 14);

        ctx.fillStyle = '#4e331c';
        ctx.fillRect(screenX - 3, screenY - 3, 6, 3);

        ctx.fillStyle = '#b0845a';
        ctx.fillRect(screenX - 3, screenY - 15, 6, 2);
      };

      // Helper: draw cute pixel mascot critter sitting/standing in world
      const drawCuteMascot = (
        screenX: number,
        screenY: number,
        mascotType: SubjectId
      ) => {
        const bob = Math.sin(t * 3.5) * 1.5;
        const my = screenY + bob;

        // Shadow under mascot
        ctx.fillStyle = 'rgba(20, 35, 30, 0.28)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 4, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (mascotType === 'daa') {
          // Woodland Moss Fox / Kitty
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(screenX - 6, my - 6, 12, 10);
          ctx.fillStyle = '#fff7ed';
          ctx.fillRect(screenX - 3, my - 3, 6, 7);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(screenX - 7, my - 16, 14, 11);
          ctx.fillStyle = '#fff7ed';
          ctx.fillRect(screenX - 7, my - 8, 3, 3);
          ctx.fillRect(screenX + 4, my - 8, 3, 3);
          ctx.fillStyle = '#c2410c';
          ctx.fillRect(screenX - 6, my - 20, 4, 4);
          ctx.fillRect(screenX + 2, my - 20, 4, 4);
          ctx.fillStyle = '#ffedd5';
          ctx.fillRect(screenX - 5, my - 19, 2, 2);
          ctx.fillRect(screenX + 3, my - 19, 2, 2);
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(screenX + 4, my - 22, 3, 3);
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(screenX - 5, my - 13, 3, 4);
          ctx.fillRect(screenX + 2, my - 13, 3, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX - 5, my - 13, 1, 1);
          ctx.fillRect(screenX + 2, my - 13, 1, 1);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(screenX - 6, my - 9, 2, 1);
          ctx.fillRect(screenX + 4, my - 9, 2, 1);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(screenX - 1, my - 10, 2, 1);
          const tailWag = Math.sin(t * 6) * 3;
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(screenX + 6 + tailWag, my - 8, 4, 6);
          ctx.fillStyle = '#fff7ed';
          ctx.fillRect(screenX + 8 + tailWag, my - 10, 3, 3);
        } else if (mascotType === 'os') {
          // Frost Bunny with cozy red scarf
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(screenX - 5, my - 5, 10, 9);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX - 6, my - 15, 12, 10);
          const earTwitch = Math.sin(t * 2) * 1;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX - 5, my - 23 + earTwitch, 3, 8);
          ctx.fillRect(screenX + 2, my - 23 - earTwitch, 3, 8);
          ctx.fillStyle = '#fbcfe8';
          ctx.fillRect(screenX - 4, my - 21 + earTwitch, 1, 5);
          ctx.fillRect(screenX + 3, my - 21 - earTwitch, 1, 5);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(screenX - 6, my - 6, 12, 3);
          ctx.fillRect(screenX + 3, my - 4, 3, 5);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(screenX - 4, my - 12, 2, 3);
          ctx.fillRect(screenX + 2, my - 12, 2, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX - 4, my - 12, 1, 1);
          ctx.fillRect(screenX + 2, my - 12, 1, 1);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(screenX - 1, my - 9, 2, 1);
          ctx.fillRect(screenX - 5, my - 8, 2, 1);
          ctx.fillRect(screenX + 3, my - 8, 2, 1);
        } else if (mascotType === 'nosql') {
          // Ancient Ruin Kitten with neon crystal markings
          ctx.fillStyle = '#d8b4fe';
          ctx.fillRect(screenX - 6, my - 6, 12, 10);
          ctx.fillStyle = '#e9d5ff';
          ctx.fillRect(screenX - 7, my - 16, 14, 11);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(screenX - 6, my - 20, 3, 4);
          ctx.fillRect(screenX + 3, my - 20, 3, 4);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(screenX - 1, my - 14, 2, 2);
          ctx.fillStyle = '#db2777';
          ctx.fillRect(screenX - 5, my - 12, 3, 3);
          ctx.fillRect(screenX + 2, my - 12, 3, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX - 5, my - 12, 1, 1);
          ctx.fillRect(screenX + 2, my - 12, 1, 1);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(screenX - 6, my - 8, 2, 1);
          ctx.fillRect(screenX + 4, my - 8, 2, 1);
        } else if (mascotType === 'hda_cognitive') {
          // Zen Mind Spirit Owl
          ctx.fillStyle = '#fae8ff';
          ctx.fillRect(screenX - 6, my - 6, 12, 10);
          ctx.fillStyle = '#f5d0fe';
          ctx.fillRect(screenX - 7, my - 16, 14, 11);
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(screenX - 7, my - 19, 3, 4);
          ctx.fillRect(screenX + 4, my - 19, 3, 4);
          ctx.strokeStyle = '#6b21a8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(screenX - 3, my - 10, 2, Math.PI, 0);
          ctx.arc(screenX + 3, my - 10, 2, Math.PI, 0);
          ctx.stroke();
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(screenX - 1, my - 8, 2, 2);
          ctx.fillStyle = '#9333ea';
          ctx.fillRect(screenX - 1, my - 14, 2, 3);
        } else if (mascotType === 'gv') {
          // Winged Cloud Pup
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX - 6, my - 6, 12, 10);
          ctx.fillRect(screenX - 6, my - 16, 12, 11);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(screenX - 7, my - 15, 2, 6);
          ctx.fillRect(screenX + 5, my - 15, 2, 6);
          const wingFlap = Math.sin(t * 8) * 2;
          ctx.fillStyle = '#facc15';
          ctx.fillRect(screenX - 9, my - 8 + wingFlap, 3, 4);
          ctx.fillRect(screenX + 6, my - 8 - wingFlap, 3, 4);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(screenX - 4, my - 12, 2, 3);
          ctx.fillRect(screenX + 2, my - 12, 2, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX - 4, my - 12, 1, 1);
          ctx.fillRect(screenX + 2, my - 12, 1, 1);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(screenX - 5, my - 8, 2, 1);
          ctx.fillRect(screenX + 3, my - 8, 2, 1);
        }
      };

      // Helper: draw charming wooden cottage corner (for DAA original)
      const drawCottage = (screenX: number, screenY: number) => {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(screenX, screenY - 50, 48, 50);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        for (let y = screenY - 45; y < screenY; y += 6) {
          ctx.beginPath();
          ctx.moveTo(screenX, y);
          ctx.lineTo(screenX + 48, y);
          ctx.stroke();
        }

        ctx.fillStyle = '#0284c7';
        ctx.fillRect(screenX + 12, screenY - 40, 18, 20);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(screenX + 14, screenY - 38, 6, 7);
        ctx.fillRect(screenX + 22, screenY - 38, 6, 7);
        ctx.fillRect(screenX + 14, screenY - 29, 6, 7);
        ctx.fillRect(screenX + 22, screenY - 29, 6, 7);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(screenX + 12, screenY - 40, 18, 20);

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(screenX - 4, screenY - 50);
        ctx.lineTo(screenX + 52, screenY - 50);
        ctx.lineTo(screenX + 48, screenY - 60);
        ctx.lineTo(screenX, screenY - 60);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#b45309';
        for (let fx = 0; fx < 3; fx++) {
          ctx.fillRect(screenX - 16 + fx * 7, screenY - 14, 4, 14);
        }
        ctx.fillRect(screenX - 18, screenY - 10, 22, 2);
        ctx.fillRect(screenX - 18, screenY - 5, 22, 2);

        ctx.fillStyle = '#fff7ed';
        ctx.fillRect(screenX + 34, screenY - 10, 6, 8);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(screenX + 35, screenY - 16, 4, 5);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(screenX + 36, screenY - 12, 2, 3);
      };

      // Helper: draw tall grass blades along cliff edges
      const drawGrassTufts = (screenX: number, screenY: number, count: number = 3) => {
        const sway = Math.sin(t * 2 + screenX) * 1.5;
        ctx.strokeStyle = '#529b28';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < count; i++) {
          ctx.beginPath();
          ctx.moveTo(screenX + i * 3, screenY);
          ctx.lineTo(screenX + i * 3 + sway * (i + 1) * 0.4, screenY - 7 - (i % 2) * 3);
          ctx.stroke();
        }
      };

      // ============================================================
      // 1. DAA: TREE REALM (RETAIN THE ORIGINAL ONE EXACTLY AS IS!)
      // ============================================================
      if (subjectId === 'daa') {
        ctx.fillStyle = 'rgba(244, 114, 182, 0.12)';
        ctx.beginPath();
        ctx.ellipse(originX, originY + tileH * 6.5, width * 0.44, height * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tier 0: River Water Channel (gx: 2..5, gy: 3..5)
        for (let gy = 0; gy < 7; gy++) {
          for (let gx = 0; gx < 7; gx++) {
            const isRiver = (gy >= 2 && gy <= 4) && (gx >= 1 && gx <= 5);
            if (isRiver) {
              drawWaterTile(gx, gy, 0, { showSubmergedPaver: (gx + gy) % 2 === 0 });
            }
          }
        }

        // Submerged Dock Posts
        const post1 = toScreen(2, 2, 0);
        drawDockPost(post1.x - 6, post1.y);
        drawDockPost(post1.x + 4, post1.y - 4);

        // Tier 1: Riverbank Stepped Cliff Blocks (gz: 0, blockDepth: 22)
        drawSteppedBlock(0, 2, 0, 22, 'grass');
        drawSteppedBlock(0, 3, 0, 22, 'grass');
        drawSteppedBlock(0, 4, 0, 22, 'grass');
        drawSteppedBlock(1, 4, 0, 18, 'sand');

        // Right bank & sand boardwalk
        drawSteppedBlock(5, 2, 0, 20, 'sand');
        drawSteppedBlock(6, 2, 0, 20, 'grass');
        drawSteppedBlock(5, 3, 0, 20, 'sand');
        drawSteppedBlock(6, 3, 0, 22, 'grass');

        // Tier 2: Stepped Upper Terrace (gz: 18, blockDepth: 18)
        drawSteppedBlock(1, 0, 18, 18, 'grass');
        drawSteppedBlock(2, 0, 18, 18, 'grass');
        drawSteppedBlock(3, 0, 18, 18, 'grass');
        drawSteppedBlock(4, 0, 18, 18, 'sand');
        drawSteppedBlock(5, 0, 18, 18, 'sand');

        drawSteppedBlock(1, 1, 18, 18, 'grass');
        drawSteppedBlock(2, 1, 18, 18, 'grass');
        drawSteppedBlock(3, 1, 18, 18, 'sand');
        drawSteppedBlock(4, 1, 18, 18, 'sand');

        // Tier 3: High Cliff Plateau with Grand Oak Tree (gz: 34, blockDepth: 16)
        drawSteppedBlock(0, 0, 34, 16, 'grass');
        drawSteppedBlock(0, 1, 34, 16, 'grass');

        // Cozy Cottage Corner (Top right edge)
        const cotPos = toScreen(5, 0, 18);
        drawCottage(cotPos.x - 8, cotPos.y - 6);

        // Tall Grass Tufts along river edge
        const tuftPos1 = toScreen(0, 2, 0);
        drawGrassTufts(tuftPos1.x + 8, tuftPos1.y - 2, 3);
        const tuftPos2 = toScreen(1, 1, 18);
        drawGrassTufts(tuftPos2.x + 4, tuftPos2.y, 4);

        // Cute Mascot Critter wading in the shallow river (just like reference image!)
        const mascotPos = toScreen(3, 3, 0);
        drawCuteMascot(mascotPos.x, mascotPos.y - 4, 'daa');

        // Grand Ancient Oak Tree on Tier 3 (0, 0, 34)
        const treeBase = toScreen(0, 0, 34);
        const treeSway = Math.sin(t * 1.5) * 1.5;

        ctx.fillStyle = '#4a2c16';
        ctx.fillRect(treeBase.x - 5, treeBase.y - 32, 10, 32);
        ctx.fillStyle = '#6b4324';
        ctx.fillRect(treeBase.x - 3, treeBase.y - 30, 4, 30);

        const leafTiers = [
          { y: -30, r: 24, c: '#22543d' },
          { y: -42, r: 20, c: '#2d6a4f' },
          { y: -52, r: 16, c: '#40916c' },
          { y: -60, r: 11, c: '#74c244' },
        ];
        leafTiers.forEach(lt => {
          ctx.fillStyle = lt.c;
          ctx.beginPath();
          ctx.arc(treeBase.x + treeSway * 0.5, treeBase.y + lt.y, lt.r, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = '#f472b6';
        ctx.fillRect(treeBase.x - 14, treeBase.y - 28, 4, 4);
        ctx.fillRect(treeBase.x + 12, treeBase.y - 36, 4, 4);
        ctx.fillRect(treeBase.x - 6, treeBase.y - 48, 3, 3);

        if (showRelic) {
          const altarPos = toScreen(1, 1, 18);
          ctx.fillStyle = '#475569';
          ctx.fillRect(altarPos.x - 8, altarPos.y - 6, 16, 6);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(altarPos.x - 6, altarPos.y - 8, 12, 2);

          const axeBob = Math.sin(t * 2.5) * 2;
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(altarPos.x - 1, altarPos.y - 24 + axeBob, 2, 14);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(altarPos.x - 5, altarPos.y - 24 + axeBob, 5, 6);
          ctx.fillStyle = '#86efac';
          ctx.fillRect(altarPos.x - 4, altarPos.y - 23 + axeBob, 2, 2);
          drawSparkle(altarPos.x + 4, altarPos.y - 22 + axeBob, 0.8, '#86efac');
        }
      }

      // ============================================================
      // 2. OS: MOUNTAIN REALM (VOXEL CANYON & TWIN PEAKS - IMAGE 2 INSPIRED)
      // ============================================================
      else if (subjectId === 'os') {
        // Dramatic shadow
        ctx.fillStyle = 'rgba(147, 197, 253, 0.18)';
        ctx.beginPath();
        ctx.ellipse(originX, originY + tileH * 7, width * 0.46, height * 0.30, 0, 0, Math.PI * 2);
        ctx.fill();

        // 1. Canyon Glacier Torrent (River at bottom $gz = 0$, rushing through ravine)
        for (let gy = 2; gy <= 6; gy++) {
          for (let gx = 2; gx <= 4; gx++) {
            drawWaterTile(gx, gy, 0, { tint: 'rgba(56, 189, 248, 0.86)', showSubmergedPaver: true });
          }
        }

        // Floating Ice Shards in canyon
        const ice1 = toScreen(3, 3, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ice1.x - 5, ice1.y - 2, 10, 4);
        const ice2 = toScreen(2, 5, 0);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(ice2.x - 4, ice2.y - 1, 8, 3);

        // 2. Front Low Canyon Walls & Hiking Trailhead ($gz: 10..18)
        drawSteppedBlock(0, 4, 12, 16, 'stone');
        drawSteppedBlock(1, 5, 10, 14, 'stone');
        drawSteppedBlock(0, 5, 14, 18, 'snow');
        drawSteppedBlock(5, 5, 12, 16, 'stone');
        drawSteppedBlock(6, 4, 14, 16, 'snow');

        // 3. Central Ridge Shelf & Basecamp ($gz: 26..34)
        drawSteppedBlock(1, 3, 26, 16, 'stone');
        drawSteppedBlock(2, 2, 28, 18, 'stone');
        drawSteppedBlock(3, 1, 32, 18, 'stone'); // Basecamp shelf
        drawSteppedBlock(4, 2, 26, 16, 'stone');

        // 4. Western High Mountain Crag & Ridge ($gz: 42..62)
        drawSteppedBlock(0, 2, 36, 18, 'snow');
        drawSteppedBlock(0, 1, 46, 20, 'snow');
        drawSteppedBlock(1, 1, 52, 22, 'snow');
        drawSteppedBlock(1, 0, 62, 22, 'snow'); // Summit Peak 1
        drawSteppedBlock(0, 0, 56, 20, 'snow');

        // 5. Eastern Jagged Horn ($gz: 38..54)
        drawSteppedBlock(5, 2, 32, 18, 'stone');
        drawSteppedBlock(5, 1, 42, 20, 'snow');
        drawSteppedBlock(6, 1, 38, 18, 'stone');
        drawSteppedBlock(5, 0, 52, 22, 'snow'); // Summit Peak 2
        drawSteppedBlock(4, 0, 44, 20, 'snow');

        // Basecamp Campfire with flickering flame & smoke on shelf (3, 1, 32)
        const firePos = toScreen(3, 1, 32);
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(firePos.x - 6, firePos.y - 2, 12, 4);

        const flameH = 9 + Math.sin(t * 8) * 3;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(firePos.x - 4, firePos.y - 2);
        ctx.lineTo(firePos.x + 4, firePos.y - 2);
        ctx.lineTo(firePos.x, firePos.y - 2 - flameH);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(firePos.x - 2, firePos.y - 4, 4, 4);

        // Rising smoke puffs
        const smokePhase = (t * 2) % 3;
        ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
        ctx.fillRect(firePos.x - 1 + Math.sin(t * 2) * 3, firePos.y - 12 - smokePhase * 8, 3, 3);
        ctx.fillRect(firePos.x - 2 - Math.sin(t * 2) * 2, firePos.y - 20 - smokePhase * 8, 4, 4);

        // Mountaineer Tent beside campfire
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(firePos.x + 8, firePos.y - 2);
        ctx.lineTo(firePos.x + 22, firePos.y - 2);
        ctx.lineTo(firePos.x + 15, firePos.y - 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(firePos.x + 13, firePos.y - 8, 4, 6);

        // Summit Watchtower on High Peak (1, 0, 62)
        const towerPos = toScreen(1, 0, 62);
        ctx.fillStyle = '#78350f';
        // Stilts
        ctx.fillRect(towerPos.x - 8, towerPos.y - 24, 2, 24);
        ctx.fillRect(towerPos.x + 6, towerPos.y - 24, 2, 24);
        ctx.fillRect(towerPos.x - 8, towerPos.y - 14, 16, 2);
        // Cabin
        ctx.fillStyle = '#92400e';
        ctx.fillRect(towerPos.x - 9, towerPos.y - 34, 18, 10);
        // Beacon Lantern
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(towerPos.x - 4, towerPos.y - 32, 8, 6);
        // Roof
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.moveTo(towerPos.x - 12, towerPos.y - 34);
        ctx.lineTo(towerPos.x + 12, towerPos.y - 34);
        ctx.lineTo(towerPos.x, towerPos.y - 44);
        ctx.closePath();
        ctx.fill();

        // Snowy Alpine Pines on high crags
        const drawPine = (gx: number, gy: number, gz: number) => {
          const pos = toScreen(gx, gy, gz);
          ctx.fillStyle = '#3e2716';
          ctx.fillRect(pos.x - 1.5, pos.y - 8, 3, 8);
          ctx.fillStyle = '#0f766e';
          ctx.beginPath();
          ctx.moveTo(pos.x - 7, pos.y - 8);
          ctx.lineTo(pos.x + 7, pos.y - 8);
          ctx.lineTo(pos.x, pos.y - 20);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pos.x - 4, pos.y - 12, 8, 2);
        };
        drawPine(0, 1, 46);
        drawPine(6, 1, 38);

        // System Guardian Hammer on Peak 2 (5, 0, 52)
        if (showRelic) {
          const altar = toScreen(5, 0, 52);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(altar.x - 7, altar.y - 5, 14, 5);
          const hBob = Math.sin(t * 2.5) * 2;
          ctx.fillStyle = '#64748b';
          ctx.fillRect(altar.x - 1, altar.y - 20 + hBob, 3, 14);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(altar.x - 7, altar.y - 24 + hBob, 14, 7);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(altar.x - 5, altar.y - 22 + hBob, 10, 3);
          drawSparkle(altar.x + 5, altar.y - 22 + hBob, 0.9, '#e0f2fe');
        }

        // Cute Frost Bunny mascot sitting on mountain shelf overlooking canyon
        const mascotPos = toScreen(2, 2, 28);
        drawCuteMascot(mascotPos.x, mascotPos.y - 4, 'os');
      }

      // ============================================================
      // 3. NOSQL: SUNKEN RUINS CITADEL, PERISTYLE COLONNADE & VAULT
      // ============================================================
      else if (subjectId === 'nosql') {
        // Deep magenta ancient ruins shadow
        ctx.fillStyle = 'rgba(217, 70, 239, 0.18)';
        ctx.beginPath();
        ctx.ellipse(originX, originY + tileH * 6.5, width * 0.45, height * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // 1. Sunken Ancient Forum Basin ($gz = 0$, paved with weathered mosaic flagstones)
        for (let gy = 1; gy <= 5; gy++) {
          for (let gx = 1; gx <= 4; gx++) {
            const p = toScreen(gx, gy, 0);
            drawDiamond(p, (gx + gy) % 2 === 0 ? '#fae8ff' : '#f5d0fe', 'rgba(168, 85, 247, 0.15)');

            // Glowing Neon Data Conduits running across the flagstones
            if (gx === 2 || gy === 3) {
              const pulse = (Math.sin(t * 4 + gx * 2 + gy) + 1) * 0.5;
              ctx.strokeStyle = `rgba(236, 72, 153, ${0.4 + pulse * 0.5})`;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(p.x - halfW, p.y);
              ctx.lineTo(p.x + halfW, p.y);
              ctx.stroke();
            }
          }
        }

        // 2. Western Raised Colonnade Gallery ($gx = 0, gy = 1..5$, elevated $gz = 24$, depth: 24)
        for (let gy = 1; gy <= 5; gy++) {
          drawSteppedBlock(0, gy, 24, 24, 'ruins');
        }

        // Classical Fluted Marble Pillars along the Colonnade
        const drawMarblePillar = (gx: number, gy: number, gz: number, heightP: number) => {
          const base = toScreen(gx, gy, gz);
          // Base Plinth
          ctx.fillStyle = '#e9d5ff';
          ctx.fillRect(base.x - 5, base.y - 4, 10, 4);
          // Fluted Column Shaft
          ctx.fillStyle = '#fdf4ff';
          ctx.fillRect(base.x - 4, base.y - heightP, 8, heightP);
          // Vertical fluting lines
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(base.x - 1.5, base.y - heightP);
          ctx.lineTo(base.x - 1.5, base.y);
          ctx.moveTo(base.x + 1.5, base.y - heightP);
          ctx.lineTo(base.x + 1.5, base.y);
          ctx.stroke();
          // Capital Top
          ctx.fillStyle = '#e9d5ff';
          ctx.fillRect(base.x - 6, base.y - heightP - 3, 12, 3);
          // Rose vines wrapped around pillar
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(base.x - 3, base.y - heightP * 0.6, 3, 3);
          ctx.fillRect(base.x + 1, base.y - heightP * 0.3, 3, 3);
        };

        drawMarblePillar(0, 1, 24, 28);
        drawMarblePillar(0, 3, 24, 28);
        drawMarblePillar(0, 5, 24, 28);

        // Broken Architrave Beam connecting pillars
        const pA = toScreen(0, 1, 24);
        const pB = toScreen(0, 3, 24);
        ctx.fillStyle = '#f3e8ff';
        ctx.fillRect(pA.x - 4, pA.y - 32, pB.x - pA.x + 8, 4);

        // 3. Eastern Library & Ancient Vault Monument ($gx = 5..6, gy = 0..3$, elevated $gz = 26$)
        for (let gy = 0; gy <= 3; gy++) {
          drawSteppedBlock(5, gy, 26, 26, 'ruins');
          drawSteppedBlock(6, gy, 26, 26, 'ruins');
        }

        // Vault Entrance Portal with glowing neon glyphs
        const vaultPos = toScreen(5, 1, 26);
        ctx.fillStyle = '#581c87';
        ctx.fillRect(vaultPos.x - 8, vaultPos.y - 34, 16, 24);
        // Pediment triangular roof
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.moveTo(vaultPos.x - 12, vaultPos.y - 34);
        ctx.lineTo(vaultPos.x + 12, vaultPos.y - 34);
        ctx.lineTo(vaultPos.x, vaultPos.y - 46);
        ctx.closePath();
        ctx.fill();
        // Glowing Neon Portal Door
        const portalGlow = (Math.sin(t * 3) + 1) * 0.5;
        ctx.fillStyle = `rgba(236, 72, 153, ${0.6 + portalGlow * 0.4})`;
        ctx.fillRect(vaultPos.x - 5, vaultPos.y - 28, 10, 18);

        // Stepped stone stairs leading down from vault to sunken forum
        const stair1 = toScreen(4, 2, 14);
        drawDiamond(stair1, '#e9d5ff', '#a855f7');
        const stair2 = toScreen(4, 3, 7);
        drawDiamond(stair2, '#f3e8ff', '#a855f7');

        // Central Obsidian Obelisk at (2, 2, 0)
        const obeliskPos = toScreen(2, 2, 0);
        ctx.fillStyle = '#2e1065';
        ctx.beginPath();
        ctx.moveTo(obeliskPos.x - 4, obeliskPos.y);
        ctx.lineTo(obeliskPos.x + 4, obeliskPos.y);
        ctx.lineTo(obeliskPos.x + 2, obeliskPos.y - 32);
        ctx.lineTo(obeliskPos.x - 2, obeliskPos.y - 32);
        ctx.closePath();
        ctx.fill();
        // Pyramidion tip
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(obeliskPos.x - 2, obeliskPos.y - 32);
        ctx.lineTo(obeliskPos.x + 2, obeliskPos.y - 32);
        ctx.lineTo(obeliskPos.x, obeliskPos.y - 38);
        ctx.closePath();
        ctx.fill();

        // Data Relic Blade hovering above sunken runic center
        if (showRelic) {
          const bladePos = toScreen(3, 3, 0);
          ctx.fillStyle = '#3b0764';
          ctx.fillRect(bladePos.x - 7, bladePos.y - 4, 14, 4);

          const bBob = Math.sin(t * 3) * 3;
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(bladePos.x - 2, bladePos.y - 28 + bBob, 4, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bladePos.x - 1, bladePos.y - 26 + bBob, 2, 16);
          drawSparkle(bladePos.x + 5, bladePos.y - 28 + bBob, 1, '#fbcfe8');
        }

        // Cute Ruin Kitten mascot sitting on fallen column drum in forum
        const drumPos = toScreen(2, 4, 0);
        ctx.fillStyle = '#e9d5ff';
        ctx.fillRect(drumPos.x - 6, drumPos.y - 4, 12, 6);
        drawCuteMascot(drumPos.x, drumPos.y - 6, 'nosql');
      }

      // ============================================================
      // 4. HDA & COGNITIVE: STEPPED ZEN WATER AMPHITHEATER & PAGODA
      // ============================================================
      else if (subjectId === 'hda_cognitive') {
        // Soft violet reflection shadow
        ctx.fillStyle = 'rgba(192, 132, 252, 0.18)';
        ctx.beginPath();
        ctx.ellipse(originX, originY + tileH * 6.5, width * 0.46, height * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // 1. Wide Serene Lotus Reflection Pond ($gz = 0$, filling front and center)
        for (let gy = 2; gy <= 6; gy++) {
          for (let gx = 1; gx <= 5; gx++) {
            drawWaterTile(gx, gy, 0, { tint: 'rgba(168, 85, 247, 0.68)', showSubmergedPaver: true });
          }
        }

        // Floating Lily Pads & Pink Lotus Blossoms
        const lotusA = toScreen(2, 4, 0);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(lotusA.x - 8, lotusA.y - 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(lotusA.x - 10, lotusA.y - 5, 5, 5);

        const lotusB = toScreen(4, 5, 0);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(lotusB.x + 6, lotusB.y - 1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lotusB.x + 4, lotusB.y - 4, 4, 4);

        // Zigzag Wooden Boardwalk (Yatsuhashi bridge across the pond)
        const b1 = toScreen(1, 4, 0);
        const b2 = toScreen(3, 4, 0);
        const b3 = toScreen(3, 3, 0);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(b1.x - 6, b1.y - 6, 20, 6);
        ctx.fillRect(b2.x - 6, b2.y - 6, 16, 6);
        ctx.fillRect(b3.x - 6, b3.y - 6, 16, 6);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(b1.x - 4, b1.y - 5, 16, 2);
        ctx.fillRect(b2.x - 4, b2.y - 5, 12, 2);
        ctx.fillRect(b3.x - 4, b3.y - 5, 12, 2);

        // 2. Stepped Concentric Quartz Terraces (Cascading upwards in the back)
        // Tier 1: Herbal Planter Terraces ($gz: 14..20)
        drawSteppedBlock(0, 3, 16, 16, 'quartz');
        drawSteppedBlock(0, 2, 20, 20, 'grass', { topCustomColor: '#c4b5fd' }); // Lavender beds
        drawSteppedBlock(5, 3, 14, 14, 'quartz');
        drawSteppedBlock(6, 2, 18, 18, 'grass', { topCustomColor: '#c4b5fd' });

        // Tier 2: Mid-Level Garden Plaza ($gz: 28..34)
        drawSteppedBlock(1, 1, 28, 18, 'quartz');
        drawSteppedBlock(2, 1, 30, 18, 'quartz');
        drawSteppedBlock(3, 1, 32, 18, 'quartz');
        drawSteppedBlock(0, 1, 32, 20, 'grass', { topCustomColor: '#a7f3d0' });

        // Tier 3: High Shrine Pagoda Plateau ($gz: 40..46)
        drawSteppedBlock(4, 0, 44, 20, 'quartz');
        drawSteppedBlock(5, 0, 42, 20, 'quartz');
        drawSteppedBlock(3, 0, 46, 22, 'quartz');

        // Traditional Stone Zen Lantern (Tōrō) at bridge head
        const lanternPos = toScreen(1, 3, 16);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(lanternPos.x - 3, lanternPos.y - 14, 6, 14);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lanternPos.x - 2, lanternPos.y - 12, 4, 5); // Glow
        ctx.fillStyle = '#475569';
        ctx.fillRect(lanternPos.x - 5, lanternPos.y - 17, 10, 3); // Cap

        // Sanctuary Pagoda Pavilion on High Plateau (4, 0, 44)
        const pagPos = toScreen(4, 0, 44);
        // Vermilion Pillars
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(pagPos.x - 10, pagPos.y - 24, 3, 24);
        ctx.fillRect(pagPos.x + 7, pagPos.y - 24, 3, 24);
        // Lower Curved Roof Eaves
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(pagPos.x - 16, pagPos.y - 22);
        ctx.lineTo(pagPos.x + 16, pagPos.y - 22);
        ctx.lineTo(pagPos.x + 12, pagPos.y - 28);
        ctx.lineTo(pagPos.x - 12, pagPos.y - 28);
        ctx.closePath();
        ctx.fill();
        // Upper Tier Roof & Gold Finial
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(pagPos.x - 12, pagPos.y - 32);
        ctx.lineTo(pagPos.x + 12, pagPos.y - 32);
        ctx.lineTo(pagPos.x, pagPos.y - 42);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(pagPos.x - 1, pagPos.y - 46, 2, 4);

        // Weeping Amethyst Bonsai Tree on Tier 2 (0, 1, 32)
        const bPos = toScreen(0, 1, 32);
        ctx.fillStyle = '#4a044e';
        ctx.fillRect(bPos.x - 3, bPos.y - 18, 6, 18);
        // Billowing weeping amethyst clusters
        const foliage = [
          { x: 0, y: -24, r: 12, c: '#c084fc' },
          { x: -8, y: -20, r: 9, c: '#d8b4fe' },
          { x: 8, y: -22, r: 10, c: '#a855f7' },
        ];
        foliage.forEach(f => {
          ctx.fillStyle = f.c;
          ctx.beginPath();
          ctx.arc(bPos.x + f.x, bPos.y + f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Mind Seeker Staff in the Pagoda Shrine
        if (showRelic) {
          const staffPos = toScreen(3, 0, 46);
          ctx.fillStyle = '#f3e8ff';
          ctx.fillRect(staffPos.x - 6, staffPos.y - 4, 12, 4);
          const sBob = Math.sin(t * 2.8) * 2;
          ctx.fillStyle = '#d97706';
          ctx.fillRect(staffPos.x - 1, staffPos.y - 22 + sBob, 2, 16);
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(staffPos.x - 4, staffPos.y - 26 + sBob, 8, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(staffPos.x - 2, staffPos.y - 25 + sBob, 4, 3);
          drawSparkle(staffPos.x + 5, staffPos.y - 26 + sBob, 0.9, '#fae8ff');
        }

        // Cute Zen Spirit Owl meditating on flat stone in lotus pond
        const stonePos = toScreen(3, 4, 0);
        drawCuteMascot(stonePos.x, stonePos.y - 4, 'hda_cognitive');
      }

      // ============================================================
      // 5. GV: TRUE MULTI-ISLAND SKY ARCHIPELAGO & SKY BRIDGES
      // ============================================================
      else if (subjectId === 'gv') {
        // Deep sky void with billowing pastel clouds beneath islands
        const cloudDrift = Math.sin(t * 1.2) * 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.beginPath();
        ctx.arc(originX - 70 + cloudDrift, originY + tileH * 5.5, 42, 0, Math.PI * 2);
        ctx.arc(originX + 60 - cloudDrift, originY + tileH * 5.8, 48, 0, Math.PI * 2);
        ctx.arc(originX, originY + tileH * 6.2, 54, 0, Math.PI * 2);
        ctx.fill();

        // Floating Rock Underbelly Stalactites for Islands (Visible rock bottoms)
        const drawRockUnderbelly = (screenX: number, screenY: number, w: number, d: number) => {
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(screenX - w / 2, screenY);
          ctx.lineTo(screenX + w / 2, screenY);
          ctx.lineTo(screenX, screenY + d);
          ctx.closePath();
          ctx.fill();
        };

        // ==========================================
        // ISLAND 1: MAIN SKY OBSERVATORY CITADEL (Center & Back, $gz: 26$)
        // ==========================================
        const isl1Center = toScreen(2, 1, 26);
        drawRockUnderbelly(isl1Center.x, isl1Center.y + 24, 70, 36);

        drawSteppedBlock(1, 0, 26, 20, 'grass');
        drawSteppedBlock(2, 0, 26, 20, 'grass');
        drawSteppedBlock(3, 0, 26, 20, 'sand');
        drawSteppedBlock(1, 1, 26, 20, 'sand');
        drawSteppedBlock(2, 1, 26, 20, 'grass');
        drawSteppedBlock(3, 1, 26, 20, 'sand');
        drawSteppedBlock(2, 2, 26, 20, 'sand');

        // Sky Spring pool cascading over the edge into clouds
        const springP = toScreen(2, 0, 26);
        drawWaterTile(2, 0, 26, { tint: 'rgba(56, 189, 248, 0.90)' });
        // Waterfall pouring off cliff into empty sky
        ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
        ctx.fillRect(springP.x - 3, springP.y + halfH, 6, 28);
        drawSparkle(springP.x, springP.y + halfH + 26, 0.9, '#ffffff');

        // Windmill Observatory on Island 1 (1, 0, 26)
        const millPos = toScreen(1, 0, 26);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(millPos.x - 8, millPos.y - 36, 16, 36);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(millPos.x - 10, millPos.y - 42, 20, 6);
        // Spinning sails
        const sailAngle = t * 2.2;
        ctx.save();
        ctx.translate(millPos.x, millPos.y - 26);
        ctx.rotate(sailAngle);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18, -2, 36, 4);
        ctx.fillRect(-2, -18, 4, 36);
        ctx.restore();

        // ==========================================
        // ISLAND 2: SATELLITE AETHER CRAG (Far Left, Separated by Void, $gz: 14$)
        // ==========================================
        const isl2Center = toScreen(0, 3, 14);
        drawRockUnderbelly(isl2Center.x, isl2Center.y + 20, 44, 28);

        drawSteppedBlock(0, 3, 14, 18, 'grass');
        drawSteppedBlock(0, 4, 14, 18, 'sand');

        // Floating Levitation Crystals hovering above Island 2
        const crysPos = toScreen(0, 3, 14);
        const cBob = Math.sin(t * 3.5) * 3;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(crysPos.x, crysPos.y - 24 + cBob);
        ctx.lineTo(crysPos.x + 5, crysPos.y - 16 + cBob);
        ctx.lineTo(crysPos.x, crysPos.y - 8 + cBob);
        ctx.lineTo(crysPos.x - 5, crysPos.y - 16 + cBob);
        ctx.closePath();
        ctx.fill();
        drawSparkle(crysPos.x + 6, crysPos.y - 18 + cBob, 0.9, '#e0f2fe');

        // ==========================================
        // ISLAND 3: GLIDER LAUNCH DECK & ALTAR (Far Right, Separated by Void, $gz: 8$)
        // ==========================================
        const isl3Center = toScreen(5, 3, 8);
        drawRockUnderbelly(isl3Center.x, isl3Center.y + 18, 48, 26);

        drawSteppedBlock(5, 3, 8, 16, 'sand');
        drawSteppedBlock(5, 4, 8, 16, 'grass');
        drawSteppedBlock(6, 3, 8, 16, 'sand');

        // Glider Launch Deck with wooden windsocks
        const deckPos = toScreen(6, 3, 8);
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(deckPos.x - 6, deckPos.y - 14, 2, 14);
        // Orange windsock
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(deckPos.x - 4, deckPos.y - 14);
        ctx.lineTo(deckPos.x + 8, deckPos.y - 11);
        ctx.lineTo(deckPos.x + 8, deckPos.y - 8);
        ctx.lineTo(deckPos.x - 4, deckPos.y - 8);
        ctx.closePath();
        ctx.fill();

        // ==========================================
        // SUSPENSION SKY-BRIDGES (Spanning open void between the islands!)
        // ==========================================
        // Bridge 1: Island 1 <-> Island 2 (0, 3 to 1, 1)
        const pBridge1A = toScreen(0, 3, 14);
        const pBridge1B = toScreen(1, 1, 26);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pBridge1A.x, pBridge1A.y);
        ctx.quadraticCurveTo((pBridge1A.x + pBridge1B.x) / 2, (pBridge1A.y + pBridge1B.y) / 2 + 6, pBridge1B.x, pBridge1B.y);
        ctx.stroke();

        // Wooden planks along Bridge 1
        for (let pct = 0.2; pct <= 0.8; pct += 0.2) {
          const bx = pBridge1A.x + (pBridge1B.x - pBridge1A.x) * pct;
          const by = pBridge1A.y + (pBridge1B.y - pBridge1A.y) * pct + 4;
          ctx.fillStyle = '#78350f';
          ctx.fillRect(bx - 3, by - 1, 6, 3);
        }

        // Bridge 2: Island 1 <-> Island 3 (2, 2 to 5, 3)
        const pBridge2A = toScreen(2, 2, 26);
        const pBridge2B = toScreen(5, 3, 8);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pBridge2A.x, pBridge2A.y);
        ctx.quadraticCurveTo((pBridge2A.x + pBridge2B.x) / 2, (pBridge2A.y + pBridge2B.y) / 2 + 8, pBridge2B.x, pBridge2B.y);
        ctx.stroke();

        for (let pct = 0.2; pct <= 0.8; pct += 0.2) {
          const bx = pBridge2A.x + (pBridge2B.x - pBridge2A.x) * pct;
          const by = pBridge2A.y + (pBridge2B.y - pBridge2A.y) * pct + 5;
          ctx.fillStyle = '#78350f';
          ctx.fillRect(bx - 3, by - 1, 6, 3);
        }

        // Connector Spear Reliquary on Island 3 (5, 3, 8)
        if (showRelic) {
          const spearPos = toScreen(5, 3, 8);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(spearPos.x - 6, spearPos.y - 4, 12, 4);
          const spBob = Math.sin(t * 3) * 2;
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(spearPos.x - 1, spearPos.y - 24 + spBob, 2, 18);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(spearPos.x - 4, spearPos.y - 28 + spBob, 8, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(spearPos.x - 1, spearPos.y - 30 + spBob, 2, 4);
          drawSparkle(spearPos.x + 5, spearPos.y - 28 + spBob, 0.9, '#fef08a');
        }

        // Cute Winged Cloud Pup mascot sitting on the glider deck on Island 3
        const mascotPos = toScreen(5, 4, 8);
        drawCuteMascot(mascotPos.x, mascotPos.y - 4, 'gv');
      }

      if (animated) {
        animRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isRunning = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [subjectId, level, totalMinutes, width, height, showRelic, animated]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width,
          height,
          imageRendering: 'pixelated',
        }}
        className="max-w-full h-auto block select-none drop-shadow-sm"
      />
    </div>
  );
};

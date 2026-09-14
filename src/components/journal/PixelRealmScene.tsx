import React, { useState } from 'react';
import type { SubjectId } from '../../types';
import { IsometricRealmPlot } from './IsometricRealmPlot';
import { MapPin, Sparkles } from 'lucide-react';

interface PixelRealmSceneProps {
  subjectId: SubjectId;
  level?: number;
  totalMinutes?: number;
  unlockedElements?: string[];
  height?: number | string;
  className?: string;
  showOverlay?: boolean;
  interactive?: boolean;
}

interface LandmarkPOI {
  name: string;
  type: 'relic' | 'ruin' | 'shrine' | 'discovery';
  x: number; // 0 to 100%
  y: number; // 0 to 100%
  desc: string;
  unlockedAt: number;
}

export const PixelRealmScene: React.FC<PixelRealmSceneProps> = ({
  subjectId,
  level = 1,
  totalMinutes = 0,
  height = 240,
  className = '',
  showOverlay = true,
  interactive = true,
}) => {
  const [activePOI, setActivePOI] = useState<LandmarkPOI | null>(null);

  // Landmarks & POIs for interactive discovery
  const pois: Record<SubjectId, LandmarkPOI[]> = {
    daa: [
      { name: 'Algorithmic Axe Shrine', type: 'relic', x: 50, y: 44, desc: 'Embedded in the Knowledge Tree, its emerald blade cleaves through exponential complexity.', unlockedAt: 1 },
      { name: 'Great Knowledge Tree', type: 'shrine', x: 34, y: 32, desc: 'A majestic world-tree with branching roots channeling recursive computational energy.', unlockedAt: 1 },
      { name: 'Rope Bridge & Forest Paths', type: 'discovery', x: 66, y: 54, desc: 'Suspended wooden walkways connecting the recursive groves.', unlockedAt: 2 },
      { name: 'Ancient Algorithmic Ruins', type: 'ruin', x: 42, y: 68, desc: 'Monoliths etched with dynamic programming matrices and pink blossom flowers.', unlockedAt: 3 },
    ],
    os: [
      { name: 'System Guardian Hammer', type: 'relic', x: 50, y: 44, desc: 'Frost-etched warhammer commanding concurrency on an icy stone altar.', unlockedAt: 1 },
      { name: 'Watchtower of the Kernel', type: 'shrine', x: 34, y: 30, desc: 'High-altitude outpost keeping vigil over memory management threads.', unlockedAt: 1 },
      { name: 'Explorer Campfire', type: 'discovery', x: 64, y: 46, desc: 'A warm hearth providing respite during long concurrent study sessions.', unlockedAt: 2 },
      { name: 'Glacial Spires & Ruins', type: 'ruin', x: 38, y: 62, desc: 'Permafrost ruins holding the ancient secrets of process scheduling.', unlockedAt: 3 },
    ],
    nosql: [
      { name: 'Data Relic Blade', type: 'relic', x: 50, y: 44, desc: 'Crystalline blade wrapped in ivy, pulsing with pink data streams.', unlockedAt: 1 },
      { name: 'Ancient Storage Vault', type: 'shrine', x: 32, y: 32, desc: 'Sunken library vault housing billions of sharded historical records.', unlockedAt: 1 },
      { name: 'Magenta Energy Channels', type: 'discovery', x: 66, y: 50, desc: 'Subterranean fissures radiating high-throughput query energy.', unlockedAt: 2 },
      { name: 'Colonnade of Broken Towers', type: 'ruin', x: 40, y: 65, desc: 'Weathered stone ruins overrun by creeping vines and pink flowers.', unlockedAt: 3 },
    ],
    hda_cognitive: [
      { name: 'Mind Seeker Staff', type: 'relic', x: 50, y: 44, desc: 'Botanical staff crowned with a neural amethyst crystal wrapped in golden laurels.', unlockedAt: 1 },
      { name: 'Healthcare Research Lab', type: 'shrine', x: 34, y: 30, desc: 'Clinical archive dedicated to predictive diagnostic analytics.', unlockedAt: 1 },
      { name: 'Neural Cognitive Arch', type: 'discovery', x: 65, y: 36, desc: 'Colossal glowing stone brain portal pulsing with synaptic thought waves.', unlockedAt: 2 },
      { name: 'Memory Garden & Healing Pool', type: 'ruin', x: 40, y: 65, desc: 'Therapeutic sanctuary ponds bordered by pink roses and neural moss.', unlockedAt: 3 },
    ],
    gv: [
      { name: 'Connector Spear', type: 'relic', x: 50, y: 44, desc: 'Celestial golden trident-spear linking floating sky citadels.', unlockedAt: 1 },
      { name: 'Network Core Pylon', type: 'shrine', x: 35, y: 32, desc: 'Central energy pylon projecting interconnected graph vectors.', unlockedAt: 1 },
      { name: 'Sky Bridge & Ley Lines', type: 'discovery', x: 64, y: 48, desc: 'Luminous pink and gold energy bridges spanning across the void.', unlockedAt: 2 },
      { name: 'Floating Node Obelisks', type: 'ruin', x: 38, y: 64, desc: 'Suspended geometric islands mapping multi-dimensional relationships.', unlockedAt: 3 },
    ],
  };

  const realmPOIs = pois[subjectId] || [];

  // Parse numeric height
  const numHeight = typeof height === 'number' ? height : parseInt(height, 10) || 240;
  const numWidth = Math.max(280, Math.floor(numHeight * 1.55));

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-b from-[#fff0f5] via-[#fdf2f8] to-[#fff5f8] flex items-center justify-center ${className}`}
      style={{ height }}
    >
      {/* 3D Isometric Diamond Land Plot */}
      <IsometricRealmPlot
        subjectId={subjectId}
        level={level}
        totalMinutes={totalMinutes}
        width={numWidth}
        height={numHeight}
        animated={true}
        showRelic={true}
      />

      {/* Interactive Discovery Beacons */}
      {interactive && realmPOIs.map((poi, idx) => {
        const isUnlocked = level >= poi.unlockedAt;
        if (!isUnlocked) return null;

        return (
          <button
            key={idx}
            onClick={() => setActivePOI(poi)}
            title={`Inspect ${poi.name}`}
            className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-5 h-5 rounded-full bg-pink-500/40 animate-ping" />
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border border-white shadow-md flex items-center justify-center text-[8px] text-white font-bold transition-transform group-hover:scale-125">
                ✦
              </div>
            </div>
          </button>
        );
      })}

      {/* POI Lore Card Drawer */}
      {activePOI && (
        <div className="absolute bottom-3 left-3 right-3 md:left-auto md:right-3 md:max-w-xs bg-white/95 border-2 border-pink-400 p-3 rounded-lg shadow-xl backdrop-blur-sm z-30 animate-fade-up">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-pink-700 font-pixel-heading text-[10px]">
              <MapPin className="w-3.5 h-3.5 text-pink-500" />
              <span>{activePOI.name}</span>
            </div>
            <button
              onClick={() => setActivePOI(null)}
              className="text-slate-400 hover:text-slate-700 text-xs px-1.5 py-0.5 rounded bg-pink-50 border border-pink-200"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-700 text-xs font-pixel leading-relaxed">
            {activePOI.desc}
          </p>
        </div>
      )}

      {/* Subtle Top-Right Realm Hint */}
      {showOverlay && (
        <div className="absolute top-2.5 left-2.5 pointer-events-none z-10 flex items-center gap-1.5 bg-white/90 border border-pink-300 px-2.5 py-1 rounded text-[10px] font-pixel text-pink-700 shadow-[2px_2px_0px_#fbcfe8]">
          <Sparkles className="w-3 h-3 text-pink-500" />
          <span>Isometric World • Lv.{level}</span>
        </div>
      )}
    </div>
  );
};

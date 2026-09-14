import React, { useState } from 'react';
import type { SubjectId } from '../../types';

interface RelicDisplayProps {
  subjectId: SubjectId;
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

export const RelicDisplay: React.FC<RelicDisplayProps> = ({
  subjectId,
  level = 1,
  size = 'md',
  showTooltip = true,
  className = '',
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);

  const dim = {
    sm: { box: 36, svg: 28 },
    md: { box: 48, svg: 38 },
    lg: { box: 72, svg: 56 },
    hero: { box: 110, svg: 90 },
  }[size];

  const relicInfo = {
    daa: {
      name: 'Algorithmic Axe',
      title: 'Axe of Recursive Truth',
      color: '#4ade80',
      aura: 'rgba(74, 222, 128, 0.4)',
      border: '#15803d',
      lore: 'An ancient runic battleaxe embedded in the colossal Knowledge Tree. Its emerald-carved blade hums with binary logic, cleaving through exponential complexity.',
    },
    os: {
      name: 'System Guardian Hammer',
      title: 'Hammer of Concurrent Order',
      color: '#60a5fa',
      aura: 'rgba(96, 165, 250, 0.4)',
      border: '#1d4ed8',
      lore: 'A monolithic frost-etched warhammer resting on a mountain shrine. It commands process synchronization and smashes race conditions with glacial authority.',
    },
    nosql: {
      name: 'Data Relic Blade',
      title: 'Blade of the Lost Vault',
      color: '#f472b6',
      aura: 'rgba(244, 114, 182, 0.4)',
      border: '#be185d',
      lore: 'A crystalline broadblade sheathed in ancient stone and creeping creepers. Radiant magenta energy conduits unlock distributed storage vaults across the lost city.',
    },
    hda_cognitive: {
      name: 'Mind Seeker Staff',
      title: 'Staff of Healing & Synapse',
      color: '#c084fc',
      aura: 'rgba(192, 132, 252, 0.4)',
      border: '#6d28d9',
      lore: 'An ornate botanical staff topped with an amethyst neural crystal wrapped in gold laurel leaves. Emits diagnostic healing waves that fuse medicine and cognition.',
    },
    gv: {
      name: 'Connector Spear',
      title: 'Spear of Celestial Edges',
      color: '#fb923c',
      aura: 'rgba(251, 146, 60, 0.4)',
      border: '#c2410c',
      lore: 'A celestial golden spear hovering above an ancient celestial compass. Projects radiant energy bridges to link floating sky sanctuaries into a unified network.',
    },
  }[subjectId];

  // SVG Pixel Relic Art Renderers
  const renderAxe = () => (
    <svg width={dim.svg} height={dim.svg} viewBox="0 0 48 48" fill="none">
      {/* Glow */}
      <circle cx="24" cy="24" r="18" fill={relicInfo.aura} filter="blur(4px)" className="animate-pulse-glow" />
      {/* Ash wood handle */}
      <line x1="12" y1="40" x2="34" y2="12" stroke="#5c3818" strokeWidth="4" strokeLinecap="round" />
      <line x1="14" y1="38" x2="33" y2="14" stroke="#8b5a2b" strokeWidth="2" strokeLinecap="round" />
      {/* Leather grip wrappings */}
      <line x1="14" y1="36" x2="18" y2="38" stroke="#3d220a" strokeWidth="2" />
      <line x1="18" y1="31" x2="22" y2="33" stroke="#3d220a" strokeWidth="2" />
      {/* Axe head socket */}
      <rect x="28" y="12" width="6" height="8" rx="1" fill="#2d3748" transform="rotate(-40 31 16)" />
      {/* Primary beard blade (emerald runic) */}
      <path
        d="M26 12C32 4 42 6 42 16C42 22 36 26 28 22L30 14Z"
        fill="#166534"
        stroke="#4ade80"
        strokeWidth="1.5"
      />
      {/* Runes engraved on blade */}
      <path d="M33 11L37 16L34 20" stroke="#86efac" strokeWidth="1.2" strokeLinecap="round" />
      {/* Back spike / smaller blade */}
      <path d="M26 18L20 16L24 10Z" fill="#1e293b" stroke="#4ade80" strokeWidth="1" />
      {/* Ivy tendril wrapping handle */}
      <path d="M16 34C18 30 24 24 28 18" stroke="#4ade80" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );

  const renderHammer = () => (
    <svg width={dim.svg} height={dim.svg} viewBox="0 0 48 48" fill="none">
      {/* Glow */}
      <circle cx="24" cy="24" r="18" fill={relicInfo.aura} filter="blur(4px)" className="animate-pulse-glow" />
      {/* Steel/stone handle */}
      <line x1="14" y1="38" x2="30" y2="18" stroke="#334155" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="15" y1="37" x2="29" y2="19" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
      {/* Stone Pedestal Base */}
      <rect x="8" y="38" width="16" height="5" rx="1" fill="#1e293b" stroke="#475569" strokeWidth="1" />
      {/* Monolithic Hammer Head */}
      <rect
        x="22"
        y="8"
        width="18"
        height="14"
        rx="2"
        fill="#1e3a8a"
        stroke="#93c5fd"
        strokeWidth="1.5"
        transform="rotate(-40 31 15)"
      />
      {/* Frost rune pattern */}
      <path d="M26 12L34 20M34 12L26 20" stroke="#bfdbfe" strokeWidth="1.2" strokeLinecap="round" />
      {/* Ice crystals around base */}
      <path d="M22 36L24 32L26 36Z" fill="#93c5fd" />
      <path d="M12 36L14 30L16 36Z" fill="#60a5fa" />
    </svg>
  );

  const renderBlade = () => (
    <svg width={dim.svg} height={dim.svg} viewBox="0 0 48 48" fill="none">
      {/* Glow */}
      <circle cx="24" cy="24" r="18" fill={relicInfo.aura} filter="blur(4px)" className="animate-pulse-glow" />
      {/* Crossguard & Hilt */}
      <line x1="14" y1="38" x2="20" y2="32" stroke="#581c87" strokeWidth="4" strokeLinecap="round" />
      <circle cx="12" cy="40" r="3" fill="#be185d" />
      <line x1="15" y1="28" x2="27" y2="38" stroke="#701a75" strokeWidth="3" strokeLinecap="round" />
      {/* Crystal Broadblade (pointing up-right) */}
      <path
        d="M20 30L38 12L42 14L28 34L20 30Z"
        fill="#a21caf"
        stroke="#f472b6"
        strokeWidth="1.5"
      />
      {/* Center energy conduit */}
      <line x1="23" y1="30" x2="38" y2="15" stroke="#fbcfe8" strokeWidth="1.5" />
      {/* Ancient altar rock base */}
      <path d="M8 42L16 34L22 42Z" fill="#1e1b4b" stroke="#701a75" strokeWidth="1" />
      {/* Glowing data specks */}
      <circle cx="34" cy="18" r="1" fill="#ffffff" />
      <circle cx="28" cy="24" r="1" fill="#ffffff" />
    </svg>
  );

  const renderStaff = () => (
    <svg width={dim.svg} height={dim.svg} viewBox="0 0 48 48" fill="none">
      {/* Glow */}
      <circle cx="24" cy="24" r="18" fill={relicInfo.aura} filter="blur(4px)" className="animate-pulse-glow" />
      {/* Botanical Wood Shaft */}
      <line x1="14" y1="42" x2="32" y2="16" stroke="#4a2810" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="15" y1="41" x2="31" y2="17" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
      {/* Golden Laurel wrap */}
      <circle cx="32" cy="16" r="6" stroke="#d4af37" strokeWidth="2" strokeDasharray="3 2" />
      {/* Neural Crystal Head (Amethyst) */}
      <path
        d="M32 6L38 12L32 20L26 12Z"
        fill="#7c3aed"
        stroke="#c084fc"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="12" r="2.5" fill="#f5d0fe" />
      {/* Healing particles */}
      <circle cx="25" cy="8" r="1.5" fill="#38bdf8" />
      <circle cx="39" cy="18" r="1.5" fill="#a78bfa" />
    </svg>
  );

  const renderSpear = () => (
    <svg width={dim.svg} height={dim.svg} viewBox="0 0 48 48" fill="none">
      {/* Glow */}
      <circle cx="24" cy="24" r="18" fill={relicInfo.aura} filter="blur(4px)" className="animate-pulse-glow" />
      {/* Golden Astrolabe ring base */}
      <ellipse cx="20" cy="38" rx="10" ry="4" stroke="#ca8a04" strokeWidth="1.5" fill="#451a03" />
      {/* Spear shaft */}
      <line x1="18" y1="40" x2="34" y2="12" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
      <line x1="19" y1="39" x2="33" y2="13" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      {/* Trident Connector Spearhead */}
      <path
        d="M34 12L42 4L38 16Z"
        fill="#ea580c"
        stroke="#fdba74"
        strokeWidth="1.5"
      />
      <path d="M30 16L32 8L36 14Z" fill="#ca8a04" />
      <path d="M36 20L40 16L38 22Z" fill="#ca8a04" />
      {/* Radiant connecting node rays */}
      <line x1="42" y1="4" x2="46" y2="2" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="16" x2="44" y2="20" stroke="#fdba74" strokeWidth="1.5" strokeDasharray="1 2" />
    </svg>
  );

  const getSvg = () => {
    switch (subjectId) {
      case 'daa': return renderAxe();
      case 'os': return renderHammer();
      case 'nosql': return renderBlade();
      case 'hda_cognitive': return renderStaff();
      case 'gv': return renderSpear();
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Relic Shrine Base Frame */}
      <div
        className="rounded-lg flex items-center justify-center transition-all duration-300 relative border"
        style={{
          width: `${dim.box}px`,
          height: `${dim.box}px`,
          backgroundColor: '#0c111a',
          borderColor: hovered ? relicInfo.color : `${relicInfo.border}88`,
          boxShadow: hovered ? `0 0 15px ${relicInfo.aura}` : 'inset 0 0 10px rgba(0,0,0,0.6)',
        }}
      >
        {getSvg()}

        {/* Level badge */}
        <div
          className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[9px] font-bold pixel-font border"
          style={{
            backgroundColor: '#090d16',
            borderColor: relicInfo.border,
            color: relicInfo.color,
          }}
        >
          T{Math.min(5, Math.ceil(level / 2))}
        </div>
      </div>

      {/* Hover Lore Tooltip */}
      {showTooltip && hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950/95 border-2 rounded-lg shadow-2xl z-50 pointer-events-none animate-pixel-in"
          style={{ borderColor: relicInfo.color }}
        >
          <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-800">
            <span className="text-xs font-bold font-journal" style={{ color: relicInfo.color }}>
              {relicInfo.name}
            </span>
            <span className="text-[10px] pixel-font text-amber-400">Tier {Math.min(5, Math.ceil(level / 2))}</span>
          </div>
          <div className="text-[10px] text-slate-400 italic mb-2 font-journal">
            "{relicInfo.title}"
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {relicInfo.lore}
          </p>
          <div className="mt-2 text-[9px] pixel-font text-slate-500 flex justify-between">
            <span>Realm Relic</span>
            <span style={{ color: relicInfo.color }}>Restored at Lv.{level}</span>
          </div>
        </div>
      )}
    </div>
  );
};

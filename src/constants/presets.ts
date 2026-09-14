import type { SubjectId } from '../types';

export interface RealmPreset {
  id: string;
  name: string;
  icon: string;
  category: string;
}

export const REALM_PRESETS: Record<SubjectId, RealmPreset[]> = {
  daa: [
    { id: 'daa-1', name: 'Planting Ancient Algorithmic Oak', icon: '🌳', category: 'Forestry' },
    { id: 'daa-2', name: 'Carving Recursion Hiking Trail', icon: '🥾', category: 'Trail' },
    { id: 'daa-3', name: 'Weaving Binary Canopy Bridge', icon: '🌉', category: 'Structure' },
    { id: 'daa-4', name: 'Cultivating Dynamic Fern Grove', icon: '🌿', category: 'Flora' },
    { id: 'daa-5', name: 'Paving Dijkstra Stone Walkway', icon: '🪨', category: 'Masonry' },
    { id: 'daa-6', name: 'Growing Glowing Spanning-Tree Bonsai', icon: '🌸', category: 'Sanctuary' },
    { id: 'daa-7', name: 'Installing Whispering Willow Lanterns', icon: '🏮', category: 'Decoration' },
  ],
  os: [
    { id: 'os-1', name: 'Chiseling Snowy Mountain Trail', icon: '🏔️', category: 'Trail' },
    { id: 'os-2', name: 'Placing Granite Stone Steps for Hiking Trail', icon: '🪨', category: 'Masonry' },
    { id: 'os-3', name: 'Building Thread Concurrency Beacon', icon: '🗼', category: 'Monument' },
    { id: 'os-4', name: 'Erecting Kernel Firewatch Outpost', icon: '🏕️', category: 'Shelter' },
    { id: 'os-5', name: 'Constructing Memory Glacier Aqueduct', icon: '❄️', category: 'Engineering' },
    { id: 'os-6', name: 'Forging Process Scheduler Campfire', icon: '🔥', category: 'Sanctuary' },
    { id: 'os-7', name: 'Securing Frost Peak Cable-Way', icon: '🚠', category: 'Structure' },
  ],
  nosql: [
    { id: 'nosql-1', name: 'Restoring Neon Data Spires', icon: '🏛️', category: 'Architecture' },
    { id: 'nosql-2', name: 'Excavating Sharded Vault Archives', icon: '📜', category: 'Archaeology' },
    { id: 'nosql-3', name: 'Paving Query Canal Footbridge', icon: '🌉', category: 'Masonry' },
    { id: 'nosql-4', name: 'Repairing Document Grid Fountain', icon: '⛲', category: 'Waterwork' },
    { id: 'nosql-5', name: 'Illuminating Key-Value Lantern Pathway', icon: '🏮', category: 'Trail' },
    { id: 'nosql-6', name: 'Erecting Resilient Replica Citadel', icon: '🏰', category: 'Citadel' },
    { id: 'nosql-7', name: 'Planting Magenta Crystal Blossom Bushes', icon: '💎', category: 'Flora' },
  ],
  hda_cognitive: [
    { id: 'hda-1', name: 'Planting Neural Flora Botanical Garden', icon: '🌺', category: 'Flora' },
    { id: 'hda-2', name: 'Crafting Healthcare Healer Shrine', icon: '⛩️', category: 'Shrine' },
    { id: 'hda-3', name: 'Carving Synaptic Crystal Promenade', icon: '🔮', category: 'Trail' },
    { id: 'hda-4', name: 'Raising Biometric Water Pavilion', icon: '🏛️', category: 'Architecture' },
    { id: 'hda-5', name: 'Assembling Cognitive Insight Totem', icon: '🧠', category: 'Monument' },
    { id: 'hda-6', name: 'Building Herbal Memory Terrace', icon: '🌿', category: 'Sanctuary' },
    { id: 'hda-7', name: 'Placing Amethyst Reflection Benches', icon: '🪑', category: 'Masonry' },
  ],
  gv: [
    { id: 'gv-1', name: 'Laying Sky-Bridge Stone Walkway', icon: '🌉', category: 'Structure' },
    { id: 'gv-2', name: 'Hoisting Windmill Observation Tower', icon: '⛵', category: 'Engineering' },
    { id: 'gv-3', name: 'Anchoring Aether Float Crystals', icon: '✨', category: 'Monument' },
    { id: 'gv-4', name: 'Carving Cloud Crest Hiking Trail', icon: '🥾', category: 'Trail' },
    { id: 'gv-5', name: 'Constructing Glider Launch Deck', icon: '🪁', category: 'Flight' },
    { id: 'gv-6', name: 'Planting Zephyr Blossom Meadow', icon: '🌸', category: 'Flora' },
    { id: 'gv-7', name: 'Building Star-Gazing Astrolabe Terrace', icon: '🔭', category: 'Sanctuary' },
  ],
};

export function getRandomRealmPreset(subjectId: SubjectId): RealmPreset {
  const list = REALM_PRESETS[subjectId] || REALM_PRESETS.daa;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

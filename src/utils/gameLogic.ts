import type { SubjectId, Subject, Achievement, AppState, StudySession, TimeFormat } from '../types';

// ============================================================
// XP & Level System
// ============================================================

export function xpForLevel(level: number): number {
  // XP required to reach a given level (cumulative)
  return Math.floor(100 * Math.pow(1.35, level - 1));
}

export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  let accumulated = 0;
  while (accumulated + xpForLevel(level) <= xp) {
    accumulated += xpForLevel(level);
    level++;
  }
  return level;
}

export function getLevelProgress(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progress: number } {
  const level = getLevelFromXp(xp);
  const totalForCurrentLevel = getTotalXpForLevel(level);
  const xpInLevel = xp - totalForCurrentLevel;
  const nextLevelXp = xpForLevel(level);
  return {
    level,
    currentLevelXp: xpInLevel,
    nextLevelXp,
    progress: Math.min(xpInLevel / nextLevelXp, 1),
  };
}

export function calculateXpForSession(durationMinutes: number, completed: boolean): number {
  const base = durationMinutes; // 1 XP per minute
  const completionBonus = completed ? 25 : 0;
  return base + completionBonus;
}

// ============================================================
// Time Utilities
// ============================================================

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatTime(
  minutes: number,
  format: TimeFormat = 'hours_decimal'
): string {
  const roundedMin = Math.round(minutes);

  if (format === 'minutes') {
    return `${roundedMin}m`;
  }

  // Decimal hours e.g. 2.5h, 0.5h, 4.5h
  const decimalVal = minutes / 60;
  const roundedDecimal = Math.round(decimalVal * 10) / 10;
  const decimalStr = roundedDecimal % 1 === 0
    ? `${roundedDecimal}h`
    : `${roundedDecimal.toFixed(1)}h`;

  if (format === 'hours_decimal') {
    return decimalStr;
  }

  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  let hmStr = '';
  if (h === 0) {
    hmStr = `${m}m`;
  } else if (m === 0) {
    hmStr = `${h}h`;
  } else {
    hmStr = `${h}h ${m}m`;
  }

  if (format === 'hours_mins') {
    return hmStr;
  }

  // 'both' (e.g. 2.5h [150m] or 2h 30m [150m])
  if (minutes >= 60) {
    return `${decimalStr} (${roundedMin}m)`;
  }
  return `${roundedMin}m`;
}

export function formatMinutes(minutes: number, format?: TimeFormat): string {
  if (format) {
    return formatTime(minutes, format);
  }
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function msToMinutes(ms: number): number {
  return ms / 60000;
}

export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

// ============================================================
// Streak Calculation
// ============================================================

export function calculateStreak(sessions: StudySession[], subjectId?: SubjectId): { current: number; longest: number } {
  const filtered = subjectId ? sessions.filter(s => s.subjectId === subjectId && s.completed) : sessions.filter(s => s.completed);
  
  if (filtered.length === 0) return { current: 0, longest: 0 };
  
  const days = new Set(filtered.map(s => s.startTime.slice(0, 10)));
  const sortedDays = Array.from(days).sort().reverse();
  
  const today = todayDateString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  
  // If no session today or yesterday, streak is 0
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) {
    return { current: 0, longest: longestStreak(sortedDays) };
  }
  
  let current = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      current++;
    } else {
      break;
    }
  }
  
  return { current, longest: longestStreak(sortedDays) };
}

function longestStreak(sortedDaysDesc: string[]): number {
  if (sortedDaysDesc.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sortedDaysDesc.length; i++) {
    const prev = new Date(sortedDaysDesc[i - 1]);
    const curr = new Date(sortedDaysDesc[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

// ============================================================
// Subject Time Calculations
// ============================================================

export function getSubjectMinutesForPeriod(
  sessions: StudySession[],
  subjectId: SubjectId,
  period: 'today' | 'week' | 'month' | 'all'
): number {
  const now = new Date();
  const today = todayDateString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  
  return sessions
    .filter(s => s.subjectId === subjectId && s.completed)
    .filter(s => {
      const d = s.startTime.slice(0, 10);
      if (period === 'today') return d === today;
      if (period === 'week') return d >= weekAgo;
      if (period === 'month') return d >= monthAgo;
      return true;
    })
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

export function getTotalMinutesForPeriod(
  sessions: StudySession[],
  period: 'today' | 'week' | 'month' | 'all'
): number {
  const now = new Date();
  const today = todayDateString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  
  return sessions
    .filter(s => s.completed)
    .filter(s => {
      const d = s.startTime.slice(0, 10);
      if (period === 'today') return d === today;
      if (period === 'week') return d >= weekAgo;
      if (period === 'month') return d >= monthAgo;
      return true;
    })
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}

// ============================================================
// Daily Study Data for Charts
// ============================================================

export function getDailyStudyData(sessions: StudySession[], days: number): { date: string; label: string; total: number; bySubject: Record<SubjectId, number> }[] {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const daySessions = sessions.filter(s => s.completed && s.startTime.slice(0, 10) === dateStr);
    const bySubject: Record<string, number> = { daa: 0, os: 0, nosql: 0, hda_cognitive: 0, gv: 0 };
    daySessions.forEach(s => { bySubject[s.subjectId] = (bySubject[s.subjectId] || 0) + s.durationMinutes; });
    result.push({ date: dateStr, label, total: daySessions.reduce((sum, s) => sum + s.durationMinutes, 0), bySubject: bySubject as Record<SubjectId, number> });
  }
  return result;
}

// ============================================================
// Realm Unlock Elements
// ============================================================

export function getUnlockedElements(subjectId: SubjectId, totalMinutes: number, level: number): string[] {
  const elements = REALM_ELEMENTS[subjectId];
  return elements.filter(e => totalMinutes >= e.minutesRequired && level >= e.levelRequired).map(e => e.id);
}

export const REALM_ELEMENTS: Record<SubjectId, Array<{ id: string; name: string; minutesRequired: number; levelRequired: number; description: string }>> = {
  daa: [
    { id: 'daa_sapling', name: 'First Sapling', minutesRequired: 0, levelRequired: 1, description: 'A tiny sapling begins to grow.' },
    { id: 'daa_path', name: 'Forest Path', minutesRequired: 30, levelRequired: 1, description: 'A winding path through the trees.' },
    { id: 'daa_bush', name: 'Magic Bushes', minutesRequired: 60, levelRequired: 2, description: 'Colorful bushes bloom.' },
    { id: 'daa_flowers', name: 'Algorithm Flowers', minutesRequired: 100, levelRequired: 2, description: 'Flowers representing recursive patterns.' },
    { id: 'daa_stream', name: 'Forest Stream', minutesRequired: 150, levelRequired: 3, description: 'A gentle stream flows through the forest.' },
    { id: 'daa_bridge', name: 'Wooden Bridge', minutesRequired: 250, levelRequired: 4, description: 'A bridge connecting forest areas.' },
    { id: 'daa_cabin', name: 'Algorithm Cabin', minutesRequired: 400, levelRequired: 5, description: 'A cabin for deep algorithmic thinking.' },
    { id: 'daa_treehouse', name: 'Tree House', minutesRequired: 600, levelRequired: 7, description: 'A house built among the great trees.' },
    { id: 'daa_river', name: 'River Crossing', minutesRequired: 800, levelRequired: 8, description: 'A river flows through the heart of the forest.' },
    { id: 'daa_ancient_tree', name: 'Ancient Knowledge Tree', minutesRequired: 1000, levelRequired: 10, description: 'The legendary tree of infinite algorithms.' },
    { id: 'daa_waterfall', name: 'Algorithm Waterfall', minutesRequired: 1500, levelRequired: 12, description: 'A magnificent waterfall of flowing logic.' },
    { id: 'daa_sacred_grove', name: 'Sacred Grove', minutesRequired: 2500, levelRequired: 15, description: 'The sacred heart of the Algorithmic Forest.' },
  ],
  os: [
    { id: 'os_basecamp', name: 'Base Camp', minutesRequired: 0, levelRequired: 1, description: 'The starting point of your expedition.' },
    { id: 'os_trail', name: 'Mountain Trail', minutesRequired: 30, levelRequired: 1, description: 'A trail begins winding up the mountain.' },
    { id: 'os_tent', name: 'First Tent', minutesRequired: 60, levelRequired: 2, description: 'A tent for rest and planning.' },
    { id: 'os_cave', name: 'Mountain Cave', minutesRequired: 100, levelRequired: 2, description: 'A cave offering shelter.' },
    { id: 'os_flag1', name: 'First Flag', minutesRequired: 150, levelRequired: 3, description: 'A flag planted at a minor peak.' },
    { id: 'os_camp2', name: 'Second Camp', minutesRequired: 250, levelRequired: 4, description: 'Camp established at mid-mountain.' },
    { id: 'os_peak1', name: 'First Peak', minutesRequired: 400, levelRequired: 5, description: 'The first peak conquered.' },
    { id: 'os_snow', name: 'Snow Fields', minutesRequired: 600, levelRequired: 7, description: 'Snow-covered upper reaches.' },
    { id: 'os_flag2', name: 'Summit Flag', minutesRequired: 800, levelRequired: 8, description: 'A flag at the high summit.' },
    { id: 'os_observatory', name: 'Summit Observatory', minutesRequired: 1000, levelRequired: 10, description: 'An observatory overlooking all systems.' },
    { id: 'os_peak2', name: 'Twin Peaks', minutesRequired: 1500, levelRequired: 12, description: 'The legendary twin peaks of OS mastery.' },
    { id: 'os_summit', name: 'Grand Summit', minutesRequired: 2500, levelRequired: 15, description: 'The ultimate summit — OS mastery achieved.' },
  ],
  nosql: [
    { id: 'nosql_road', name: 'First Road', minutesRequired: 0, levelRequired: 1, description: 'The city\'s first road is laid.' },
    { id: 'nosql_terminal', name: 'Data Terminal', minutesRequired: 30, levelRequired: 1, description: 'A data terminal comes online.' },
    { id: 'nosql_small_building', name: 'Small Building', minutesRequired: 60, levelRequired: 2, description: 'The first building rises.' },
    { id: 'nosql_neon', name: 'Neon Signs', minutesRequired: 100, levelRequired: 2, description: 'Neon signs light the streets.' },
    { id: 'nosql_server', name: 'Server Farm', minutesRequired: 150, levelRequired: 3, description: 'A server farm is established.' },
    { id: 'nosql_district', name: 'Data District', minutesRequired: 250, levelRequired: 4, description: 'A new city district opens.' },
    { id: 'nosql_datacenter', name: 'Data Center', minutesRequired: 400, levelRequired: 5, description: 'A massive data center is constructed.' },
    { id: 'nosql_skyscraper', name: 'Skyscraper', minutesRequired: 600, levelRequired: 7, description: 'A skyscraper towers over the city.' },
    { id: 'nosql_metro', name: 'Metro System', minutesRequired: 800, levelRequired: 8, description: 'An underground metro connects districts.' },
    { id: 'nosql_tower', name: 'Central Data Tower', minutesRequired: 1000, levelRequired: 10, description: 'The legendary central data tower rises.' },
    { id: 'nosql_hyperloop', name: 'Hyperloop', minutesRequired: 1500, levelRequired: 12, description: 'Hyperloop connects all city nodes.' },
    { id: 'nosql_megacity', name: 'Mega City Core', minutesRequired: 2500, levelRequired: 15, description: 'The city becomes a futuristic mega-metropolis.' },
  ],
  hda_cognitive: [
    { id: 'hda_entrance', name: 'Realm Entrance', minutesRequired: 0, levelRequired: 1, description: 'The entrance to the discovery realm.' },
    { id: 'hda_station', name: 'Research Station', minutesRequired: 30, levelRequired: 1, description: 'First healthcare research station.' },
    { id: 'hda_lab', name: 'Analytics Lab', minutesRequired: 60, levelRequired: 2, description: 'Medical data laboratory opens.' },
    { id: 'hda_hospital', name: 'Healthcare Building', minutesRequired: 100, levelRequired: 2, description: 'A healthcare analytics building.' },
    { id: 'hda_garden', name: 'Cognitive Garden', minutesRequired: 150, levelRequired: 3, description: 'A magical mind garden emerges.' },
    { id: 'hda_neural', name: 'Neural Pathways', minutesRequired: 250, levelRequired: 4, description: 'Glowing neural pathways appear.' },
    { id: 'hda_bridge', name: 'Connection Bridge', minutesRequired: 400, levelRequired: 5, description: 'A bridge between healthcare and cognition zones.' },
    { id: 'hda_memory_tree', name: 'Memory Trees', minutesRequired: 600, levelRequired: 7, description: 'Ancient memory trees grow.' },
    { id: 'hda_floating', name: 'Floating Islands', minutesRequired: 800, levelRequired: 8, description: 'Thought-bubble floating islands appear.' },
    { id: 'hda_observatory', name: 'HC&CI Observatory', minutesRequired: 1000, levelRequired: 10, description: 'The Healthcare & Cognitive Intelligence Observatory.' },
    { id: 'hda_network', name: 'Intelligence Network', minutesRequired: 1500, levelRequired: 12, description: 'A vast intelligence network spreads.' },
    { id: 'hda_temple', name: 'Intelligence Temple', minutesRequired: 2500, levelRequired: 15, description: 'The central intelligence temple rises.' },
  ],
  gv: [
    { id: 'gv_node1', name: 'First Node', minutesRequired: 0, levelRequired: 1, description: 'The first node of your network.' },
    { id: 'gv_edge1', name: 'First Edge', minutesRequired: 30, levelRequired: 1, description: 'Two nodes connect with an edge.' },
    { id: 'gv_cluster', name: 'Node Cluster', minutesRequired: 60, levelRequired: 2, description: 'A small cluster of nodes forms.' },
    { id: 'gv_bridge', name: 'Network Bridge', minutesRequired: 100, levelRequired: 2, description: 'A bridge connects two clusters.' },
    { id: 'gv_island', name: 'Graph Island', minutesRequired: 150, levelRequired: 3, description: 'A geometric island emerges.' },
    { id: 'gv_region', name: 'Graph Region', minutesRequired: 250, levelRequired: 4, description: 'A new graph region unlocks.' },
    { id: 'gv_network', name: 'Spanning Network', minutesRequired: 400, levelRequired: 5, description: 'A spanning network connects realms.' },
    { id: 'gv_constellation', name: 'Node Constellation', minutesRequired: 600, levelRequired: 7, description: 'Nodes form constellation patterns.' },
    { id: 'gv_core', name: 'Network Core', minutesRequired: 800, levelRequired: 8, description: 'The network core glows with power.' },
    { id: 'gv_megacore', name: 'Mega Network Core', minutesRequired: 1000, levelRequired: 10, description: 'The legendary interconnected graph structure.' },
    { id: 'gv_hypernetwork', name: 'Hyper Network', minutesRequired: 1500, levelRequired: 12, description: 'An immense hyper-connected network.' },
    { id: 'gv_universe', name: 'Graph Universe', minutesRequired: 2500, levelRequired: 15, description: 'The entire graph universe is connected.' },
  ],
};

// ============================================================
// Achievements
// ============================================================

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', name: 'First Step', description: 'Complete your first study session.', icon: '🌱', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'sessions', value: 1 } },
  { id: 'deep_focus', name: 'Deep Focus', description: 'Complete a full 50-minute session.', icon: '🧘', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'sessions', value: 1 } },
  { id: 'getting_started', name: 'Getting Started', description: 'Study for a total of 100 minutes.', icon: '📚', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'minutes', value: 100 } },
  { id: 'realm_builder', name: 'Realm Builder', description: 'Reach level 5 in any realm.', icon: '🏰', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'level', value: 5 } },
  { id: 'forest_guardian', name: 'Forest Guardian', description: 'Unlock 10 elements in the Algorithmic Forest.', icon: '🌳', category: 'daa', unlocked: false, unlockedAt: null, condition: { type: 'elements', subjectId: 'daa', value: 10 } },
  { id: 'mountain_climber', name: 'Mountain Climber', description: 'Reach a major peak in the Mountain of Systems.', icon: '⛰️', category: 'os', unlocked: false, unlockedAt: null, condition: { type: 'elements', subjectId: 'os', value: 5 } },
  { id: 'city_builder', name: 'City Builder', description: 'Unlock 10 buildings in the Data City.', icon: '🏙️', category: 'nosql', unlocked: false, unlockedAt: null, condition: { type: 'elements', subjectId: 'nosql', value: 10 } },
  { id: 'healthcare_explorer', name: 'Healthcare Explorer', description: 'Unlock 5 healthcare research elements.', icon: '🏥', category: 'hda_cognitive', unlocked: false, unlockedAt: null, condition: { type: 'elements', subjectId: 'hda_cognitive', value: 5 } },
  { id: 'cognitive_explorer', name: 'Cognitive Explorer', description: 'Unlock 8 cognitive realm elements.', icon: '🧠', category: 'hda_cognitive', unlocked: false, unlockedAt: null, condition: { type: 'elements', subjectId: 'hda_cognitive', value: 8 } },
  { id: 'network_architect', name: 'Network Architect', description: 'Connect 8 node elements in the Graph Realm.', icon: '🕸️', category: 'gv', unlocked: false, unlockedAt: null, condition: { type: 'elements', subjectId: 'gv', value: 8 } },
  { id: 'consistency_master', name: 'Consistency Master', description: 'Study for 7 consecutive days.', icon: '🔥', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'streak', value: 7 } },
  { id: 'knowledge_explorer', name: 'Knowledge Explorer', description: 'Study all five subjects.', icon: '🗺️', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'all_subjects', value: 1 } },
  { id: 'study_champion', name: 'Study Champion', description: 'Complete 50 Pomodoro sessions.', icon: '🏆', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'sessions', value: 50 } },
  { id: 'god_of_realms', name: 'God of Realms', description: 'Reach level 10 in all five realms.', icon: '👑', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'all_levels', value: 10 } },
  { id: 'century', name: 'Century Scholar', description: 'Complete 100 Pomodoro sessions.', icon: '💯', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'sessions', value: 100 } },
  { id: 'speed_learner', name: 'Speed Learner', description: 'Study 500 total minutes.', icon: '⚡', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'minutes', value: 500 } },
  { id: 'master_scholar', name: 'Master Scholar', description: 'Study 1000 total minutes.', icon: '📖', category: 'general', unlocked: false, unlockedAt: null, condition: { type: 'minutes', value: 1000 } },
  { id: 'daa_master', name: 'Algorithm Master', description: 'Reach level 10 in DAA.', icon: '🌲', category: 'daa', unlocked: false, unlockedAt: null, condition: { type: 'level', subjectId: 'daa', value: 10 } },
  { id: 'os_master', name: 'Systems Master', description: 'Reach level 10 in OS.', icon: '🏔️', category: 'os', unlocked: false, unlockedAt: null, condition: { type: 'level', subjectId: 'os', value: 10 } },
  { id: 'nosql_master', name: 'Database Master', description: 'Reach level 10 in NoSQL.', icon: '🌆', category: 'nosql', unlocked: false, unlockedAt: null, condition: { type: 'level', subjectId: 'nosql', value: 10 } },
  { id: 'hda_master', name: 'Discovery Master', description: 'Reach level 10 in HDA & Cognitive Intelligence.', icon: '🔬', category: 'hda_cognitive', unlocked: false, unlockedAt: null, condition: { type: 'level', subjectId: 'hda_cognitive', value: 10 } },
  { id: 'gv_master', name: 'Graph Master', description: 'Reach level 10 in Graph Visualization.', icon: '🔗', category: 'gv', unlocked: false, unlockedAt: null, condition: { type: 'level', subjectId: 'gv', value: 10 } },
];

// ============================================================
// Check Achievements
// ============================================================

export function checkAchievements(
  achievements: Achievement[],
  subjects: Record<SubjectId, Subject>,
  sessions: StudySession[],
  globalStreak: number
): { updated: Achievement[]; newlyUnlocked: Achievement[] } {
  const totalSessions = sessions.filter(s => s.completed).length;
  const totalMinutes = sessions.filter(s => s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);
  const subjectIds: SubjectId[] = ['daa', 'os', 'nosql', 'hda_cognitive', 'gv'];
  const allStudied = subjectIds.every(id => subjects[id].sessionsCompleted > 0);
  const allLevel10 = subjectIds.every(id => subjects[id].level >= 10);

  const newlyUnlocked: Achievement[] = [];

  const updated = achievements.map(a => {
    if (a.unlocked) return a;

    let shouldUnlock = false;
    const c = a.condition;

    if (c.type === 'sessions') {
      if (c.subjectId) {
        shouldUnlock = subjects[c.subjectId].sessionsCompleted >= c.value;
      } else {
        shouldUnlock = totalSessions >= c.value;
      }
    } else if (c.type === 'minutes') {
      if (c.subjectId) {
        shouldUnlock = subjects[c.subjectId].totalMinutes >= c.value;
      } else {
        shouldUnlock = totalMinutes >= c.value;
      }
    } else if (c.type === 'level') {
      if (c.subjectId) {
        shouldUnlock = subjects[c.subjectId].level >= c.value;
      } else {
        shouldUnlock = subjectIds.some(id => subjects[id].level >= c.value);
      }
    } else if (c.type === 'streak') {
      shouldUnlock = globalStreak >= c.value || subjectIds.some(id => subjects[id].currentStreak >= c.value);
    } else if (c.type === 'elements') {
      const sid = c.subjectId!;
      shouldUnlock = subjects[sid].unlockedElements.length >= c.value;
    } else if (c.type === 'all_subjects') {
      shouldUnlock = allStudied;
    } else if (c.type === 'all_levels') {
      shouldUnlock = allLevel10;
    }

    if (shouldUnlock) {
      const unlocked = { ...a, unlocked: true, unlockedAt: new Date().toISOString() };
      newlyUnlocked.push(unlocked);
      return unlocked;
    }
    return a;
  });

  return { updated, newlyUnlocked };
}

// ============================================================
// Default State
// ============================================================

export interface BuildProject {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  minutesEstimate: number;
}

export const REALM_BUILD_PROJECTS: Record<SubjectId, BuildProject[]> = {
  daa: [
    {
      id: 'daa_plant_pine',
      name: 'Plant Ancient Alpine Pine',
      icon: '🌲',
      category: 'Foliage',
      description: 'Cultivates a tall evergreen pine rooted in algorithmic logic to shade the forest floor.',
      minutesEstimate: 50,
    },
    {
      id: 'daa_cherry_grove',
      name: 'Bloom Sakura Blossom Grove',
      icon: '🌸',
      category: 'Grove',
      description: 'Sprouts vibrant pink cherry blossom petals that glow with recursive energy.',
      minutesEstimate: 50,
    },
    {
      id: 'daa_stone_path',
      name: 'Pave Mossy Forest Path',
      icon: '🪨',
      category: 'Trail',
      description: 'Lays polished mossy stepping stones connecting the Ancient World Tree to the glade.',
      minutesEstimate: 50,
    },
    {
      id: 'daa_fairy_mushrooms',
      name: 'Nurture Mystic Mushroom Ring',
      icon: '🍄',
      category: 'Flora',
      description: 'Grows a circle of red-and-white spotted bioluminescent fairy mushrooms.',
      minutesEstimate: 50,
    },
    {
      id: 'daa_wood_bridge',
      name: 'Construct Log Footbridge',
      icon: '🪵',
      category: 'Structure',
      description: 'Builds a sturdy timber log bridge across the rushing binary algorithm creek.',
      minutesEstimate: 50,
    },
  ],
  os: [
    {
      id: 'os_carve_trail',
      name: 'Carve Mountain Hiking Trail',
      icon: '🥾',
      category: 'Hiking Path',
      description: 'Carves a rugged switchback hiking trail ascending the sheer granite mountain cliffs.',
      minutesEstimate: 50,
    },
    {
      id: 'os_hiking_steps',
      name: 'Place Stone Hiking Steps',
      icon: '🪨',
      category: 'Trail',
      description: 'Lays heavy granite steps into the steep rockface to secure passage to the mid-plateau.',
      minutesEstimate: 50,
    },
    {
      id: 'os_campfire_hearth',
      name: 'Kindle Campfire Hearth',
      icon: '🔥',
      category: 'Basecamp',
      description: 'Arranges river stones around a warm crackling campfire with dancing embers and smoke.',
      minutesEstimate: 50,
    },
    {
      id: 'os_basecamp_tent',
      name: 'Pitch Expedition Tent',
      icon: '⛺',
      category: 'Shelter',
      description: 'Erects a weatherproof mountaineering basecamp shelter packed with survival maps.',
      minutesEstimate: 50,
    },
    {
      id: 'os_watchtower',
      name: 'Construct Summit Watchtower',
      icon: '🗼',
      category: 'Outpost',
      description: 'Builds a sturdy timber observation outpost perched on the snowy high summit peak.',
      minutesEstimate: 50,
    },
  ],
  nosql: [
    {
      id: 'nosql_colonnade',
      name: 'Restore Marble Colonnade Pillars',
      icon: '🏛️',
      category: 'Ruins',
      description: 'Raises towering fluted marble columns overgrown with ancient creepers and moss.',
      minutesEstimate: 50,
    },
    {
      id: 'nosql_magenta_conduit',
      name: 'Ignite Subterranean Magenta Conduit',
      icon: '🔮',
      category: 'Power Grid',
      description: 'Channels pulsating neon-magenta data streams through cracked stone courtyard flagstones.',
      minutesEstimate: 50,
    },
    {
      id: 'nosql_library_vault',
      name: 'Excavate Ancient Library Vault',
      icon: '📚',
      category: 'Archive',
      description: 'Unearths a stepped stone vault chamber storing thousands of lost distributed records.',
      minutesEstimate: 50,
    },
    {
      id: 'nosql_sharded_monolith',
      name: 'Chisel Sharded Index Monolith',
      icon: '💎',
      category: 'Monolith',
      description: 'Carves an obsidian index obelisk that refracts glowing purple cluster glyphs.',
      minutesEstimate: 50,
    },
  ],
  hda_cognitive: [
    {
      id: 'hda_neural_arch',
      name: 'Weave Neural Synapse Arch',
      icon: '🧠',
      category: 'Bio-Architecture',
      description: 'Twines luminescent coral branches into a brain archway pulsing with synaptic sparks.',
      minutesEstimate: 50,
    },
    {
      id: 'hda_research_pavilion',
      name: 'Build Medical Research Pavilion',
      icon: '🏥',
      category: 'Sanctuary',
      description: 'Constructs an arched white-stone diagnostic apothecary clinic with terracotta roof tiles.',
      minutesEstimate: 50,
    },
    {
      id: 'hda_healing_pond',
      name: 'Carve Serene Reflection Pond',
      icon: '💧',
      category: 'Waterway',
      description: 'Channels crystalline healing spring waters filled with pink lotus lilies and smooth stones.',
      minutesEstimate: 50,
    },
    {
      id: 'hda_memory_grove',
      name: 'Plant Healing Lavender Garden',
      icon: '🌺',
      category: 'Botanical',
      description: 'Blooms calming wisteria and medicinal lavender beds to enhance cognitive restoration.',
      minutesEstimate: 50,
    },
  ],
  gv: [
    {
      id: 'gv_ley_bridge',
      name: 'Weave Glowing Sky Ley Bridge',
      icon: '🌉',
      category: 'Sky Bridge',
      description: 'Draws a radiant pink-and-gold energy beam bridge connecting suspended sky islands.',
      minutesEstimate: 50,
    },
    {
      id: 'gv_satellite_islet',
      name: 'Anchor Floating Satellite Islet',
      icon: '🏝️',
      category: 'Island',
      description: 'Tethers a new levitating stone island into the celestial graph archipelago.',
      minutesEstimate: 50,
    },
    {
      id: 'gv_coordinate_pylon',
      name: 'Erect Graph Coordinate Pylon',
      icon: '⚡',
      category: 'Topology',
      description: 'Raises a geometric network spire with a pulsating golden coordinate sphere atop.',
      minutesEstimate: 50,
    },
    {
      id: 'gv_celestial_astrolabe',
      name: 'Calibrate Celestial Astrolabe',
      icon: '🔭',
      category: 'Cosmic Gear',
      description: 'Aligns rotating brass constellation rings and lenses pointing into cosmic graph space.',
      minutesEstimate: 50,
    },
  ],
};

export const REALMS_CONFIG: Record<SubjectId, {
  id: SubjectId;
  subject: string;
  title: string;
  realmType: string;
  description: string;
  theme: 'forest' | 'mountain' | 'ancient-city' | 'sanctuary' | 'floating-islands';
  relic: string;
  relicLore: string;
  color: string;
  glowColor: string;
  darkColor: string;
}> = {
  daa: {
    id: 'daa',
    subject: 'Tree Realm (DAA)',
    title: 'Tree Realm — Algorithmic Forest',
    realmType: 'Tree & Forest Realm',
    description: 'Design and Analysis of Algorithms',
    theme: 'forest',
    relic: 'Algorithmic Axe',
    relicLore: 'A mystical double-bladed battleaxe forged from sacred yew and runic emerald stone, embedded in the ancient Knowledge Tree. Its edge hums with binary logic.',
    color: '#22c55e',
    glowColor: '#4ade80',
    darkColor: '#166534',
  },
  os: {
    id: 'os',
    subject: 'Mountain Realm (OS)',
    title: 'Mountain Realm — Peaks & Trails',
    realmType: 'Mountain & Hiking Trail Realm',
    description: 'Operating Systems',
    theme: 'mountain',
    relic: 'System Guardian Hammer',
    relicLore: 'A monolithic runic warhammer of glacier-forged steel resting upon an ancient mountain shrine. Its frost-etched head commands system stability.',
    color: '#60a5fa',
    glowColor: '#93c5fd',
    darkColor: '#1e3a5f',
  },
  nosql: {
    id: 'nosql',
    subject: 'City Ruins (NoSQL)',
    title: 'City Realm — Ancient Stone Ruins',
    realmType: 'Ancient City Ruins Realm',
    description: 'NoSQL Databases',
    theme: 'ancient-city',
    relic: 'Data Relic Blade',
    relicLore: 'A crystalline broadblade sheathed in ancient stone, entwined with creeping vines and radiating magenta data streams.',
    color: '#f472b6',
    glowColor: '#f9a8d4',
    darkColor: '#831843',
  },
  hda_cognitive: {
    id: 'hda_cognitive',
    subject: 'Sanctuary (HDA & CI)',
    title: 'Sanctuary Realm — Mind & Healthcare',
    realmType: 'Mind & Healthcare Sanctuary Realm',
    description: 'Healthcare Data Analytics and Cognitive Intelligence',
    theme: 'sanctuary',
    relic: 'Mind Seeker Staff',
    relicLore: 'An ornate botanical staff topped with a spiraling neural amethyst crystal wrapped in golden laurels. Emits healing aura waves.',
    color: '#a78bfa',
    glowColor: '#c4b5fd',
    darkColor: '#4c1d95',
  },
  gv: {
    id: 'gv',
    subject: 'Floating Isles (GV)',
    title: 'Islands Realm — Floating Sky Archipelago',
    realmType: 'Floating Sky Islands Realm',
    description: 'Graph Visualization',
    theme: 'floating-islands',
    relic: 'Connector Spear',
    relicLore: 'A celestial golden trident-spear hovering above an ancient central compass dial, projecting interconnected energy lines between floating sky citadels.',
    color: '#fb923c',
    glowColor: '#fdba74',
    darkColor: '#7c2d12',
  },
};

export function createDefaultSubject(
  id: SubjectId,
  name: string,
  shortName: string,
  realmName: string,
  description: string,
  theme: 'forest' | 'mountain' | 'ancient-city' | 'sanctuary' | 'floating-islands',
  relic: string,
  relicLore: string,
  color: string,
  glowColor: string,
  darkColor: string
): Subject {
  return {
    id, name, shortName, realmName, description,
    theme, relic, relicLore,
    color, glowColor, darkColor,
    totalMinutes: 0, todayMinutes: 0, weekMinutes: 0, monthMinutes: 0,
    xp: 0, level: 1, sessionsCompleted: 0,
    currentStreak: 0, longestStreak: 0, lastStudiedDate: null,
    unlockedElements: ['daa_sapling', 'os_basecamp', 'nosql_road', 'hda_entrance', 'gv_node1'].filter(e => e.startsWith(id.split('_')[0])),
    studyGoalMinutes: 60,
  };
}

export function getDefaultState(): AppState {
  const today = todayDateString();
  return {
    subjects: {
      daa: createDefaultSubject('daa', 'Tree Realm: Algorithmic Forest', 'Tree Realm (DAA)', 'Algorithmic Tree Forest', 'Master algorithms, data structures, and problem-solving strategies in the magical pixel-art tree forest.', 'forest', 'Algorithmic Axe', REALMS_CONFIG.daa.relicLore, '#22c55e', '#4ade80', '#166534'),
      os: createDefaultSubject('os', 'Mountain Realm: Peaks & Trails', 'Mountain Realm (OS)', 'Mountain Peaks & Trails', 'Conquer operating systems concepts as you climb the rocky summits and hiking trails of the Mountain of Systems.', 'mountain', 'System Guardian Hammer', REALMS_CONFIG.os.relicLore, '#60a5fa', '#93c5fd', '#1e3a5f'),
      nosql: createDefaultSubject('nosql', 'City Ruins Realm: Lost Data City', 'City Ruins (NoSQL)', 'Ancient Stone City Ruins', 'Unearth the ancient stone city ruins as you master NoSQL databases, queries, and distributed architectures.', 'ancient-city', 'Data Relic Blade', REALMS_CONFIG.nosql.relicLore, '#f472b6', '#f9a8d4', '#831843'),
      hda_cognitive: createDefaultSubject('hda_cognitive', 'Sanctuary Realm: Mind & Healthcare', 'Sanctuary (HDA & CI)', 'Mind & Healthcare Sanctuary', 'Explore the botanical sanctuary uniting healthcare diagnostics and cognitive intelligence.', 'sanctuary', 'Mind Seeker Staff', REALMS_CONFIG.hda_cognitive.relicLore, '#a78bfa', '#c4b5fd', '#4c1d95'),
      gv: createDefaultSubject('gv', 'Floating Islands Realm: Sky Archipelago', 'Floating Isles (GV)', 'Floating Sky Islands', 'Connect nodes, trace edges, and build your floating network archipelago as you master Graph Visualization.', 'floating-islands', 'Connector Spear', REALMS_CONFIG.gv.relicLore, '#fb923c', '#fdba74', '#7c2d12'),
    },
    sessions: [],
    timer: {
      isRunning: false,
      isPaused: false,
      mode: 'study',
      selectedSubject: null,
      startTime: null,
      pausedAt: null,
      accumulatedMs: 0,
      targetDurationMs: 50 * 60 * 1000,
      sessionStartTime: null,
      sessionCount: 0,
    },
    achievements: DEFAULT_ACHIEVEMENTS,
    settings: {
      studyDurationMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      dailyGoalMinutes: 120,
      soundEnabled: true,
      animationsEnabled: true,
      theme: 'pink',
      timeFormat: 'hours_decimal',
      subjectOverrides: { daa: {}, os: {}, nosql: {}, hda_cognitive: {}, gv: {} },
    },
    lastDailyReset: today,
    globalStreak: 0,
    globalLongestStreak: 0,
    globalLastStudiedDate: null,
  };
}

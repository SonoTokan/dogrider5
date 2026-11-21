import {
  AchievementDef,
  ActiveRunSnapshot,
  AppPreferences,
  CharacterDef,
  DifficultyConfig,
} from '../types/game';

const PREFS_KEY = 'big_dog_bike_5_prefs_v1';
const CUSTOM_CHARS_KEY = 'big_dog_bike_5_custom_chars_v1';
const CUSTOM_DIFFS_KEY = 'big_dog_bike_5_custom_diffs_v1';
const CUSTOM_ACHS_KEY = 'big_dog_bike_5_custom_achs_v1';
const ACTIVE_RUN_KEY = 'big_dog_bike_5_active_run_v1';

export const DEFAULT_PREFERENCES: AppPreferences = {
  screen: 'LOBBY',
  mode: 'SOLO',
  difficultyId: 'novice',
  p1CharByMode: {
    SOLO: 'solo_postal_hound',
    MULTIPLAYER: 'mp_courier_poodle',
    COOP: 'coop_medic_retriever',
    AXIS_INVASION: 'axis_hans_mg',
  },
  p2CharByMode: {
    MULTIPLAYER: 'mp_track_greyhound',
    COOP: 'coop_tow_mastiff',
  },
  p2IsAi: true,
  muted: false,
  autoFire: true,
  inGame: false,
};

export function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return structuredClone(DEFAULT_PREFERENCES);
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      p1CharByMode: {
        ...DEFAULT_PREFERENCES.p1CharByMode,
        ...(parsed.p1CharByMode ?? {}),
      },
      p2CharByMode: {
        ...DEFAULT_PREFERENCES.p2CharByMode,
        ...(parsed.p2CharByMode ?? {}),
      },
    };
  } catch {
    return structuredClone(DEFAULT_PREFERENCES);
  }
}

export function persistPreferences(prefs: AppPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage quota errors
  }
}

export function loadCustomCharacters(): CharacterDef[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CHARS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistCustomCharacters(chars: CharacterDef[]): void {
  try {
    localStorage.setItem(CUSTOM_CHARS_KEY, JSON.stringify(chars));
  } catch {
    // ignore
  }
}

export function loadCustomDifficulties(): DifficultyConfig[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DIFFS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistCustomDifficulties(diffs: DifficultyConfig[]): void {
  try {
    localStorage.setItem(CUSTOM_DIFFS_KEY, JSON.stringify(diffs));
  } catch {
    // ignore
  }
}

export function loadCustomAchievements(): AchievementDef[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ACHS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistCustomAchievements(achs: AchievementDef[]): void {
  try {
    localStorage.setItem(CUSTOM_ACHS_KEY, JSON.stringify(achs));
  } catch {
    // ignore
  }
}

export function loadActiveRunSnapshot(): ActiveRunSnapshot | null {
  try {
    const raw = localStorage.getItem(ACTIVE_RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveRunSnapshot;
    if (!parsed || typeof parsed.scrollDist !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistActiveRunSnapshot(snapshot: ActiveRunSnapshot): void {
  try {
    localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export function clearActiveRunSnapshot(): void {
  try {
    localStorage.removeItem(ACTIVE_RUN_KEY);
  } catch {
    // ignore
  }
}

export type GameMode = 'SOLO' | 'MULTIPLAYER' | 'COOP' | 'AXIS_INVASION';

export type CharacterCategory = 'SOLO' | 'MULTIPLAYER' | 'COOP' | 'AXIS_INVASION';

export type BuiltInDifficultyId =
  | 'super_easy'
  | 'tutorial'
  | 'novice'
  | 'contender'
  | 'hard'
  | 'veteran'
  | 'shadow'
  | 'elite'
  | 'realistic'
  | 'silent';

export type DifficultyId = BuiltInDifficultyId | (string & {});

export type DarknessMode = 'none' | 'dim_shadow' | 'cyclic_blackout';

export type WeatherType = 'clear' | 'rain' | 'fog' | 'snow';

export interface DifficultyConfig {
  id: DifficultyId;
  tier: number;
  name: string;
  shortDesc: string;
  detailDesc: string;
  accentColor: string;
  roadSpeed: number;
  enemySpawnRate: number; // spawns per second
  obstacleSpawnRate: number;
  axisPatrolChance: number; // chance an enemy is an Axis infinite-ammo shooter
  enemyBulletSpeed: number;
  enemyFireInterval: number; // seconds
  damageMultiplier: number;
  darknessMode: DarknessMode;
  headlightRadius: number;
  // Drop probabilities (per pickup spawn roll)
  greenBoneChance: number;
  purpleBoneChance: number;
  bandageChance: number;
  medkitChance: number;
  scoreMultiplier: number;
  targetDistanceMeters: number;
  isCustom?: boolean;
}

export type BikeFrameStyle =
  | 'postal'
  | 'vintage28'
  | 'paperboy'
  | 'workshop'
  | 'delivery'
  | 'gravel'
  | 'parade'
  | 'track'
  | 'sidecar_medic'
  | 'cargo_tow'
  | 'folding_signal'
  | 'bakery_crate'
  | 'axis_mg'
  | 'axis_carbine'
  | 'axis_mortar'
  | 'axis_armored';

export type SkillType =
  | 'parcel_toss'
  | 'brass_bell'
  | 'paper_fan'
  | 'iron_mudguard'
  | 'soup_slick'
  | 'gravel_spray'
  | 'confetti_pull'
  | 'slipstream_dash'
  | 'field_bandage_zone'
  | 'steel_umbrella'
  | 'rally_whistle'
  | 'warm_biscuit'
  | 'mg_overclock'
  | 'rangefinder_mark'
  | 'mortar_salvo'
  | 'armored_ram';

export type WeaponStyle = 'none' | 'twin_mg' | 'piercing_carbine' | 'flak_mortar' | 'scatter_carbine';

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  breed: string;
  category: CharacterCategory;
  frameStyle: BikeFrameStyle;
  primaryColor: string;
  furColor: string;
  earColor: string;
  accessoryLabel: string;
  stats: {
    speed: number; // 1 - 10
    handling: number; // 1 - 10
    maxHp: number;
  };
  passiveName: string;
  passiveDesc: string;
  skillName: string;
  skillDesc: string;
  skillType: SkillType;
  skillCooldown: number; // seconds
  infiniteAmmo: boolean;
  weaponStyle: WeaponStyle;
  fireRate?: number; // shots per second if weaponStyle !== 'none'
  quirkStory: string;
  isCustom?: boolean;
}

export type PickupType = 'bone_normal' | 'bone_green' | 'bone_purple' | 'bandage' | 'medkit';

export type AchievementCategory =
  | 'mileage'
  | 'factions'
  | 'difficulty'
  | 'collection'
  | 'combat'
  | 'secret';

export interface AchievementDef {
  id: string;
  name: string;
  category: AchievementCategory;
  description: string;
  secret?: boolean;
  target?: number;
  progressKey?: keyof PlayerLifetimeStats;
  isCustom?: boolean;
}

export interface RunSummary {
  mode: GameMode;
  difficultyId: DifficultyId;
  p1CharacterId: string;
  p2CharacterId?: string;
  distanceMeters: number;
  durationSeconds: number;
  score: number;
  p1Score: number;
  p2Score: number;
  normalBones: number;
  greenBones: number;
  purpleBones: number;
  bandagesUsed: number;
  medkitsUsed: number;
  enemiesDefeated: number;
  shotsFired: number;
  bulletsClearedBySkill: number;
  damageTaken: number;
  p1DamageTaken?: number;
  p1HitCount?: number;
  p1Survived?: boolean;
  silentBlackoutsSurvived: number;
  blackoutBlindSeconds: number;
  maxCombo: number;
  jumpsPerformed: number;
  reachedFinish: boolean;
  winner?: 'P1' | 'P2' | 'DRAW' | 'TEAM';
  winReason?: string;
}

export interface PlayerLifetimeStats {
  totalRuns: number;
  totalWins: number;
  multiplayerWins: number;
  noDamageWins: number;
  totalSurvivedHits: number;
  totalDistanceMeters: number;
  totalScore: number;
  totalNormalBones: number;
  totalGreenBones: number;
  totalPurpleBones: number;
  totalBandages: number;
  totalMedkits: number;
  totalEnemiesDefeated: number;
  totalShotsFired: number;
  totalBulletsCleared: number;
  totalJumps: number;
  modesPlayed: GameMode[];
  difficultiesCleared: DifficultyId[];
  charactersUsed: string[];
  maxSingleRunDistance: number;
  maxSingleRunScore: number;
  maxComboEver: number;
}

export interface PlayerSaveData {
  unlockedAchievements: Record<string, string>; // id -> ISO timestamp
  stats: PlayerLifetimeStats;
  bestScoreByMode: Partial<Record<GameMode, number>>;
}

export interface AppPreferences {
  screen: AppScreen;
  mode: GameMode;
  difficultyId: DifficultyId;
  p1CharByMode: Record<GameMode, string>;
  p2CharByMode: Record<'MULTIPLAYER' | 'COOP', string>;
  p2IsAi: boolean;
  muted: boolean;
  autoFire: boolean;
  inGame: boolean;
}

export interface ActiveRunSnapshot {
  mode: GameMode;
  difficultyId: DifficultyId;
  p1CharacterId: string;
  p2CharacterId: string;
  scrollDist: number;
  elapsed: number;
  p1Hp: number;
  p1Score: number;
  p2Hp: number;
  p2Score: number;
  normalBones: number;
  greenBones: number;
  purpleBones: number;
  bandagesUsed: number;
  medkitsUsed: number;
  enemiesDefeated: number;
  shotsFired: number;
  bulletsClearedBySkill: number;
  damageTaken: number;
  p1DamageTaken?: number;
  p1HitCount?: number;
  silentBlackoutsSurvived: number;
  blackoutBlindSeconds: number;
  maxCombo: number;
  jumpsPerformed: number;
  currentWeather: WeatherType;
  savedAt: number;
}

export interface RankDef {
  level: number;
  id: string;
  name: string;
  tierType: 'military' | 'realm';
  requirementKind: 'bones' | 'exp';
  requiredAmount: number;
  requiredBones: number;
  accentColor: string;
  desc: string;
}

export type AppScreen = 'LOBBY' | 'ROSTER' | 'DIFFICULTIES' | 'ACHIEVEMENTS' | 'RANKS';
export type GamePlayState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

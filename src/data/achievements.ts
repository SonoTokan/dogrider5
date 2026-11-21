import { AchievementCategory, AchievementDef, PlayerSaveData, RunSummary } from '../types/game';

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory | 'all'; label: string }[] = [
  { id: 'all', label: '全部成就' },
  { id: 'mileage', label: '里程与生存' },
  { id: 'factions', label: '模式与阵营' },
  { id: 'difficulty', label: '难度征服' },
  { id: 'collection', label: '骨头与医疗' },
  { id: 'combat', label: '战斗与奇技' },
  { id: 'secret', label: '隐藏与彩蛋' },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  // 1. 里程与生存 (6)
  {
    id: 'ach_first_ride',
    name: '首次蹬车',
    category: 'mileage',
    description: '完成第 1 场自行车出车行动（无论胜负）。',
    target: 1,
    progressKey: 'totalRuns',
  },
  {
    id: 'ach_500m_sprint',
    name: '村口小试牛刀',
    category: 'mileage',
    description: '单局骑行里程达到 500 米。',
  },
  {
    id: 'ach_1500m_iron_saddle',
    name: '铁屁股骑手',
    category: 'mileage',
    description: '单局连续骑行里程达到 1,500 米。',
  },
  {
    id: 'ach_3000m_marathon',
    name: '百里不喘气',
    category: 'mileage',
    description: '单局连续骑行突破 3,000 米。',
  },
  {
    id: 'ach_total_10km',
    name: '公路丈量者',
    category: 'mileage',
    description: '累计骑行总里程达到 10,000 米。',
    target: 10000,
    progressKey: 'totalDistanceMeters',
  },
  {
    id: 'ach_no_damage_400m',
    name: '零擦伤老司机',
    category: 'mileage',
    description: '在「接触者」或更高难度中，零受伤坚持骑行超过 400 米。',
  },

  // 2. 模式与阵营 (6)
  {
    id: 'ach_solo_wolf',
    name: '独行侠的黄昏',
    category: 'factions',
    description: '使用单人专属车手完成一局至少 600 米的「单人模式」行动。',
  },
  {
    id: 'ach_mp_rival',
    name: '超车狂飙客',
    category: 'factions',
    description: '在「多人对抗」模式中完成一次赛程并取得单局超过 1,200 分。',
  },
  {
    id: 'ach_coop_bell',
    name: '并肩的铃铛',
    category: 'factions',
    description: '在「多人合作」模式中双车共同骑行超过 800 米。',
  },
  {
    id: 'ach_axis_infinite',
    name: '无限火力倾泻',
    category: 'factions',
    description: '在「轴心国入侵」模式中发射超过 150 发无限子弹。',
  },
  {
    id: 'ach_axis_sweeper',
    name: '钢铁车轮阵',
    category: 'factions',
    description: '在「轴心国入侵」模式单局击落 25 名以上其他骑手与目标。',
  },
  {
    id: 'ach_all_modes',
    name: '四海为路',
    category: 'factions',
    description: '体验过单人、多人、合作与轴心国入侵全部 4 种模式。',
  },

  // 3. 难度征服 (7)
  {
    id: 'ach_super_easy',
    name: '乡间观光客',
    category: 'difficulty',
    description: '冲过「超级低简单」难度终点线（400 米）。',
  },
  {
    id: 'ach_tutorial_grad',
    name: '驾照到手',
    category: 'difficulty',
    description: '在「教程」难度中骑行超过 500 米并熟悉所有操作。',
  },
  {
    id: 'ach_hard_survivor',
    name: '枪林弹雨起步',
    category: 'difficulty',
    description: '在「困难」或更高难度中骑行超过 800 米。',
  },
  {
    id: 'ach_shadow_rider',
    name: '暗影索路犬',
    category: 'difficulty',
    description: '在「暗影」难度中凭借车灯骑行超过 800 米。',
  },
  {
    id: 'ach_elite_hunter',
    name: '精英车轮',
    category: 'difficulty',
    description: '在「精英」难度中单局得分达到 2,500 分。',
  },
  {
    id: 'ach_realistic_grit',
    name: '真实法则',
    category: 'difficulty',
    description: '在「真实」难度下骑行超过 700 米。',
  },
  {
    id: 'ach_silent_beacon',
    name: '寂静中的一点光',
    category: 'difficulty',
    description: '在「寂静」难度下经历并挺过至少 2 次完整黑暗阶段。',
  },
  {
    id: 'ach_first_finish',
    name: '红线冲刺手',
    category: 'mileage',
    description: '首次成功冲过任意难度的公路终点拱门。',
  },

  // 4. 骨头与医疗 (7)
  {
    id: 'ach_bone_100',
    name: '骨头收藏家',
    category: 'collection',
    description: '累计拾取 100 根任意类型的骨头。',
    target: 100,
    progressKey: 'totalNormalBones',
  },
  {
    id: 'ach_green_bone_hunter',
    name: '翡翠寻骨犬',
    category: 'collection',
    description: '单局拾取至少 5 根绿骨头（比常规多两倍得分）。',
  },
  {
    id: 'ach_purple_bone_tycoon',
    name: '紫骨暴君',
    category: 'collection',
    description: '单局拾取至少 3 根紫骨头（比常规多 6.5 倍得分）。',
  },
  {
    id: 'ach_tricolor_feast',
    name: '三色骨头满贯',
    category: 'collection',
    description: '在同一局内同时收集常规骨头、绿骨头与紫骨头。',
  },
  {
    id: 'ach_field_bandage',
    name: '战地包扎手',
    category: 'collection',
    description: '在高难度下累计使用 10 个战地绷带。',
    target: 10,
    progressKey: 'totalBandages',
  },
  {
    id: 'ach_mobile_er',
    name: '移动急救站',
    category: 'collection',
    description: '单局使用至少 2 个医疗包延续骑行。',
  },
  {
    id: 'ach_score_5000',
    name: '高分车轮神话',
    category: 'collection',
    description: '单局总得分突破 5,000 分。',
  },

  // 5. 战斗与奇技 (4)
  {
    id: 'ach_bell_breaker',
    name: '音波防弹衣',
    category: 'combat',
    description: '通过车手技能累计消除或格挡 20 发敌方子弹。',
    target: 20,
    progressKey: 'totalBulletsCleared',
  },
  {
    id: 'ach_flying_dog',
    name: '低空飞行犬',
    category: 'combat',
    description: '累计完成 100 次自行车飞跃障碍。',
    target: 100,
    progressKey: 'totalJumps',
  },
  {
    id: 'ach_combo_20',
    name: '节奏不停歇',
    category: 'combat',
    description: '达成 20 次连击不间断拾取骨头或击落目标。',
  },
  {
    id: 'ach_sharpshooter_40',
    name: '公路清道夫',
    category: 'combat',
    description: '累计击败 60 名竞争对手或轴心国巡逻兵。',
    target: 60,
    progressKey: 'totalEnemiesDefeated',
  },

  // 6. 隐藏与彩蛋 (2)
  {
    id: 'ach_blind_rider_30s',
    name: '摸黑盲骑专家',
    category: 'secret',
    description: '在「寂静」黑暗阶段累计安全骑行 25 秒以上而未坠毁。',
    secret: true,
  },
  {
    id: 'ach_roster_collector',
    name: '十六骑士总动员',
    category: 'secret',
    description: '亲自驾驶过至少 8 位不同风格的狗骑士上路。',
    secret: true,
  },
  {
    id: 'ach_safe_arrival',
    name: '安全抵达',
    category: 'mileage',
    description: '第一次在任意模式中胜出（冲过终点或在多人对抗中击败对手胜出）。',
    target: 1,
    progressKey: 'totalWins',
  },
  {
    id: 'ach_hundred_victories',
    name: '百胜里',
    category: 'factions',
    description: '在多人对抗模式中累计胜出一百次（100 胜）。',
    target: 100,
    progressKey: 'multiplayerWins',
  },
  {
    id: 'ach_veteran_arrival',
    name: '老手抵达',
    category: 'mileage',
    description: '累计胜出五十五次（55 胜），并且每一次胜出都没有扣一滴血。',
    target: 55,
    progressKey: 'noDamageWins',
  },
  {
    id: 'ach_super_armor',
    name: '超级防弹衣',
    category: 'combat',
    description: '在任意模式、任意难度中单局受伤至少 45 次且不死亡。',
  },
  {
    id: 'ach_super_invincible_armor',
    name: '超级无敌防弹衣',
    category: 'combat',
    description: '在任意模式、任意难度中累计受伤 120 次且不死亡（多局比赛累计有效）。',
    target: 120,
    progressKey: 'totalSurvivedHits',
  },
];

export const DEFAULT_SAVE_DATA: PlayerSaveData = {
  unlockedAchievements: {},
  stats: {
    totalRuns: 0,
    totalWins: 0,
    multiplayerWins: 0,
    noDamageWins: 0,
    totalSurvivedHits: 0,
    totalDistanceMeters: 0,
    totalScore: 0,
    totalNormalBones: 0,
    totalGreenBones: 0,
    totalPurpleBones: 0,
    totalBandages: 0,
    totalMedkits: 0,
    totalEnemiesDefeated: 0,
    totalShotsFired: 0,
    totalBulletsCleared: 0,
    totalJumps: 0,
    modesPlayed: [],
    difficultiesCleared: [],
    charactersUsed: [],
    maxSingleRunDistance: 0,
    maxSingleRunScore: 0,
    maxComboEver: 0,
  },
  bestScoreByMode: {},
};

const STORAGE_KEY = 'big_dog_bike_5_save_v1';

export function loadSaveData(): PlayerSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE_DATA);
    const parsed = JSON.parse(raw) as Partial<PlayerSaveData>;
    return {
      unlockedAchievements: parsed.unlockedAchievements ?? {},
      stats: {
        ...DEFAULT_SAVE_DATA.stats,
        ...(parsed.stats ?? {}),
      },
      bestScoreByMode: parsed.bestScoreByMode ?? {},
    };
  } catch {
    return structuredClone(DEFAULT_SAVE_DATA);
  }
}

export function persistSaveData(data: PlayerSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function evaluateRunAchievements(
  prev: PlayerSaveData,
  run: RunSummary,
  customAchievements: AchievementDef[] = []
): { next: PlayerSaveData; newlyUnlocked: AchievementDef[] } {
  const isMpWin = run.mode === 'MULTIPLAYER' && run.winner === 'P1';
  const isRunWin = run.mode === 'MULTIPLAYER' ? run.winner === 'P1' : run.reachedFinish;
  const isNoDamage = (run.p1DamageTaken ?? run.damageTaken) === 0;
  const p1Hits = run.p1HitCount ?? 0;
  const survivedRun = run.p1Survived ?? run.reachedFinish;

  const next: PlayerSaveData = {
    unlockedAchievements: { ...prev.unlockedAchievements },
    stats: {
      ...prev.stats,
      totalRuns: prev.stats.totalRuns + 1,
      totalWins: prev.stats.totalWins + (isRunWin ? 1 : 0),
      multiplayerWins: prev.stats.multiplayerWins + (isMpWin ? 1 : 0),
      noDamageWins: prev.stats.noDamageWins + (isRunWin && isNoDamage ? 1 : 0),
      totalSurvivedHits: prev.stats.totalSurvivedHits + (survivedRun ? p1Hits : 0),
      totalDistanceMeters: prev.stats.totalDistanceMeters + Math.round(run.distanceMeters),
      totalScore: prev.stats.totalScore + Math.round(run.score),
      totalNormalBones: prev.stats.totalNormalBones + run.normalBones,
      totalGreenBones: prev.stats.totalGreenBones + run.greenBones,
      totalPurpleBones: prev.stats.totalPurpleBones + run.purpleBones,
      totalBandages: prev.stats.totalBandages + run.bandagesUsed,
      totalMedkits: prev.stats.totalMedkits + run.medkitsUsed,
      totalEnemiesDefeated: prev.stats.totalEnemiesDefeated + run.enemiesDefeated,
      totalShotsFired: prev.stats.totalShotsFired + run.shotsFired,
      totalBulletsCleared: prev.stats.totalBulletsCleared + run.bulletsClearedBySkill,
      totalJumps: prev.stats.totalJumps + run.jumpsPerformed,
      modesPlayed: Array.from(new Set([...prev.stats.modesPlayed, run.mode])),
      difficultiesCleared:
        run.reachedFinish
          ? Array.from(new Set([...prev.stats.difficultiesCleared, run.difficultyId]))
          : prev.stats.difficultiesCleared,
      charactersUsed: Array.from(
        new Set([
          ...prev.stats.charactersUsed,
          run.p1CharacterId,
          ...(run.p2CharacterId ? [run.p2CharacterId] : []),
        ])
      ),
      maxSingleRunDistance: Math.max(prev.stats.maxSingleRunDistance, Math.round(run.distanceMeters)),
      maxSingleRunScore: Math.max(prev.stats.maxSingleRunScore, Math.round(run.score)),
      maxComboEver: Math.max(prev.stats.maxComboEver, run.maxCombo),
    },
    bestScoreByMode: {
      ...prev.bestScoreByMode,
      [run.mode]: Math.max(prev.bestScoreByMode[run.mode] ?? 0, Math.round(run.score)),
    },
  };

  const nowIso = new Date().toISOString();
  const newlyUnlocked: AchievementDef[] = [];
  const allDefs = [...ACHIEVEMENTS, ...customAchievements];

  const grant = (id: string) => {
    if (!next.unlockedAchievements[id]) {
      next.unlockedAchievements[id] = nowIso;
      const def = allDefs.find((a) => a.id === id);
      if (def) newlyUnlocked.push(def);
    }
  };

  const tierOrder = [
    'super_easy',
    'tutorial',
    'novice',
    'contender',
    'hard',
    'veteran',
    'shadow',
    'elite',
    'realistic',
    'silent',
  ];
  const tierIdx = tierOrder.indexOf(run.difficultyId);

  if (next.stats.totalRuns >= 1) grant('ach_first_ride');
  if (run.distanceMeters >= 500) grant('ach_500m_sprint');
  if (run.distanceMeters >= 1500) grant('ach_1500m_iron_saddle');
  if (run.distanceMeters >= 3000) grant('ach_3000m_marathon');
  if (next.stats.totalDistanceMeters >= 10000) grant('ach_total_10km');
  if (tierIdx >= 3 && run.damageTaken === 0 && run.distanceMeters >= 400) grant('ach_no_damage_400m');

  if (run.mode === 'SOLO' && run.distanceMeters >= 600) grant('ach_solo_wolf');
  if (run.mode === 'MULTIPLAYER' && run.score >= 1200) grant('ach_mp_rival');
  if (run.mode === 'COOP' && run.distanceMeters >= 800) grant('ach_coop_bell');
  if (run.mode === 'AXIS_INVASION' && run.shotsFired >= 150) grant('ach_axis_infinite');
  if (run.mode === 'AXIS_INVASION' && run.enemiesDefeated >= 25) grant('ach_axis_sweeper');
  if (next.stats.modesPlayed.length >= 4) grant('ach_all_modes');

  if (run.difficultyId === 'super_easy' && (run.reachedFinish || run.distanceMeters >= 400)) {
    grant('ach_super_easy');
  }
  if (run.difficultyId === 'tutorial' && (run.reachedFinish || run.distanceMeters >= 500)) {
    grant('ach_tutorial_grad');
  }
  if (tierIdx >= 4 && run.distanceMeters >= 800) grant('ach_hard_survivor');
  if (run.difficultyId === 'shadow' && run.distanceMeters >= 800) grant('ach_shadow_rider');
  if (run.difficultyId === 'elite' && run.score >= 2500) grant('ach_elite_hunter');
  if (run.difficultyId === 'realistic' && run.distanceMeters >= 700) grant('ach_realistic_grit');
  if (run.difficultyId === 'silent' && run.silentBlackoutsSurvived >= 2) grant('ach_silent_beacon');
  if (run.reachedFinish) grant('ach_first_finish');

  if (
    next.stats.totalNormalBones + next.stats.totalGreenBones + next.stats.totalPurpleBones >= 100
  ) {
    grant('ach_bone_100');
  }
  if (run.greenBones >= 5) grant('ach_green_bone_hunter');
  if (run.purpleBones >= 3) grant('ach_purple_bone_tycoon');
  if (run.normalBones > 0 && run.greenBones > 0 && run.purpleBones > 0) grant('ach_tricolor_feast');
  if (next.stats.totalBandages >= 10) grant('ach_field_bandage');
  if (run.medkitsUsed >= 2) grant('ach_mobile_er');
  if (run.score >= 5000) grant('ach_score_5000');

  if (next.stats.totalBulletsCleared >= 20) grant('ach_bell_breaker');
  if (next.stats.totalJumps >= 100) grant('ach_flying_dog');
  if (run.maxCombo >= 20) grant('ach_combo_20');
  if (next.stats.totalEnemiesDefeated >= 60) grant('ach_sharpshooter_40');

  if (run.difficultyId === 'silent' && run.blackoutBlindSeconds >= 25) grant('ach_blind_rider_30s');
  if (next.stats.charactersUsed.length >= 8) grant('ach_roster_collector');
  if (next.stats.totalWins >= 1) grant('ach_safe_arrival');
  if (next.stats.multiplayerWins >= 100) grant('ach_hundred_victories');
  if (next.stats.noDamageWins >= 55) grant('ach_veteran_arrival');
  if (survivedRun && p1Hits >= 45) grant('ach_super_armor');
  if (next.stats.totalSurvivedHits >= 120) grant('ach_super_invincible_armor');

  // Evaluate custom user-added achievements
  for (const ca of customAchievements) {
    if (ca.target && ca.progressKey) {
      const val = next.stats[ca.progressKey];
      if (typeof val === 'number' && val >= ca.target) {
        grant(ca.id);
      }
    }
  }

  return { next, newlyUnlocked };
}

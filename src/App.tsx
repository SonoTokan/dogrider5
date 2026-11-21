import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Play, ShieldAlert, Users, User, Crosshair, Check } from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { AchievementHall } from './components/AchievementHall';
import { BikePreviewCanvas } from './components/BikePreviewCanvas';
import { CharacterGallery } from './components/CharacterGallery';
import { DifficultyArchive } from './components/DifficultyArchive';
import { GameCanvas } from './components/GameCanvas';
import { RankLadder } from './components/RankLadder';
import {
  ACHIEVEMENTS,
  evaluateRunAchievements,
  loadSaveData,
  persistSaveData,
} from './data/achievements';
import { CHARACTER_CATEGORY_META, CHARACTERS } from './data/characters';
import { BONE_VALUES, DIFFICULTIES } from './data/difficulties';
import { getRankProgress, getTotalBones } from './data/ranks';
import {
  clearActiveRunSnapshot,
  loadActiveRunSnapshot,
  loadCustomAchievements,
  loadCustomCharacters,
  loadCustomDifficulties,
  loadPreferences,
  persistActiveRunSnapshot,
  persistCustomAchievements,
  persistCustomCharacters,
  persistCustomDifficulties,
  persistPreferences,
} from './data/persistentStore';
import {
  AchievementDef,
  ActiveRunSnapshot,
  AppPreferences,
  AppScreen,
  CharacterCategory,
  CharacterDef,
  DifficultyConfig,
  DifficultyId,
  GameMode,
  PlayerSaveData,
  RankDef,
  RunSummary,
} from './types/game';

const HERO_IMAGE_PATH = '/src/assets/images/hero_big_dog_bicycle_1794707968401.jpg';

const MODE_CARDS: {
  id: GameMode;
  title: string;
  subtitle: string;
  category: CharacterCategory;
  icon: typeof User;
}[] = [
  {
    id: 'SOLO',
    title: '单人模式',
    subtitle: '独行乡道 · 考验走位与专属技能',
    category: 'SOLO',
    icon: User,
  },
  {
    id: 'MULTIPLAYER',
    title: '多人对抗',
    subtitle: '双车抢骨互轰 · 技能命中真人/AI扣血击倒',
    category: 'MULTIPLAYER',
    icon: Users,
  },
  {
    id: 'COOP',
    title: '多人合作',
    subtitle: '并肩护航 · 共享治疗、钢盾与旗手鼓舞',
    category: 'COOP',
    icon: ShieldAlert,
  },
  {
    id: 'AXIS_INVASION',
    title: '轴心国入侵',
    subtitle: '无限子弹 ∞ 倾泻 · 扫清沿途其他骑手',
    category: 'AXIS_INVASION',
    icon: Crosshair,
  },
];

export default function App() {
  const [prefs, setPrefs] = useState<AppPreferences>(() => loadPreferences());
  const [customCharacters, setCustomCharacters] = useState<CharacterDef[]>(() =>
    loadCustomCharacters()
  );
  const [customDifficulties, setCustomDifficulties] = useState<DifficultyConfig[]>(() =>
    loadCustomDifficulties()
  );
  const [customAchievements, setCustomAchievements] = useState<AchievementDef[]>(() =>
    loadCustomAchievements()
  );
  const [activeSnapshot, setActiveSnapshot] = useState<ActiveRunSnapshot | null>(() =>
    loadActiveRunSnapshot()
  );

  const [heroImgFailed, setHeroImgFailed] = useState<boolean>(false);
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => loadSaveData());
  const [recentUnlocks, setRecentUnlocks] = useState<AchievementDef[]>([]);
  const [promotedRank, setPromotedRank] = useState<RankDef | null>(null);
  const [unlockToastFading, setUnlockToastFading] = useState<boolean>(false);

  // Sync mute state on startup
  useEffect(() => {
    soundEngine.muted = prefs.muted;
  }, [prefs.muted]);

  // Auto-dismiss achievement & rank promotion popup after ~4.5 seconds (data is already persisted)
  useEffect(() => {
    if (recentUnlocks.length === 0 && !promotedRank) {
      setUnlockToastFading(false);
      return;
    }
    setUnlockToastFading(false);
    const fadeTimer = window.setTimeout(() => {
      setUnlockToastFading(true);
    }, 4200);
    const clearTimer = window.setTimeout(() => {
      setRecentUnlocks([]);
      setPromotedRank(null);
      setUnlockToastFading(false);
    }, 4500);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [recentUnlocks, promotedRank]);

  // Persist all preferences and custom additions automatically
  useEffect(() => {
    persistPreferences(prefs);
  }, [prefs]);

  useEffect(() => {
    persistCustomCharacters(customCharacters);
  }, [customCharacters]);

  useEffect(() => {
    persistCustomDifficulties(customDifficulties);
  }, [customDifficulties]);

  useEffect(() => {
    persistCustomAchievements(customAchievements);
  }, [customAchievements]);

  const allCharacters = useMemo(
    () => [...CHARACTERS, ...customCharacters],
    [customCharacters]
  );
  const allDifficulties = useMemo(
    () => [...DIFFICULTIES, ...customDifficulties],
    [customDifficulties]
  );
  const allAchievements = useMemo(
    () => [...ACHIEVEMENTS, ...customAchievements],
    [customAchievements]
  );

  const charMap = useMemo(
    () => Object.fromEntries(allCharacters.map((c) => [c.id, c])),
    [allCharacters]
  );
  const diffMap = useMemo(
    () => Object.fromEntries(allDifficulties.map((d) => [d.id, d])),
    [allDifficulties]
  );

  const { screen, inGame, mode, difficultyId, p1CharByMode, p2CharByMode, p2IsAi, autoFire } =
    prefs;

  const activeCategory: CharacterCategory = mode;

  const modeChars = useMemo(
    () => allCharacters.filter((c) => c.category === activeCategory),
    [allCharacters, activeCategory]
  );

  const p1CharId = p1CharByMode[mode];
  const p2CharId =
    mode === 'MULTIPLAYER' || mode === 'COOP' ? p2CharByMode[mode] : p1CharByMode[mode];

  const p1Char = charMap[p1CharId] ?? modeChars[0] ?? allCharacters[0];
  const p2Char = charMap[p2CharId] ?? modeChars[1] ?? modeChars[0] ?? allCharacters[0];
  const difficulty = diffMap[difficultyId] ?? allDifficulties[2] ?? allDifficulties[0];

  const setScreen = (nextScreen: AppScreen) => {
    setPrefs((prev) => ({ ...prev, screen: nextScreen }));
  };

  const setMode = (nextMode: GameMode) => {
    setPrefs((prev) => ({ ...prev, mode: nextMode }));
  };

  const setDifficultyId = (nextDiffId: DifficultyId) => {
    setPrefs((prev) => ({ ...prev, difficultyId: nextDiffId }));
  };

  const handleSaveSnapshot = useCallback((snap: ActiveRunSnapshot) => {
    persistActiveRunSnapshot(snap);
    setActiveSnapshot(snap);
  }, []);

  const handleClearSnapshot = useCallback(() => {
    clearActiveRunSnapshot();
    setActiveSnapshot(null);
  }, []);

  const handleSelectCharFromGallery = (char: CharacterDef) => {
    const targetMode: GameMode = char.category;
    setPrefs((prev) => ({
      ...prev,
      mode: targetMode,
      p1CharByMode: { ...prev.p1CharByMode, [targetMode]: char.id },
      screen: 'LOBBY',
    }));
  };

  const handleAddCharacter = (char: CharacterDef) => {
    setCustomCharacters((prev) => [...prev, char]);
    setPrefs((prev) => ({
      ...prev,
      mode: char.category,
      p1CharByMode: { ...prev.p1CharByMode, [char.category]: char.id },
    }));
  };

  const handleDeleteCharacter = (id: string) => {
    setCustomCharacters((prev) => prev.filter((c) => c.id !== id));
    setPrefs((prev) => {
      const nextP1 = { ...prev.p1CharByMode };
      (Object.keys(nextP1) as GameMode[]).forEach((m) => {
        if (nextP1[m] === id) {
          const fallback = CHARACTERS.find((c) => c.category === m) ?? CHARACTERS[0];
          nextP1[m] = fallback.id;
        }
      });
      const nextP2 = { ...prev.p2CharByMode };
      (['MULTIPLAYER', 'COOP'] as const).forEach((m) => {
        if (nextP2[m] === id) {
          const fallback =
            CHARACTERS.filter((c) => c.category === m)[1] ??
            CHARACTERS.find((c) => c.category === m) ??
            CHARACTERS[0];
          nextP2[m] = fallback.id;
        }
      });
      return { ...prev, p1CharByMode: nextP1, p2CharByMode: nextP2 };
    });
  };

  const handleAddDifficulty = (diff: DifficultyConfig) => {
    setCustomDifficulties((prev) => [...prev, diff]);
    setDifficultyId(diff.id);
  };

  const handleDeleteDifficulty = (id: string) => {
    setCustomDifficulties((prev) => prev.filter((d) => d.id !== id));
    if (difficultyId === id) {
      setDifficultyId('novice');
    }
  };

  const handleAddAchievement = (ach: AchievementDef) => {
    setCustomAchievements((prev) => [...prev, ach]);
  };

  const handleToggleCustomAchievement = (id: string) => {
    const isCurrentlyUnlocked = Boolean(saveData.unlockedAchievements[id]);
    const nextUnlocked = { ...saveData.unlockedAchievements };
    if (isCurrentlyUnlocked) {
      delete nextUnlocked[id];
    } else {
      nextUnlocked[id] = new Date().toISOString();
      soundEngine.playAchievement();
      const unlockedDef = allAchievements.find((a) => a.id === id);
      if (unlockedDef) {
        setRecentUnlocks([unlockedDef]);
      }
    }
    const next: PlayerSaveData = { ...saveData, unlockedAchievements: nextUnlocked };
    setSaveData(next);
    persistSaveData(next);
  };

  const handleDeleteAchievement = (id: string) => {
    setCustomAchievements((prev) => prev.filter((a) => a.id !== id));
    setSaveData((prev) => {
      if (!prev.unlockedAchievements[id]) return prev;
      const nextUnlocked = { ...prev.unlockedAchievements };
      delete nextUnlocked[id];
      const next = { ...prev, unlockedAchievements: nextUnlocked };
      persistSaveData(next);
      return next;
    });
  };

  const handleRunComplete = (summary: RunSummary) => {
    const prevRank = getRankProgress(
      getTotalBones(saveData.stats),
      saveData.stats.totalScore
    ).current;
    const { next, newlyUnlocked } = evaluateRunAchievements(
      saveData,
      summary,
      customAchievements
    );
    const nextRank = getRankProgress(
      getTotalBones(next.stats),
      next.stats.totalScore
    ).current;
    setSaveData(next);
    persistSaveData(next);
    if (nextRank.level > prevRank.level) {
      setPromotedRank(nextRank);
    }
    if (newlyUnlocked.length > 0) {
      soundEngine.playAchievement();
      setRecentUnlocks(newlyUnlocked);
    } else if (nextRank.level > prevRank.level) {
      soundEngine.playAchievement();
    }
  };

  const startPlay = () => {
    handleClearSnapshot();
    setRecentUnlocks([]);
    setPromotedRank(null);
    setPrefs((prev) => ({ ...prev, inGame: true }));
  };

  const totalBones = getTotalBones(saveData.stats);
  const totalExp = saveData.stats.totalScore ?? 0;
  const rankInfo = getRankProgress(totalBones, totalExp);

  const achievementToast = (recentUnlocks.length > 0 || promotedRank !== null) && (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] sm:w-auto bg-[#1D242E] border border-[#E29D3E] rounded-2xl p-4 shadow-2xl space-y-2 transition-[opacity,transform] duration-300 ${
        unlockToastFading ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#E29D3E]">
          <Award className="w-4 h-4 shrink-0" />
          <span>
            {promotedRank && recentUnlocks.length > 0
              ? `军衔晋升并解锁 ${recentUnlocks.length} 项成就`
              : promotedRank
              ? `军衔晋升至 Lv.${promotedRank.level} ${promotedRank.name}`
              : `解锁 ${recentUnlocks.length} 项新成就`}
          </span>
        </div>
        <button
          onClick={() => {
            setRecentUnlocks([]);
            setPromotedRank(null);
          }}
          className="text-xs text-[#A9B2BE] hover:text-[#F2EFE9] whitespace-nowrap shrink-0"
        >
          收起
        </button>
      </div>
      {promotedRank && (
        <div className="text-xs text-[#4BE39E]">
          晋升为 <span className="font-bold">《{promotedRank.name}》</span>（{totalBones.toLocaleString()} 根骨头 ·{' '}
          {totalExp.toLocaleString()} 经验 · 升级不消耗）
        </div>
      )}
      {recentUnlocks.length > 0 && (
        <ul className="space-y-1.5 text-xs">
          {recentUnlocks.map((a) => (
            <li key={a.id} className="text-[#F2EFE9]">
              <span className="font-semibold">《{a.name}》</span>
              <span className="text-[#A9B2BE]"> — {a.description}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="text-[11px] text-[#8C96A4] pt-1 border-t border-white/10">
        进度已永久保存 · 即将自动关闭
      </div>
    </div>
  );

  if (inGame) {
    return (
      <div className="relative">
        <GameCanvas
          mode={mode}
          difficultyId={difficulty.id}
          p1CharacterId={p1Char.id}
          p2CharacterId={p2Char.id}
          allCharacters={allCharacters}
          allDifficulties={allDifficulties}
          p2IsAi={p2IsAi}
          autoFire={autoFire}
          onToggleP2Ai={() => setPrefs((prev) => ({ ...prev, p2IsAi: !prev.p2IsAi }))}
          onToggleAutoFire={() => setPrefs((prev) => ({ ...prev, autoFire: !prev.autoFire }))}
          onMuteChange={(mutedVal) => setPrefs((prev) => ({ ...prev, muted: mutedVal }))}
          initialSnapshot={activeSnapshot}
          savedTotalBones={totalBones}
          savedTotalExp={totalExp}
          onSaveSnapshot={handleSaveSnapshot}
          onClearSnapshot={handleClearSnapshot}
          onRunComplete={handleRunComplete}
          onExitToLobby={() => setPrefs((prev) => ({ ...prev, inGame: false }))}
        />
        {achievementToast}
      </div>
    );
  }

  const unlockedCount = allAchievements.filter((a) =>
    Boolean(saveData.unlockedAchievements[a.id])
  ).length;

  return (
    <div className="min-h-screen bg-[#12161B] text-[#F2EFE9] flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-white/10 bg-[#171C23]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => setScreen('LOBBY')}
            className="text-xl font-extrabold font-display tracking-tight text-[#F2EFE9] whitespace-nowrap shrink-0"
          >
            大狗骑自行车5
          </button>

          {/* Zone 2: 5 Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <button
              onClick={() => setScreen('LOBBY')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                screen === 'LOBBY'
                  ? 'text-[#E29D3E] border-b border-[#E29D3E]'
                  : 'text-[#A9B2BE] hover:text-[#F2EFE9]'
              }`}
            >
              出车大厅
            </button>
            <button
              onClick={() => setScreen('ROSTER')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                screen === 'ROSTER'
                  ? 'text-[#E29D3E] border-b border-[#E29D3E]'
                  : 'text-[#A9B2BE] hover:text-[#F2EFE9]'
              }`}
            >
              车手图鉴
            </button>
            <button
              onClick={() => setScreen('DIFFICULTIES')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                screen === 'DIFFICULTIES'
                  ? 'text-[#E29D3E] border-b border-[#E29D3E]'
                  : 'text-[#A9B2BE] hover:text-[#F2EFE9]'
              }`}
            >
              难度档案
            </button>
            <button
              onClick={() => setScreen('RANKS')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                screen === 'RANKS'
                  ? 'text-[#E29D3E] border-b border-[#E29D3E]'
                  : 'text-[#A9B2BE] hover:text-[#F2EFE9]'
              }`}
            >
              军衔等级
            </button>
            <button
              onClick={() => setScreen('ACHIEVEMENTS')}
              className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
                screen === 'ACHIEVEMENTS'
                  ? 'text-[#E29D3E] border-b border-[#E29D3E]'
                  : 'text-[#A9B2BE] hover:text-[#F2EFE9]'
              }`}
            >
              成就殿堂
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              onClick={startPlay}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E29D3E] hover:bg-[#EBAD56] text-sm font-semibold text-[#12161B] transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              立即发车
            </button>
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <div className="flex md:hidden border-t border-white/10 px-4 py-2 justify-around text-xs">
          {(
            [
              ['LOBBY', '出车大厅'],
              ['ROSTER', '车手图鉴'],
              ['DIFFICULTIES', '难度档案'],
              ['RANKS', '军衔等级'],
              ['ACHIEVEMENTS', '成就殿堂'],
            ] as [AppScreen, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setScreen(id)}
              className={`px-2 py-1 font-medium whitespace-nowrap ${
                screen === id ? 'text-[#E29D3E]' : 'text-[#A9B2BE]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-8 space-y-10">
        {screen === 'LOBBY' && (
          <>
            {/* Hero Split: Focal Anchor */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-6 bg-[#1A2028] border border-white/10 rounded-2xl p-7 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="text-xs text-[#A9B2BE] flex flex-wrap items-center gap-2">
                    <span>四大作战模式</span>
                    <span aria-hidden="true">·</span>
                    <span>{allCharacters.length} 位专属狗骑士</span>
                    <span aria-hidden="true">·</span>
                    <span>{allDifficulties.length} 级阶梯难度</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#F2EFE9] leading-tight [text-wrap:balance]">
                    跨上铁车蹬风前行，在枪林与暗夜中抢夺珍稀骨头
                  </h1>

                  <p className="text-sm text-[#A9B2BE] leading-relaxed max-w-xl">
                    单人独行、双车竞速、默契合作，或亲自驾驶轴心国无限子弹突击车清扫公路。高难度沿途投放战地绷带与医疗包，绿骨头得分比常规多两倍，紫骨头多 6.5 倍；所有配置、进度与新增内容均自动永久保存。
                  </p>
                </div>

                {/* Quick 4-Mode Selector */}
                <div className="grid grid-cols-2 gap-2.5">
                  {MODE_CARDS.map((m) => {
                    const Icon = m.icon;
                    const active = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`text-left p-3 rounded-xl border transition-colors ${
                          active
                            ? 'bg-[#252D38] border-[#E29D3E]'
                            : 'bg-[#14181E] border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#F2EFE9] flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${active ? 'text-[#E29D3E]' : 'text-[#8C96A4]'}`} />
                            {m.title}
                          </span>
                          {active && <Check className="w-3.5 h-3.5 text-[#E29D3E]" />}
                        </div>
                        <p className="text-[11px] text-[#8C96A4] mt-1 line-clamp-1">{m.subtitle}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
                  <div className="text-xs text-[#A9B2BE] font-mono-num flex flex-wrap items-center gap-x-2 gap-y-1">
                    <button
                      onClick={() => setScreen('RANKS')}
                      className="hover:underline font-semibold"
                      style={{ color: rankInfo.current.accentColor }}
                    >
                      Lv.{rankInfo.current.level} {rankInfo.current.name}
                    </button>
                    <span aria-hidden="true">·</span>
                    <span>骨头 {totalBones.toLocaleString()}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      成就 {unlockedCount}/{allAchievements.length}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>最高分 {(saveData.bestScoreByMode[mode] ?? 0).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={startPlay}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E29D3E] hover:bg-[#EBAD56] text-sm font-bold text-[#12161B] transition-colors whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    立即发车出战
                  </button>
                </div>
              </div>

              {/* Hero Key Art Card */}
              <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/10 bg-[#171C23] min-h-[300px] flex flex-col justify-end">
                {!heroImgFailed ? (
                  <img
                    src={HERO_IMAGE_PATH}
                    alt="大狗骑自行车穿过暮色乡道，路边散落发光的绿骨头与紫骨头"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#232D38] via-[#1B222A] to-[#12161B] flex items-center justify-center p-6">
                    <BikePreviewCanvas character={p1Char} width={440} height={240} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                <div className="relative p-6 space-y-1.5">
                  <div className="text-xs text-[#E29D3E] font-medium">
                    {CHARACTER_CATEGORY_META[activeCategory].label} · {difficulty.tier}. {difficulty.name}
                  </div>
                  <div className="text-lg font-bold font-display text-[#F2EFE9]">
                    当前主骑：{p1Char.name}
                    {(mode === 'MULTIPLAYER' || mode === 'COOP') && ` & ${p2Char.name}`}
                  </div>
                  <p className="text-xs text-[#CBD5E1]">
                    常规骨头 {BONE_VALUES.normal} 分 · 绿骨头 {BONE_VALUES.green} 分 (+2倍) · 紫骨头{' '}
                    {BONE_VALUES.purple} 分 (+6.5倍)
                  </p>
                </div>
              </div>
            </section>

            {/* Exclusive Character Selection for Current Mode + Live Animated Bike Preview */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold font-display text-[#F2EFE9]">
                    {CHARACTER_CATEGORY_META[activeCategory].label}出战阵容
                  </h2>
                  <p className="text-xs text-[#A9B2BE] mt-0.5">
                    {CHARACTER_CATEGORY_META[activeCategory].subtitle}
                  </p>
                </div>

                {(mode === 'MULTIPLAYER' || mode === 'COOP') && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPrefs((prev) => ({ ...prev, p2IsAi: !prev.p2IsAi }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                        p2IsAi
                          ? 'bg-[#222933] border-[#67B8E3]/50 text-[#93C5FD]'
                          : 'bg-[#1A2028] border-white/10 text-[#CBD5E1]'
                      }`}
                    >
                      {p2IsAi ? 'P2：AI 托管中（单人键盘可玩）' : 'P2：本地双人同屏键盘操作'}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {modeChars.map((char) => {
                  const isP1 = p1Char.id === char.id;
                  const isP2 = (mode === 'MULTIPLAYER' || mode === 'COOP') && p2Char.id === char.id;

                  return (
                    <div
                      key={char.id}
                      className={`rounded-2xl bg-[#1A2028] border p-4 flex flex-col justify-between gap-3 transition-colors ${
                        isP1 || isP2 ? 'border-[#E29D3E]' : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <BikePreviewCanvas character={char} width={250} height={116} />
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs text-[#8C96A4]">
                            <span>
                              {char.isCustom ? '自定义 · ' : ''}
                              {char.breed}
                            </span>
                            {char.infiniteAmmo && (
                              <span className="font-mono-num text-[#E29D3E] font-semibold">无限子弹 ∞</span>
                            )}
                          </div>
                          <h3 className="text-base font-bold font-display text-[#F2EFE9] mt-0.5">
                            {char.name}
                          </h3>
                          <p className="text-xs text-[#A9B2BE] mt-1 leading-relaxed">
                            <span className="text-[#67B8E3] font-medium">{char.skillName}：</span>
                            {char.skillDesc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <button
                          onClick={() =>
                            setPrefs((prev) => ({
                              ...prev,
                              p1CharByMode: { ...prev.p1CharByMode, [mode]: char.id },
                            }))
                          }
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                            isP1
                              ? 'bg-[#E29D3E] text-[#12161B]'
                              : 'bg-[#242C37] hover:bg-[#303B4A] text-[#F2EFE9]'
                          }`}
                        >
                          {isP1 ? 'P1 已选' : '选为 P1'}
                        </button>
                        {(mode === 'MULTIPLAYER' || mode === 'COOP') && (
                          <button
                            onClick={() =>
                              setPrefs((prev) => ({
                                ...prev,
                                p2CharByMode: { ...prev.p2CharByMode, [mode]: char.id },
                              }))
                            }
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                              isP2
                                ? 'bg-[#67B8E3] text-[#12161B]'
                                : 'bg-[#242C37] hover:bg-[#303B4A] text-[#F2EFE9]'
                            }`}
                          >
                            {isP2 ? 'P2 已选' : '选为 P2'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Difficulty Selector (includes built-in 10 tiers + any user-added custom difficulties) */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold font-display text-[#F2EFE9]">
                    公路难度阶梯（{allDifficulties.length} 级）
                  </h2>
                  <p className="text-xs text-[#A9B2BE] mt-0.5">
                    从最低「超级低简单」（400 米）到最远「寂静」（3,000 米），难度越高终点越远，可在档案页自由添加新难度。
                  </p>
                </div>
                <button
                  onClick={() => setScreen('DIFFICULTIES')}
                  className="text-xs font-medium text-[#E29D3E] hover:underline whitespace-nowrap"
                >
                  管理或添加自定义难度
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {allDifficulties.map((d) => {
                  const active = d.id === difficulty.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDifficultyId(d.id)}
                      className={`text-left rounded-xl border p-3.5 transition-colors flex flex-col justify-between gap-2 ${
                        active
                          ? 'bg-[#232A35] border-[#E29D3E]'
                          : 'bg-[#1A2028] border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-mono-num font-bold" style={{ color: d.accentColor }}>
                          Lv.{d.tier}
                        </span>
                        <span className="text-[11px] font-mono-num text-[#8C96A4]">
                          终点 {d.targetDistanceMeters}m · ×{d.scoreMultiplier}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold font-display text-[#F2EFE9]">
                          {d.name}
                          {d.isCustom && (
                            <span className="ml-1.5 text-[11px] font-normal text-[#4BE39E]">自定</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8C96A4] mt-0.5 line-clamp-2">{d.shortDesc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Difficulty Detail Bar */}
              <div className="rounded-2xl bg-[#1A2028] border border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[#F2EFE9]">
                    当前已选：{difficulty.tier}. {difficulty.name} · 终点距离 {difficulty.targetDistanceMeters} m
                  </div>
                  <p className="text-xs text-[#A9B2BE]">{difficulty.detailDesc}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono-num shrink-0">
                  <span className="text-[#4BE39E]">绿骨头 {Math.round(difficulty.greenBoneChance * 100)}%</span>
                  <span className="text-[#C084FC]">紫骨头 {Math.round(difficulty.purpleBoneChance * 100)}%</span>
                  <span className="text-[#FCA5A5]">绷带 {Math.round(difficulty.bandageChance * 100)}%</span>
                  <span className="text-[#6EE7B7]">医疗包 {Math.round(difficulty.medkitChance * 100)}%</span>
                </div>
              </div>
            </section>
          </>
        )}

        {screen === 'ROSTER' && (
          <CharacterGallery
            characters={allCharacters}
            selectedP1Id={p1Char.id}
            onSelectForP1={handleSelectCharFromGallery}
            onAddCharacter={handleAddCharacter}
            onDeleteCharacter={handleDeleteCharacter}
          />
        )}

        {screen === 'DIFFICULTIES' && (
          <DifficultyArchive
            difficulties={allDifficulties}
            selectedDifficultyId={difficulty.id}
            clearedDifficulties={saveData.stats.difficultiesCleared}
            onSelectDifficulty={setDifficultyId}
            onStartWithDifficulty={(id) => {
              handleClearSnapshot();
              setRecentUnlocks([]);
              setPrefs((prev) => ({ ...prev, difficultyId: id, inGame: true }));
            }}
            onAddDifficulty={handleAddDifficulty}
            onDeleteDifficulty={handleDeleteDifficulty}
          />
        )}

        {screen === 'RANKS' && <RankLadder saveData={saveData} />}

        {screen === 'ACHIEVEMENTS' && (
          <AchievementHall
            achievements={allAchievements}
            saveData={saveData}
            totalCharacterCount={allCharacters.length}
            onAddAchievement={handleAddAchievement}
            onToggleAchievement={handleToggleCustomAchievement}
            onDeleteAchievement={handleDeleteAchievement}
          />
        )}
      </main>

      <footer className="border-t border-white/10 py-5 px-6 text-xs text-[#8C96A4]">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>大狗骑自行车5 · 进度、设置与自定义内容已自动本地持久化</span>
          <span>键盘操作：W/A/S/D 移动 · 空格跳跃 · F 释放专属技能 · J/鼠标开火</span>
        </div>
      </footer>
      {achievementToast}
    </div>
  );
}

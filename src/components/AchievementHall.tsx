import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, Plus, Trash2, X } from 'lucide-react';
import { ACHIEVEMENT_CATEGORIES } from '../data/achievements';
import {
  AchievementCategory,
  AchievementDef,
  PlayerLifetimeStats,
  PlayerSaveData,
} from '../types/game';

interface AchievementHallProps {
  achievements: AchievementDef[];
  saveData: PlayerSaveData;
  totalCharacterCount: number;
  onAddAchievement: (ach: AchievementDef) => void;
  onToggleAchievement: (id: string) => void;
  onDeleteAchievement: (id: string) => void;
}

const PROGRESS_KEY_OPTIONS: { key: keyof PlayerLifetimeStats | 'manual'; label: string; defaultTarget: number }[] = [
  { key: 'totalWins', label: '累计胜出次数', defaultTarget: 10 },
  { key: 'multiplayerWins', label: '多人对抗胜出次数', defaultTarget: 20 },
  { key: 'noDamageWins', label: '无伤（零掉血）胜出次数', defaultTarget: 10 },
  { key: 'totalSurvivedHits', label: '不死累计受伤次数', defaultTarget: 120 },
  { key: 'totalDistanceMeters', label: '累计骑行里程 (米)', defaultTarget: 5000 },
  { key: 'totalScore', label: '累计总积分', defaultTarget: 10000 },
  { key: 'totalRuns', label: '累计出车局数', defaultTarget: 5 },
  { key: 'totalGreenBones', label: '累计绿骨头数量', defaultTarget: 20 },
  { key: 'totalPurpleBones', label: '累计紫骨头数量', defaultTarget: 10 },
  { key: 'totalBandages', label: '累计使用绷带', defaultTarget: 15 },
  { key: 'totalMedkits', label: '累计使用医疗包', defaultTarget: 8 },
  { key: 'totalEnemiesDefeated', label: '累计击倒对手', defaultTarget: 50 },
  { key: 'totalJumps', label: '累计跳跃次数', defaultTarget: 80 },
  { key: 'manual', label: '自定义个人挑战 (可手动打卡完成)', defaultTarget: 1 },
];

export const AchievementHall: React.FC<AchievementHallProps> = ({
  achievements,
  saveData,
  totalCharacterCount,
  onAddAchievement,
  onToggleAchievement,
  onDeleteAchievement,
}) => {
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');
  const [showCreator, setShowCreator] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AchievementCategory>('mileage');
  const [metric, setMetric] = useState<keyof PlayerLifetimeStats | 'manual'>('totalDistanceMeters');
  const [target, setTarget] = useState(5000);
  const [description, setDescription] = useState('');

  const unlockedCount = achievements.filter((a) => Boolean(saveData.unlockedAchievements[a.id])).length;
  const totalCount = achievements.length;
  const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const visible =
    filter === 'all' ? achievements : achievements.filter((a) => a.category === filter);

  const handleMetricChange = (val: keyof PlayerLifetimeStats | 'manual') => {
    setMetric(val);
    const found = PROGRESS_KEY_OPTIONS.find((o) => o.key === val);
    if (found) setTarget(found.defaultTarget);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isManual = metric === 'manual';
    const metricLabel = PROGRESS_KEY_OPTIONS.find((o) => o.key === metric)?.label ?? '';
    const newAch: AchievementDef = {
      id: `custom_ach_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: name.trim() || '自定义骑士勋章',
      category,
      description:
        description.trim() ||
        (isManual ? '自定义挑战目标，完成后可直接打卡解锁。' : `${metricLabel}达到 ${target}。`),
      target: isManual ? undefined : Math.max(1, target),
      progressKey: isManual ? undefined : metric,
      isCustom: true,
    };
    onAddAchievement(newAch);
    setName('');
    setDescription('');
    setShowCreator(false);
    setFilter('all');
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#F2EFE9]">
            成就殿堂 · {unlockedCount} / {totalCount} 项已达成
          </h2>
          <p className="text-sm text-[#A9B2BE] mt-1">
            涵盖里程极限、四大阵营、十级难度征服、骨头医疗与个人自定义目标，全部永久保存在本地。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 text-xs font-mono-num text-[#A9B2BE]">
            <span>完成度 {pct}%</span>
            <span aria-hidden="true">·</span>
            <span>累计 {saveData.stats.totalDistanceMeters.toLocaleString()} m</span>
            <span aria-hidden="true">·</span>
            <span>出车 {saveData.stats.totalRuns} 局</span>
          </div>

          <button
            onClick={() => setShowCreator((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E29D3E] hover:bg-[#EBAD56] text-xs font-semibold text-[#12161B] transition-colors whitespace-nowrap shrink-0"
          >
            {showCreator ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showCreator ? '收起表单' : '添加自定义成就'}
          </button>
        </div>
      </div>

      {/* Custom Achievement Builder */}
      {showCreator && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-[#1A2028] border border-[#E29D3E]/50 p-6 space-y-4"
        >
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold font-display text-[#F2EFE9]">设立自定义骑士成就</h3>
            <p className="text-xs text-[#A9B2BE] mt-0.5">
              可绑定自动追踪的累计数据指标（跑完一局自动判定解锁），或创建手动打卡挑战，刷新页面不丢失。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium block">成就名称</span>
              <input
                type="text"
                required
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：绿骨狂热者"
                className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium block">成就分类</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AchievementCategory)}
                className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
              >
                {ACHIEVEMENT_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium block">判定指标</span>
              <select
                value={metric}
                onChange={(e) =>
                  handleMetricChange(e.target.value as keyof PlayerLifetimeStats | 'manual')
                }
                className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
              >
                {PROGRESS_KEY_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            {metric !== 'manual' && (
              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">目标数值</span>
                <input
                  type="number"
                  min={1}
                  max={1000000}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] font-mono-num focus:outline-none focus:border-[#E29D3E]"
                />
              </label>
            )}

            <label className="space-y-1.5 sm:col-span-2 lg:col-span-4">
              <span className="text-[#CBD5E1] font-medium block">成就描述</span>
              <input
                type="text"
                maxLength={80}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="选填：描述达成该成就需要完成的精彩操作或累计目标"
                className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowCreator(false)}
              className="px-4 py-2 rounded-lg bg-[#242C37] hover:bg-[#303B4A] text-xs font-medium text-[#CBD5E1] whitespace-nowrap"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#E29D3E] hover:bg-[#EBAD56] text-xs font-semibold text-[#12161B] whitespace-nowrap"
            >
              保存成就
            </button>
          </div>
        </form>
      )}

      {/* Lifetime quick summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-[#1A2028] border border-white/10 rounded-xl p-3">
          <div className="text-xs text-[#8C96A4]">单局最高分</div>
          <div className="text-base font-bold font-mono-num text-[#E29D3E] mt-1">
            {saveData.stats.maxSingleRunScore.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#1A2028] border border-white/10 rounded-xl p-3">
          <div className="text-xs text-[#8C96A4]">单局最远</div>
          <div className="text-base font-bold font-mono-num mt-1">
            {saveData.stats.maxSingleRunDistance} m
          </div>
        </div>
        <div className="bg-[#1A2028] border border-white/10 rounded-xl p-3">
          <div className="text-xs text-[#8C96A4]">绿骨头累计</div>
          <div className="text-base font-bold font-mono-num text-[#4BE39E] mt-1">
            {saveData.stats.totalGreenBones}
          </div>
        </div>
        <div className="bg-[#1A2028] border border-white/10 rounded-xl p-3">
          <div className="text-xs text-[#8C96A4]">紫骨头累计</div>
          <div className="text-base font-bold font-mono-num text-[#C084FC] mt-1">
            {saveData.stats.totalPurpleBones}
          </div>
        </div>
        <div className="bg-[#1A2028] border border-white/10 rounded-xl p-3">
          <div className="text-xs text-[#8C96A4]">绷带 / 医疗包</div>
          <div className="text-base font-bold font-mono-num text-[#FCA5A5] mt-1">
            {saveData.stats.totalBandages} / {saveData.stats.totalMedkits}
          </div>
        </div>
        <div className="bg-[#1A2028] border border-white/10 rounded-xl p-3">
          <div className="text-xs text-[#8C96A4]">已用骑士</div>
          <div className="text-base font-bold font-mono-num mt-1">
            {saveData.stats.charactersUsed.length} / {totalCharacterCount}
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#1A2028] rounded-lg border border-white/10 w-fit">
        {ACHIEVEMENT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filter === c.id ? 'bg-[#E29D3E] text-[#12161B]' : 'text-[#A9B2BE] hover:text-[#F2EFE9]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((ach) => {
          const unlockedAt = saveData.unlockedAchievements[ach.id];
          const isUnlocked = Boolean(unlockedAt);
          const catLabel =
            ACHIEVEMENT_CATEGORIES.find((c) => c.id === ach.category)?.label ?? ach.category;

          let progressRatio = isUnlocked ? 1 : 0;
          let currentVal = 0;
          if (!isUnlocked && ach.target && ach.progressKey) {
            const raw = saveData.stats[ach.progressKey];
            currentVal = typeof raw === 'number' ? raw : 0;
            progressRatio = Math.min(1, currentVal / ach.target);
          }

          return (
            <div
              key={ach.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                isUnlocked
                  ? 'bg-[#1D242E] border-[#E29D3E]/60'
                  : 'bg-[#171C23] border-white/10 opacity-90'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-[#8C96A4] flex flex-wrap items-center gap-1.5">
                    {ach.isCustom && (
                      <>
                        <span className="text-[#4BE39E] font-medium">自定义</span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{catLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className={isUnlocked ? 'text-[#E29D3E]' : ''}>
                      {isUnlocked ? '已解锁' : ach.secret ? '隐藏成就' : '待达成'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-display text-[#F2EFE9]">{ach.name}</h3>
                </div>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked ? 'bg-[#E29D3E]/20 text-[#E29D3E]' : 'bg-[#222933] text-[#64748B]'
                  }`}
                >
                  {isUnlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </div>
              </div>

              <p className="text-xs text-[#A9B2BE] leading-relaxed">
                {ach.secret && !isUnlocked
                  ? '隐藏条件：深入体验高难度黑暗骑行或收集更多狗骑士即可揭晓。'
                  : ach.description}
              </p>

              {ach.target && !isUnlocked && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono-num text-[#8C96A4]">
                    <span>累计进度</span>
                    <span>
                      {Math.min(currentVal, ach.target)} / {ach.target}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#11151A] overflow-hidden">
                    <div
                      className="h-full bg-[#E29D3E]"
                      style={{ width: `${Math.round(progressRatio * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                {isUnlocked ? (
                  <div className="text-[11px] font-mono-num text-[#8C96A4]">
                    达成于 {new Date(unlockedAt).toLocaleDateString('zh-CN')}
                  </div>
                ) : (
                  <span />
                )}

                {ach.isCustom && (
                  <div className="flex items-center gap-2">
                    {!ach.target && (
                      <button
                        onClick={() => onToggleAchievement(ach.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#242C37] hover:bg-[#303B4A] text-[11px] font-medium text-[#E29D3E] whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {isUnlocked ? '撤销打卡' : '打卡达成'}
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteAchievement(ach.id)}
                      title="删除自定义成就"
                      className="p-1.5 rounded-md bg-[#242C37] hover:bg-[#7F1D1D] text-[#CBD5E1] hover:text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

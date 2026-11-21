import React from 'react';
import { Award, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { formatRankRequirement, getRankProgress, getTotalBones, RANKS } from '../data/ranks';
import { PlayerSaveData } from '../types/game';

interface RankLadderProps {
  saveData: PlayerSaveData;
}

export const RankLadder: React.FC<RankLadderProps> = ({ saveData }) => {
  const totalBones = getTotalBones(saveData.stats);
  const totalExp = saveData.stats.totalScore ?? 0;
  const info = getRankProgress(totalBones, totalExp);

  const nextUnit = info.next?.requirementKind === 'exp' ? '经验' : '根骨头';
  const currentForNext = info.next?.requirementKind === 'exp' ? totalExp : totalBones;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#F2EFE9]">
            军衔与境界等级 · 共 {RANKS.length} 级
          </h2>
          <p className="text-sm text-[#A9B2BE] mt-1">
            包含 14 级军衔与 2 重巅峰境界（超级无敌 · 不可能敌）；等级越高所需骨头或经验越多，升级均不消耗骨头与经验。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono-num text-[#A9B2BE]">
          <span className="text-[#F2EFE9] font-semibold">骨头 {totalBones.toLocaleString()} 根</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#38BDF8] font-semibold">经验 {totalExp.toLocaleString()}</span>
          <span aria-hidden="true">·</span>
          <span>白 {saveData.stats.totalNormalBones.toLocaleString()}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#4BE39E]">绿 {saveData.stats.totalGreenBones.toLocaleString()}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#C084FC]">紫 {saveData.stats.totalPurpleBones.toLocaleString()}</span>
        </div>
      </div>

      {/* Current Rank Summary Panel */}
      <div className="rounded-2xl bg-[#1A2028] border border-[#E29D3E]/50 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs text-[#A9B2BE] flex flex-wrap items-center gap-2">
              <span>{info.current.tierType === 'realm' ? '当前境界' : '当前军衔'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-[#E29D3E]">
                Lv.{info.current.level} / {RANKS.length}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#4BE39E] inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                升级不消耗骨头与经验
              </span>
            </div>
            <h3
              className="text-3xl font-extrabold font-display tracking-tight"
              style={{ color: info.current.accentColor }}
            >
              {info.current.level}. {info.current.name}
            </h3>
            <p className="text-xs text-[#CBD5E1]">{info.current.desc}</p>
          </div>

          <div className="bg-[#13171D] border border-white/10 rounded-xl px-5 py-3.5 text-right shrink-0 space-y-1">
            <div className="text-xs text-[#8C96A4]">当前持有（永久保留不扣除）</div>
            <div className="text-lg font-bold font-mono-num text-[#E29D3E]">
              {totalBones.toLocaleString()} 根骨头 · {totalExp.toLocaleString()} 经验
            </div>
            <div className="text-[11px] font-mono-num text-[#A9B2BE]">
              {info.next
                ? `还差 ${info.amountToNext.toLocaleString()} ${nextUnit}晋升至「${info.next.name}」`
                : '已登顶终极境界「不可能敌」'}
            </div>
          </div>
        </div>

        {/* Next Rank Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-mono-num text-[#A9B2BE]">
            <span>
              {info.next
                ? `下一${info.next.tierType === 'realm' ? '境界' : '等级'}：${info.next.level}. ${info.next.name}（需 ${formatRankRequirement(info.next)}）`
                : '终极境界达成'}
            </span>
            <span>
              {info.next
                ? `${currentForNext.toLocaleString()} / ${info.next.requiredAmount.toLocaleString()} (${Math.round(
                    info.progressRatio * 100
                  )}%)`
                : '100%'}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[#11151A] overflow-hidden">
            <div
              className="h-full bg-[#E29D3E] transition-[width] duration-200"
              style={{ width: `${Math.round(info.progressRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* All 16 Tiers Grid (1-14 Military Ranks + 15-16 Realm Ranks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {RANKS.map((rank) => {
          const isUnlocked = info.current.level >= rank.level;
          const isCurrent = info.current.level === rank.level;
          const ownedValue = rank.requirementKind === 'exp' ? totalExp : totalBones;
          const missing = Math.max(0, rank.requiredAmount - ownedValue);
          const unit = rank.requirementKind === 'exp' ? '经验' : '根';

          return (
            <div
              key={rank.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                isCurrent
                  ? 'bg-[#222933] border-[#E29D3E]'
                  : rank.tierType === 'realm'
                  ? 'bg-[#1B202C] border-[#38BDF8]/35'
                  : isUnlocked
                  ? 'bg-[#1A2028] border-white/15'
                  : 'bg-[#151A21] border-white/10 opacity-85'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-mono-num text-[#8C96A4] flex items-center gap-2">
                    <span style={{ color: rank.accentColor }} className="font-bold">
                      Lv.{rank.level}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={rank.tierType === 'realm' ? 'text-[#38BDF8] font-medium' : ''}>
                      {rank.tierType === 'realm' ? '境界等级' : '军衔等级'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={isCurrent ? 'text-[#E29D3E] font-semibold' : isUnlocked ? 'text-[#4BE39E]' : ''}>
                      {isCurrent ? '当前等级' : isUnlocked ? '已达成' : `差 ${missing.toLocaleString()} ${unit}`}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-[#F2EFE9]">
                    {rank.level}. {rank.name}
                  </h3>
                </div>

                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-[#E29D3E]/20 text-[#E29D3E]'
                      : isUnlocked
                      ? 'bg-[#4BE39E]/15 text-[#4BE39E]'
                      : 'bg-[#222933] text-[#64748B]'
                  }`}
                >
                  {isCurrent ? (
                    <Award className="w-5 h-5" />
                  ) : isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
              </div>

              <p className="text-xs text-[#A9B2BE] leading-relaxed">{rank.desc}</p>

              <div className="flex items-center justify-between text-xs font-mono-num pt-2 border-t border-white/10">
                <span className="text-[#8C96A4]">
                  {rank.requirementKind === 'exp' ? '所需经验（不消耗）' : '所需骨头（不消耗）'}
                </span>
                <span style={{ color: rank.accentColor }} className="font-bold">
                  {formatRankRequirement(rank)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

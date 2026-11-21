import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { BONE_VALUES } from '../data/difficulties';
import { DarknessMode, DifficultyConfig, DifficultyId } from '../types/game';

interface DifficultyArchiveProps {
  difficulties: DifficultyConfig[];
  selectedDifficultyId: DifficultyId;
  clearedDifficulties: DifficultyId[];
  onSelectDifficulty: (id: DifficultyId) => void;
  onStartWithDifficulty: (id: DifficultyId) => void;
  onAddDifficulty: (diff: DifficultyConfig) => void;
  onDeleteDifficulty: (id: DifficultyId) => void;
}

export const DifficultyArchive: React.FC<DifficultyArchiveProps> = ({
  difficulties,
  selectedDifficultyId,
  clearedDifficulties,
  onSelectDifficulty,
  onStartWithDifficulty,
  onAddDifficulty,
  onDeleteDifficulty,
}) => {
  const [showCreator, setShowCreator] = useState(false);
  const [name, setName] = useState('');
  const [shortDesc, setShortDesc] = useState('自定义特训公路路线');
  const [detailDesc, setDetailDesc] = useState('');
  const [targetDistanceMeters, setTargetDistanceMeters] = useState(1400);
  const [roadSpeed, setRoadSpeed] = useState(310);
  const [enemySpawnRate, setEnemySpawnRate] = useState(0.85);
  const [axisPatrolChance, setAxisPatrolChance] = useState(0.45);
  const [darknessMode, setDarknessMode] = useState<DarknessMode>('none');
  const [greenBonePct, setGreenBonePct] = useState(25);
  const [purpleBonePct, setPurpleBonePct] = useState(12);
  const [bandagePct, setBandagePct] = useState(12);
  const [medkitPct, setMedkitPct] = useState(6);
  const [scoreMultiplier, setScoreMultiplier] = useState(2.2);
  const [accentColor, setAccentColor] = useState('#E29D3E');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextTier = difficulties.length + 1;
    const clampedSpeed = Math.max(150, Math.min(550, roadSpeed));
    const diff: DifficultyConfig = {
      id: `custom_diff_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      tier: nextTier,
      name: name.trim() || `自定路线 ${nextTier}`,
      shortDesc: shortDesc.trim() || '自定义难度规则',
      detailDesc:
        detailDesc.trim() ||
        `终点 ${targetDistanceMeters} 米，绿骨头概率 ${greenBonePct}%、紫骨头 ${purpleBonePct}%、医疗补给按设定刷新。`,
      accentColor,
      roadSpeed: clampedSpeed,
      enemySpawnRate,
      obstacleSpawnRate: Math.max(0.2, Math.min(1.5, enemySpawnRate * 0.85)),
      axisPatrolChance,
      enemyBulletSpeed: 220 + (clampedSpeed - 150) * 0.5,
      enemyFireInterval: Math.max(0.95, 2.5 - enemySpawnRate * 0.8),
      damageMultiplier: Math.max(0.5, Number((0.7 + enemySpawnRate * 0.45).toFixed(2))),
      darknessMode,
      headlightRadius: darknessMode === 'cyclic_blackout' ? 215 : darknessMode === 'dim_shadow' ? 255 : 320,
      greenBoneChance: greenBonePct / 100,
      purpleBoneChance: purpleBonePct / 100,
      bandageChance: bandagePct / 100,
      medkitChance: medkitPct / 100,
      scoreMultiplier,
      targetDistanceMeters,
      isCustom: true,
    };
    onAddDifficulty(diff);
    setName('');
    setDetailDesc('');
    setShowCreator(false);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#F2EFE9]">
            {difficulties.length} 级阶梯难度与战地掉落档案
          </h2>
          <p className="text-sm text-[#A9B2BE] mt-1">
            难度越高终点越远、补给与高倍骨头概率越高；可随时添加自定义难度，刷新后永久保留。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-xs text-[#A9B2BE] font-mono-num flex flex-wrap items-center gap-3">
            <span>常规骨头 {BONE_VALUES.normal}分</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#4BE39E]">绿骨头 {BONE_VALUES.green}分 (+2倍)</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#C084FC]">紫骨头 {BONE_VALUES.purple}分 (+6.5倍)</span>
          </div>

          <button
            onClick={() => setShowCreator((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E29D3E] hover:bg-[#EBAD56] text-xs font-semibold text-[#12161B] transition-colors whitespace-nowrap shrink-0"
          >
            {showCreator ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showCreator ? '收起表单' : '添加自定义难度'}
          </button>
        </div>
      </div>

      {showCreator && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-[#1A2028] border border-[#E29D3E]/50 p-6 space-y-5"
        >
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold font-display text-[#F2EFE9]">创建自定义公路难度</h3>
            <p className="text-xs text-[#A9B2BE] mt-0.5">
              自由调节终点距离、绿/紫骨头概率、绷带医疗包掉率与黑暗模式，提交后立即可在出车大厅选择。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium block">难度名称</span>
              <input
                type="text"
                required
                maxLength={16}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：暴雪极速"
                className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium block">简短标语</span>
              <input
                type="text"
                maxLength={24}
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium block">视野光照模式</span>
              <select
                value={darknessMode}
                onChange={(e) => setDarknessMode(e.target.value as DarknessMode)}
                className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
              >
                <option value="none">清晰视野</option>
                <option value="dim_shadow">持续暗影暮色</option>
                <option value="cyclic_blackout">周期全黑（寂静暗幕）</option>
              </select>
            </label>

            <div className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium block">标识颜色</span>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-full h-9 rounded-lg bg-[#12161B] border border-white/15 cursor-pointer px-1"
              />
            </div>

            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium flex justify-between font-mono-num">
                <span>终点距离</span>
                <span>{targetDistanceMeters} m</span>
              </span>
              <input
                type="range"
                min={300}
                max={5000}
                step={100}
                value={targetDistanceMeters}
                onChange={(e) => setTargetDistanceMeters(Number(e.target.value))}
                className="w-full accent-[#E29D3E]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium flex justify-between font-mono-num">
                <span>骑行路速</span>
                <span>{roadSpeed}</span>
              </span>
              <input
                type="range"
                min={180}
                max={500}
                step={10}
                value={roadSpeed}
                onChange={(e) => setRoadSpeed(Number(e.target.value))}
                className="w-full accent-[#E29D3E]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium flex justify-between font-mono-num">
                <span>对手密集度</span>
                <span>{enemySpawnRate.toFixed(2)}/s</span>
              </span>
              <input
                type="range"
                min={0.2}
                max={1.8}
                step={0.05}
                value={enemySpawnRate}
                onChange={(e) => setEnemySpawnRate(Number(e.target.value))}
                className="w-full accent-[#E29D3E]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#CBD5E1] font-medium flex justify-between font-mono-num">
                <span>得分倍率</span>
                <span>×{scoreMultiplier.toFixed(1)}</span>
              </span>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.1}
                value={scoreMultiplier}
                onChange={(e) => setScoreMultiplier(Number(e.target.value))}
                className="w-full accent-[#E29D3E]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#4BE39E] font-medium flex justify-between font-mono-num">
                <span>绿骨头概率</span>
                <span>{greenBonePct}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={45}
                value={greenBonePct}
                onChange={(e) => setGreenBonePct(Number(e.target.value))}
                className="w-full accent-[#4BE39E]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#C084FC] font-medium flex justify-between font-mono-num">
                <span>紫骨头概率</span>
                <span>{purpleBonePct}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={30}
                value={purpleBonePct}
                onChange={(e) => setPurpleBonePct(Number(e.target.value))}
                className="w-full accent-[#C084FC]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#FCA5A5] font-medium flex justify-between font-mono-num">
                <span>绷带概率</span>
                <span>{bandagePct}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={30}
                value={bandagePct}
                onChange={(e) => setBandagePct(Number(e.target.value))}
                className="w-full accent-[#FCA5A5]"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[#6EE7B7] font-medium flex justify-between font-mono-num">
                <span>医疗包概率</span>
                <span>{medkitPct}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={20}
                value={medkitPct}
                onChange={(e) => setMedkitPct(Number(e.target.value))}
                className="w-full accent-[#6EE7B7]"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[#CBD5E1] font-medium flex justify-between font-mono-num">
                <span>轴心巡逻开火率</span>
                <span>{Math.round(axisPatrolChance * 100)}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={axisPatrolChance}
                onChange={(e) => setAxisPatrolChance(Number(e.target.value))}
                className="w-full accent-[#E29D3E]"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[#CBD5E1] font-medium block">说明备注</span>
              <input
                type="text"
                maxLength={80}
                value={detailDesc}
                onChange={(e) => setDetailDesc(e.target.value)}
                placeholder="选填：说明本难度的战术特色与补给策略"
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
              保存并添加难度
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {difficulties.map((diff) => {
          const isSelected = selectedDifficultyId === diff.id;
          const isCleared = clearedDifficulties.includes(diff.id);

          return (
            <div
              key={diff.id}
              onClick={() => onSelectDifficulty(diff.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDifficulty(diff.id);
                }
              }}
              className={`rounded-2xl bg-[#1A2028] border p-5 transition-colors cursor-pointer flex flex-col justify-between gap-4 ${
                isSelected ? 'border-[#E29D3E]' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-xs font-mono-num font-bold"
                      style={{ color: diff.accentColor }}
                    >
                      {String(diff.tier).padStart(2, '0')}
                    </span>
                    <h3 className="text-lg font-bold font-display text-[#F2EFE9]">{diff.name}</h3>
                    {diff.isCustom && (
                      <span className="text-xs text-[#4BE39E] font-medium">· 自定义</span>
                    )}
                  </div>

                  <div className="text-xs text-[#A9B2BE] font-mono-num flex items-center gap-2">
                    {isCleared && <span className="text-[#4BE39E]">已通关</span>}
                    {isCleared && <span aria-hidden="true">·</span>}
                    <span className="text-[#F2EFE9]">终点 {diff.targetDistanceMeters} m</span>
                    <span aria-hidden="true">·</span>
                    <span>积分 ×{diff.scoreMultiplier}</span>
                  </div>
                </div>

                <p className="text-xs font-medium" style={{ color: diff.accentColor }}>
                  {diff.shortDesc}
                </p>
                <p className="text-xs text-[#A9B2BE] leading-relaxed">{diff.detailDesc}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="grid grid-cols-4 gap-2 text-xs font-mono-num">
                  <div className="bg-[#13171D] rounded-lg px-2.5 py-1.5">
                    <div className="text-[#8C96A4]">绿骨头</div>
                    <div className="text-[#4BE39E] font-semibold mt-0.5">
                      {Math.round(diff.greenBoneChance * 100)}%
                    </div>
                  </div>
                  <div className="bg-[#13171D] rounded-lg px-2.5 py-1.5">
                    <div className="text-[#8C96A4]">紫骨头</div>
                    <div className="text-[#C084FC] font-semibold mt-0.5">
                      {Math.round(diff.purpleBoneChance * 100)}%
                    </div>
                  </div>
                  <div className="bg-[#13171D] rounded-lg px-2.5 py-1.5">
                    <div className="text-[#8C96A4]">绷带</div>
                    <div className="text-[#FCA5A5] font-semibold mt-0.5">
                      {Math.round(diff.bandageChance * 100)}%
                    </div>
                  </div>
                  <div className="bg-[#13171D] rounded-lg px-2.5 py-1.5">
                    <div className="text-[#8C96A4]">医疗包</div>
                    <div className="text-[#6EE7B7] font-semibold mt-0.5">
                      {Math.round(diff.medkitChance * 100)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-[#8C96A4]">
                  <span>
                    视野：
                    {diff.darknessMode === 'cyclic_blackout'
                      ? '周期全黑（寂静暗幕）'
                      : diff.darknessMode === 'dim_shadow'
                      ? '持续暗影暮色'
                      : '清晰视野'}
                    {' · '}
                    天气影响：{diff.tier <= 2 ? '微弱' : diff.tier <= 5 ? '中等' : '显著'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {diff.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDifficulty(diff.id);
                        }}
                        title="删除自定义难度"
                        className="p-1.5 rounded-lg bg-[#242C37] hover:bg-[#7F1D1D] text-[#CBD5E1] hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartWithDifficulty(diff.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#242C37] hover:bg-[#E29D3E] hover:text-[#12161B] text-[#F2EFE9] font-medium transition-colors whitespace-nowrap"
                    >
                      以此难度发车
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

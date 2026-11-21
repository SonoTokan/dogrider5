import React, { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { CHARACTER_CATEGORY_META } from '../data/characters';
import {
  BikeFrameStyle,
  CharacterCategory,
  CharacterDef,
  SkillType,
  WeaponStyle,
} from '../types/game';
import { BikePreviewCanvas } from './BikePreviewCanvas';

interface CharacterGalleryProps {
  characters: CharacterDef[];
  selectedP1Id: string;
  onSelectForP1: (char: CharacterDef) => void;
  onAddCharacter: (char: CharacterDef) => void;
  onDeleteCharacter: (id: string) => void;
}

const CATEGORIES: CharacterCategory[] = ['SOLO', 'MULTIPLAYER', 'COOP', 'AXIS_INVASION'];

const FRAME_STYLE_OPTIONS: { value: BikeFrameStyle; label: string }[] = [
  { value: 'postal', label: '邮差复古车架' },
  { value: 'vintage28', label: '二八加重铁架' },
  { value: 'track', label: '低风阻竞速架' },
  { value: 'gravel', label: '砾石越野车架' },
  { value: 'parade', label: '礼花花车车架' },
  { value: 'sidecar_medic', label: '战地边斗急救架' },
  { value: 'cargo_tow', label: '重型牵引拖车' },
  { value: 'axis_mg', label: '轴心双管机枪车' },
  { value: 'axis_carbine', label: '轴心卡宾侦察车' },
  { value: 'axis_mortar', label: '轴心迫击三轮车' },
  { value: 'axis_armored', label: '轴心前盾铁甲车' },
];

const SKILL_OPTIONS: { value: SkillType; name: string; desc: string; cooldown: number }[] = [
  { value: 'parcel_toss', name: '加急包裹', desc: '向前抛掷穿透 3 名目标的重包裹。', cooldown: 6 },
  { value: 'brass_bell', name: '铜铃震波', desc: '震碎周围 250px 内的所有敌方子弹。', cooldown: 8 },
  { value: 'paper_fan', name: '三连晨报', desc: '向正前方扇形齐射三发高伤飞报。', cooldown: 5 },
  { value: 'iron_mudguard', name: '铁皮护盾', desc: '展开护盾免疫接下来 3.2 秒伤害。', cooldown: 10 },
  { value: 'slipstream_dash', name: '破风冲刺', desc: '短时大幅提速并撞碎沿途路障。', cooldown: 7 },
  { value: 'confetti_pull', name: '礼花磁吸', desc: '将前方大范围内的骨头与补给吸向自己。', cooldown: 9 },
  { value: 'field_bandage_zone', name: '战地急救区', desc: '在路面展开持续回血的绿十字区域。', cooldown: 11 },
  { value: 'warm_biscuit', name: '热饼补给', desc: '立即为己方全体骑手恢复 15 点生命。', cooldown: 10 },
  { value: 'mg_overclock', name: '弹雨倾泻', desc: '瞬间扇形倾泻 5 发无限重弹幕并加速。', cooldown: 7 },
  { value: 'mortar_salvo', name: '三连空爆', desc: '发射三枚抛物线高爆迫击炮弹。', cooldown: 8 },
];

const WEAPON_OPTIONS: { value: WeaponStyle; label: string }[] = [
  { value: 'none', label: '无车载武器' },
  { value: 'twin_mg', label: '双联机关枪 (高速连射)' },
  { value: 'piercing_carbine', label: '穿甲卡宾枪 (穿透 2 目标)' },
  { value: 'flak_mortar', label: '抛射迫击炮 (范围爆炸)' },
  { value: 'scatter_carbine', label: '三向霰弹卡宾 (扇面压制)' },
];

export const CharacterGallery: React.FC<CharacterGalleryProps> = ({
  characters,
  selectedP1Id,
  onSelectForP1,
  onAddCharacter,
  onDeleteCharacter,
}) => {
  const [activeCat, setActiveCat] = useState<CharacterCategory | 'ALL'>('ALL');
  const [showCreator, setShowCreator] = useState(false);

  // Creator form state
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('中华田园大黑狗');
  const [category, setCategory] = useState<CharacterCategory>('SOLO');
  const [frameStyle, setFrameStyle] = useState<BikeFrameStyle>('vintage28');
  const [primaryColor, setPrimaryColor] = useState('#E29D3E');
  const [furColor, setFurColor] = useState('#C68B59');
  const [earColor, setEarColor] = useState('#5C3A21');
  const [speed, setSpeed] = useState(7);
  const [handling, setHandling] = useState(7);
  const [maxHp, setMaxHp] = useState(120);
  const [skillType, setSkillType] = useState<SkillType>('brass_bell');
  const [infiniteAmmo, setInfiniteAmmo] = useState(false);
  const [weaponStyle, setWeaponStyle] = useState<WeaponStyle>('twin_mg');
  const [quirkStory, setQuirkStory] = useState('');

  const selectedSkillMeta = useMemo(
    () => SKILL_OPTIONS.find((s) => s.value === skillType) ?? SKILL_OPTIONS[0],
    [skillType]
  );

  const previewChar: CharacterDef = useMemo(() => {
    const useWeapon = infiniteAmmo || category === 'AXIS_INVASION';
    const resolvedWeapon: WeaponStyle = useWeapon
      ? weaponStyle === 'none'
        ? 'twin_mg'
        : weaponStyle
      : 'none';
    return {
      id: 'preview_custom_char',
      name: name.trim() || '新晋自定义狗骑士',
      title: '自编骑手',
      breed: breed.trim() || '混血猎犬',
      category,
      frameStyle,
      primaryColor,
      furColor,
      earColor,
      accessoryLabel: useWeapon ? '改装车载枪架' : '自定义鞍包',
      stats: { speed, handling, maxHp },
      passiveName: '顽强车感',
      passiveDesc: '自定义车手出厂即自带均衡骑行调校。',
      skillName: selectedSkillMeta.name,
      skillDesc: selectedSkillMeta.desc,
      skillType,
      skillCooldown: selectedSkillMeta.cooldown,
      infiniteAmmo: useWeapon,
      weaponStyle: resolvedWeapon,
      fireRate: useWeapon ? 5 : undefined,
      quirkStory: quirkStory.trim() || '由车手仓库手工组装的专属坐骑与犬骑士。',
      isCustom: true,
    };
  }, [
    name,
    breed,
    category,
    frameStyle,
    primaryColor,
    furColor,
    earColor,
    speed,
    handling,
    maxHp,
    skillType,
    selectedSkillMeta,
    infiniteAmmo,
    weaponStyle,
    quirkStory,
  ]);

  const handleCategoryChange = (nextCat: CharacterCategory) => {
    setCategory(nextCat);
    if (nextCat === 'AXIS_INVASION') {
      setInfiniteAmmo(true);
      if (weaponStyle === 'none') setWeaponStyle('twin_mg');
      if (!frameStyle.startsWith('axis_')) setFrameStyle('axis_mg');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newChar: CharacterDef = {
      ...previewChar,
      id: `custom_char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      isCustom: true,
    };
    onAddCharacter(newChar);
    setName('');
    setQuirkStory('');
    setShowCreator(false);
    setActiveCat('ALL');
  };

  const visibleChars =
    activeCat === 'ALL' ? characters : characters.filter((c) => c.category === activeCat);

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#F2EFE9]">
            车手图鉴 · 共 {characters.length} 位专属狗骑士
          </h2>
          <p className="text-sm text-[#A9B2BE] mt-1">
            分为单人专属、多人专属、合作专属与轴心国入侵专属四大阵营，支持自定义添加并永久本地保存。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#1A2028] rounded-lg border border-white/10">
            <button
              onClick={() => setActiveCat('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeCat === 'ALL' ? 'bg-[#E29D3E] text-[#12161B]' : 'text-[#A9B2BE] hover:text-[#F2EFE9]'
              }`}
            >
              全部 {characters.length} 位
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeCat === cat ? 'bg-[#E29D3E] text-[#12161B]' : 'text-[#A9B2BE] hover:text-[#F2EFE9]'
                }`}
              >
                {CHARACTER_CATEGORY_META[cat].label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreator((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E29D3E] hover:bg-[#EBAD56] text-xs font-semibold text-[#12161B] transition-colors whitespace-nowrap shrink-0"
          >
            {showCreator ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showCreator ? '收起编辑器' : '添加专属车手'}
          </button>
        </div>
      </div>

      {/* Custom Character Builder */}
      {showCreator && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-[#1A2028] border border-[#E29D3E]/50 p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-lg font-bold font-display text-[#F2EFE9]">组装新狗骑士与自行车</h3>
              <p className="text-xs text-[#A9B2BE] mt-0.5">
                添加后的车手会自动保存在本地浏览器，刷新页面后依然可以直接选中出战。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Preview */}
            <div className="lg:col-span-4 space-y-3">
              <BikePreviewCanvas character={previewChar} width={320} height={156} />
              <div className="text-xs text-[#A9B2BE] space-y-1">
                <div className="font-semibold text-[#F2EFE9]">{previewChar.name}</div>
                <div>
                  {CHARACTER_CATEGORY_META[previewChar.category].label} · {previewChar.breed}
                  {previewChar.infiniteAmmo ? ' · 子弹 ∞' : ''}
                </div>
                <div className="text-[#67B8E3]">
                  技能：{previewChar.skillName} ({previewChar.skillCooldown}s)
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">车手名字</span>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：铁蹄狼犬·阿飞"
                  className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">犬种</span>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">所属模式阵营</span>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as CharacterCategory)}
                  className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CHARACTER_CATEGORY_META[c].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">自行车架样式</span>
                <select
                  value={frameStyle}
                  onChange={(e) => setFrameStyle(e.target.value as BikeFrameStyle)}
                  className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
                >
                  {FRAME_STYLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">主动技能</span>
                <select
                  value={skillType}
                  onChange={(e) => setSkillType(e.target.value as SkillType)}
                  className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
                >
                  {SKILL_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.name} ({s.cooldown}s)
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">车载无限火力</span>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    checked={infiniteAmmo || category === 'AXIS_INVASION'}
                    disabled={category === 'AXIS_INVASION'}
                    onChange={(e) => setInfiniteAmmo(e.target.checked)}
                    className="accent-[#E29D3E] w-4 h-4"
                  />
                  <span className="text-[#A9B2BE]">启用无限子弹武器</span>
                </div>
              </label>

              {(infiniteAmmo || category === 'AXIS_INVASION') && (
                <label className="space-y-1.5 sm:col-span-2 md:col-span-3">
                  <span className="text-[#CBD5E1] font-medium block">武器型号</span>
                  <select
                    value={weaponStyle === 'none' ? 'twin_mg' : weaponStyle}
                    onChange={(e) => setWeaponStyle(e.target.value as WeaponStyle)}
                    className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
                  >
                    {WEAPON_OPTIONS.filter((w) => w.value !== 'none').map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">车架漆色</span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full h-9 rounded-lg bg-[#12161B] border border-white/15 cursor-pointer px-1"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">犬毛颜色</span>
                <input
                  type="color"
                  value={furColor}
                  onChange={(e) => setFurColor(e.target.value)}
                  className="w-full h-9 rounded-lg bg-[#12161B] border border-white/15 cursor-pointer px-1"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium block">耳鼻配色</span>
                <input
                  type="color"
                  value={earColor}
                  onChange={(e) => setEarColor(e.target.value)}
                  className="w-full h-9 rounded-lg bg-[#12161B] border border-white/15 cursor-pointer px-1"
                />
              </div>

              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium flex justify-between font-mono-num">
                  <span>速度</span>
                  <span>{speed}/10</span>
                </span>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-[#E29D3E]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium flex justify-between font-mono-num">
                  <span>操控</span>
                  <span>{handling}/10</span>
                </span>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={handling}
                  onChange={(e) => setHandling(Number(e.target.value))}
                  className="w-full accent-[#E29D3E]"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[#CBD5E1] font-medium flex justify-between font-mono-num">
                  <span>生命值</span>
                  <span>{maxHp} HP</span>
                </span>
                <input
                  type="range"
                  min={80}
                  max={220}
                  step={5}
                  value={maxHp}
                  onChange={(e) => setMaxHp(Number(e.target.value))}
                  className="w-full accent-[#E29D3E]"
                />
              </label>

              <label className="space-y-1.5 sm:col-span-2 md:col-span-3">
                <span className="text-[#CBD5E1] font-medium block">人物设定故事</span>
                <input
                  type="text"
                  maxLength={80}
                  value={quirkStory}
                  onChange={(e) => setQuirkStory(e.target.value)}
                  placeholder="例如：曾在暴风雪里用旧二八大杠一口气运送三十箱骨头。"
                  className="w-full px-3 py-2 rounded-lg bg-[#12161B] border border-white/15 text-[#F2EFE9] focus:outline-none focus:border-[#E29D3E]"
                />
              </label>
            </div>
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
              保存并加入图鉴
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {visibleChars.map((char) => {
          const isSelected = selectedP1Id === char.id;
          const catMeta = CHARACTER_CATEGORY_META[char.category];
          return (
            <article
              key={char.id}
              className={`rounded-2xl bg-[#1A2028] border transition-colors p-4 flex flex-col justify-between gap-4 ${
                isSelected ? 'border-[#E29D3E]' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div className="space-y-3">
                <BikePreviewCanvas character={char} width={260} height={124} />

                <div className="space-y-1">
                  <div className="text-xs text-[#A9B2BE] flex flex-wrap items-center gap-1.5">
                    {char.isCustom && (
                      <>
                        <span className="text-[#4BE39E] font-medium">自定义</span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className={char.infiniteAmmo ? 'text-[#E29D3E] font-medium' : ''}>
                      {catMeta.label}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{char.breed}</span>
                    {char.infiniteAmmo && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num text-[#E29D3E]">子弹 ∞</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-bold font-display text-[#F2EFE9]">{char.name}</h3>
                  <p className="text-xs text-[#8C96A4] leading-relaxed">{char.quirkStory}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs font-mono-num">
                  <div>
                    <div className="text-[#8C96A4]">速度</div>
                    <div className="text-[#F2EFE9] font-semibold mt-0.5">{char.stats.speed}/10</div>
                  </div>
                  <div>
                    <div className="text-[#8C96A4]">操控</div>
                    <div className="text-[#F2EFE9] font-semibold mt-0.5">{char.stats.handling}/10</div>
                  </div>
                  <div>
                    <div className="text-[#8C96A4]">生命</div>
                    <div className="text-[#F2EFE9] font-semibold mt-0.5">{char.stats.maxHp} HP</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[#E29D3E] font-semibold">天赋 · {char.passiveName}：</span>
                    <span className="text-[#CBD5E1]">{char.passiveDesc}</span>
                  </div>
                  <div>
                    <span className="text-[#67B8E3] font-semibold">
                      技能 · {char.skillName} ({char.skillCooldown}s)：
                    </span>
                    <span className="text-[#CBD5E1]">{char.skillDesc}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectForP1(char)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap truncate ${
                    isSelected
                      ? 'bg-[#E29D3E] text-[#12161B]'
                      : 'bg-[#242C37] hover:bg-[#2F3A48] text-[#F2EFE9]'
                  }`}
                >
                  {isSelected ? '已选为当前出战车手' : `选用此车手（${catMeta.label.replace('专属', '')}）`}
                </button>
                {char.isCustom && (
                  <button
                    onClick={() => onDeleteCharacter(char.id)}
                    title="删除自定义车手"
                    className="p-2 rounded-lg bg-[#242C37] hover:bg-[#7F1D1D] text-[#CBD5E1] hover:text-white transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

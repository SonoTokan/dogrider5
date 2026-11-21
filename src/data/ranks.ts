import { PlayerLifetimeStats, RankDef } from '../types/game';

export const RANKS: RankDef[] = [
  {
    level: 1,
    id: 'rank_01_rookie',
    name: '新手',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 0,
    requiredBones: 0,
    accentColor: '#94A3B8',
    desc: '刚跨上自行车的狗骑士，收集骨头即可无损晋升。',
  },
  {
    level: 2,
    id: 'rank_02_tech_sergeant',
    name: '技术军士',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 15,
    requiredBones: 15,
    accentColor: '#A3E635',
    desc: '掌握基本蹬车与跳障节奏，开始稳步积累骨头战利品。',
  },
  {
    level: 3,
    id: 'rank_03_adv_tech_sergeant',
    name: '进阶级技术军士',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 35,
    requiredBones: 35,
    accentColor: '#4BE39E',
    desc: '擅长车流穿梭与技能反制，前线骑行经验日渐老道。',
  },
  {
    level: 4,
    id: 'rank_04_officer',
    name: '军官',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 70,
    requiredBones: 70,
    accentColor: '#38BDF8',
    desc: '正式步入军官序列，在多变天气与枪林中依然稳健控车。',
  },
  {
    level: 5,
    id: 'rank_05_command_officer',
    name: '指挥军官',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 120,
    requiredBones: 120,
    accentColor: '#60A5FA',
    desc: '拥有出色的战场判断力，多人对抗与合作皆可独当一面。',
  },
  {
    level: 6,
    id: 'rank_06_super_command_officer',
    name: '超级指挥军官',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 190,
    requiredBones: 190,
    accentColor: '#818CF8',
    desc: '历经多场苦战而不倒，对绿骨与紫骨路线了如指掌。',
  },
  {
    level: 7,
    id: 'rank_07_invincible_command_officer',
    name: '无敌指挥军官',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 280,
    requiredBones: 280,
    accentColor: '#A78BFA',
    desc: '在暗影与轴心火力封锁下依然全速推进的铁腕指挥。',
  },
  {
    level: 8,
    id: 'rank_08_colonel',
    name: '上校',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 400,
    requiredBones: 400,
    accentColor: '#C084FC',
    desc: '公路战线的中坚统领，骑行所过之处敌车纷纷退散。',
  },
  {
    level: 9,
    id: 'rank_09_major',
    name: '少校',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 550,
    requiredBones: 550,
    accentColor: '#E879F9',
    desc: '高阶将校头衔，唯有持续突破长途终点者方可加冕。',
  },
  {
    level: 10,
    id: 'rank_10_favorite_general',
    name: '爱将',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 740,
    requiredBones: 740,
    accentColor: '#F472B6',
    desc: '声名远扬的王牌爱将，百战余生仍手握满仓骨头。',
  },
  {
    level: 11,
    id: 'rank_11_elite',
    name: '精英',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 980,
    requiredBones: 980,
    accentColor: '#FB923C',
    desc: '百里挑一的公路精英，无惧高倍伤害与寂静黑夜。',
  },
  {
    level: 12,
    id: 'rank_12_invincible_elite',
    name: '无敌精英',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 1280,
    requiredBones: 1280,
    accentColor: '#F59E0B',
    desc: '近乎不可阻挡的钢铁骑士，绿紫骨头源源不断入账。',
  },
  {
    level: 13,
    id: 'rank_13_super_invincible_elite',
    name: '超级无敌精英',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 1660,
    requiredBones: 1660,
    accentColor: '#F87171',
    desc: '登峰造极的骑行传奇，距离终极王座仅一步之遥。',
  },
  {
    level: 14,
    id: 'rank_14_invincible',
    name: '无敌',
    tierType: 'military',
    requirementKind: 'bones',
    requiredAmount: 2150,
    requiredBones: 2150,
    accentColor: '#E29D3E',
    desc: '军衔巅峰——「无敌」，坐拥海量骨头且分毫未损，随时冲击更高境界。',
  },
  {
    level: 15,
    id: 'realm_15_super_invincible',
    name: '超级无敌',
    tierType: 'realm',
    requirementKind: 'exp',
    requiredAmount: 100_000_000,
    requiredBones: 2150,
    accentColor: '#38BDF8',
    desc: '迈入传说「境界」第一重——累计经验突破 1 亿，升级不消耗任何经验与骨头。',
  },
  {
    level: 16,
    id: 'realm_16_unrivaled',
    name: '不可能敌',
    tierType: 'realm',
    requirementKind: 'bones',
    requiredAmount: 1_000_000_000,
    requiredBones: 1_000_000_000,
    accentColor: '#F43F5E',
    desc: '终极神话境界「不可能敌」——累计骨头突破 10 亿大关，升级不消耗骨头。',
  },
];

export function getTotalBones(
  stats: Pick<PlayerLifetimeStats, 'totalNormalBones' | 'totalGreenBones' | 'totalPurpleBones'>
): number {
  return (stats.totalNormalBones ?? 0) + (stats.totalGreenBones ?? 0) + (stats.totalPurpleBones ?? 0);
}

export function formatRankRequirement(rank: RankDef): string {
  if (rank.requiredAmount === 0) return '0 根骨头（初始）';
  if (rank.requirementKind === 'exp') {
    return rank.requiredAmount >= 100_000_000
      ? `${(rank.requiredAmount / 100_000_000).toLocaleString()} 亿经验`
      : `${rank.requiredAmount.toLocaleString()} 经验`;
  }
  return rank.requiredAmount >= 100_000_000
    ? `${(rank.requiredAmount / 100_000_000).toLocaleString()} 亿骨头`
    : `${rank.requiredAmount.toLocaleString()} 根骨头`;
}

export interface RankProgressInfo {
  current: RankDef;
  next: RankDef | null;
  totalBones: number;
  totalExp: number;
  amountToNext: number;
  bonesToNext: number;
  progressRatio: number;
}

export function getRankProgress(totalBones: number, totalExp: number = 0): RankProgressInfo {
  let current = RANKS[0];
  let next: RankDef | null = RANKS[1] ?? null;

  for (let i = 0; i < RANKS.length; i++) {
    const r = RANKS[i];
    const met =
      r.requirementKind === 'exp'
        ? totalExp >= r.requiredAmount
        : totalBones >= r.requiredAmount;
    if (met) {
      current = r;
      next = RANKS[i + 1] ?? null;
    } else {
      break;
    }
  }

  if (!next) {
    return {
      current,
      next: null,
      totalBones,
      totalExp,
      amountToNext: 0,
      bonesToNext: 0,
      progressRatio: 1,
    };
  }

  if (next.requirementKind === 'exp') {
    const baseExp = current.requirementKind === 'exp' ? current.requiredAmount : 0;
    const span = Math.max(1, next.requiredAmount - baseExp);
    const gained = Math.max(0, totalExp - baseExp);
    const remaining = Math.max(0, next.requiredAmount - totalExp);
    return {
      current,
      next,
      totalBones,
      totalExp,
      amountToNext: remaining,
      bonesToNext: remaining,
      progressRatio: Math.min(1, gained / span),
    };
  }

  const baseBones = current.requirementKind === 'bones' ? current.requiredAmount : current.requiredBones;
  const span = Math.max(1, next.requiredAmount - baseBones);
  const gained = Math.max(0, totalBones - baseBones);
  const remaining = Math.max(0, next.requiredAmount - totalBones);
  return {
    current,
    next,
    totalBones,
    totalExp,
    amountToNext: remaining,
    bonesToNext: remaining,
    progressRatio: Math.min(1, gained / span),
  };
}

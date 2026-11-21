import { DifficultyConfig, WeatherType } from '../types/game';

export interface WeatherMeta {
  type: WeatherType;
  label: string;
  handlingHint: string;
  accentColor: string;
}

export const WEATHER_META: Record<WeatherType, WeatherMeta> = {
  clear: {
    type: 'clear',
    label: '晴朗微风',
    handlingHint: '路面干爽 · 操控敏锐',
    accentColor: '#E29D3E',
  },
  rain: {
    type: 'rain',
    label: '斜雨湿滑',
    handlingHint: '刹车略滑 · 弯道带惯性',
    accentColor: '#67B8E3',
  },
  fog: {
    type: 'fog',
    label: '漫路浓雾',
    handlingHint: '湿气略重 · 转向微沉',
    accentColor: '#CBD5E1',
  },
  snow: {
    type: 'snow',
    label: '寒风飞雪',
    handlingHint: '侧风微飘 · 抓地略降',
    accentColor: '#A5D8FF',
  },
};

export interface WeatherPhysicsModifiers {
  /** Velocity smoothing rate (higher = snappier, lower = more glide/inertia) */
  steeringResponse: number;
  /** Top speed multiplier */
  speedScale: number;
  /** Subtle lateral crosswind push in px/s */
  crosswindVy: number;
  /** Visual density multiplier 0.25..1.0 */
  visualIntensity: number;
}

/**
 * Picks the next weather state weighted by difficulty tier.
 * Low difficulties stay clear longer and rarely hit snow; high difficulties cycle richly across rain, fog, and snow.
 */
export function pickNextWeather(current: WeatherType, tier: number): WeatherType {
  const pool: WeatherType[] =
    tier <= 2
      ? ['clear', 'clear', 'rain', 'fog']
      : tier <= 5
      ? ['clear', 'rain', 'fog', 'snow']
      : ['rain', 'fog', 'snow', 'clear'];

  const candidates = pool.filter((w) => w !== current);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? 'clear';
}

/**
 * Computes subtle, fair bicycle handling changes based on active weather and difficulty tier.
 * Guarantees bikes remain fully controllable while imparting tactile feel differences.
 */
export function getWeatherPhysics(
  weather: WeatherType,
  blend: number,
  difficulty: DifficultyConfig,
  elapsed: number,
  characterId: string
): WeatherPhysicsModifiers {
  // Scale impact gently from 0.25 (tier 1) to 1.0 (tier 10)
  const tierFactor = 0.22 + ((difficulty.tier - 1) / 9) * 0.78;
  const activeWeight = blend * tierFactor;

  // Certain bicycle builds naturally resist specific weather conditions
  const hasFatTires = characterId === 'mp_trail_doberman' || characterId === 'solo_workshop_dalmatian';
  const hasHeavyFrame = characterId === 'solo_vintage_terrier' || characterId === 'coop_tow_mastiff';

  if (weather === 'clear') {
    return {
      steeringResponse: 18,
      speedScale: 1,
      crosswindVy: 0,
      visualIntensity: 0,
    };
  }

  if (weather === 'rain') {
    const slipResist = hasFatTires ? 0.5 : 1;
    return {
      steeringResponse: 18 - 8.5 * activeWeight * slipResist, // smooth slide/inertia on wet tarmac
      speedScale: 1 - 0.04 * activeWeight,
      crosswindVy: 0,
      visualIntensity: Math.max(0.3, tierFactor) * blend,
    };
  }

  if (weather === 'fog') {
    return {
      steeringResponse: 18 - 6.0 * activeWeight, // damp heavy air feel
      speedScale: 1 - 0.06 * activeWeight,
      crosswindVy: 0,
      visualIntensity: Math.max(0.35, tierFactor) * blend,
    };
  }

  // Snow / Gale Snow: gentle swaying crosswind + frosty surface inertia
  const windResist = hasHeavyFrame ? 0.45 : 1;
  const gust = Math.sin(elapsed * 1.15) * 32 * activeWeight * windResist;
  return {
    steeringResponse: 18 - 9.5 * activeWeight * (hasFatTires ? 0.65 : 1),
    speedScale: 1 - 0.07 * activeWeight,
    crosswindVy: gust,
    visualIntensity: Math.max(0.35, tierFactor) * blend,
  };
}

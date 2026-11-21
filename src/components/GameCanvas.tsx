import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX, ArrowLeft, Crosshair } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  AirBloodDroplet,
  drawAirBloodDroplets,
  drawDogOnBicycle,
  drawExplosionsAndSmoke,
  drawFallenCyclist,
  drawFinishGate,
  drawGrenadeProjectile,
  drawGroundBloodSplatters,
  drawGroundCraters,
  drawGroundSparks,
  drawObstacle,
  drawPickupItem,
  drawRoadEnvironment,
  drawRubbleChunks,
  drawWeatherForeground,
  ExplosionEffect,
  GroundBloodSplatter,
  GroundCrater,
  GroundSpark,
  RubbleChunk,
  SmokePuff,
  WeatherParticle,
} from '../canvas/bikeRenderer';
import { BONE_VALUES } from '../data/difficulties';
import { getRankProgress } from '../data/ranks';
import { getWeatherPhysics, pickNextWeather, WEATHER_META } from '../data/weather';
import {
  ActiveRunSnapshot,
  CharacterDef,
  DifficultyConfig,
  DifficultyId,
  GameMode,
  GamePlayState,
  PickupType,
  RunSummary,
  WeatherType,
} from '../types/game';

interface GameCanvasProps {
  mode: GameMode;
  difficultyId: DifficultyId;
  p1CharacterId: string;
  p2CharacterId: string;
  allCharacters: CharacterDef[];
  allDifficulties: DifficultyConfig[];
  p2IsAi: boolean;
  autoFire: boolean;
  onToggleP2Ai: () => void;
  onToggleAutoFire: () => void;
  onMuteChange: (muted: boolean) => void;
  initialSnapshot: ActiveRunSnapshot | null;
  savedTotalBones: number;
  savedTotalExp: number;
  onSaveSnapshot: (snapshot: ActiveRunSnapshot) => void;
  onClearSnapshot: () => void;
  onRunComplete: (summary: RunSummary) => void;
  onExitToLobby: () => void;
}

interface RiderEntity {
  id: 'P1' | 'P2';
  char: CharacterDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  jumpOffset: number;
  jumpVel: number;
  isGrounded: boolean;
  hp: number;
  maxHp: number;
  alive: boolean;
  pedalPhase: number;
  leanAngle: number;
  skillCooldownLeft: number;
  shieldTimer: number;
  dashTimer: number;
  whistleTimer: number;
  slowTimer: number;
  hurtFlash: number;
  fireCooldown: number;
  grenadeCooldownLeft: number;
  selfRepairTimer: number;
  armoredFrontCooldown: number;
  score: number;
  combo: number;
  comboTimer: number;
  diedAtDist?: number;
  diedAtTime?: number;
}

interface EnemyCyclist {
  uid: number;
  x: number;
  y: number;
  speedX: number;
  hp: number;
  maxHp: number;
  isAxis: boolean;
  isAlliedTarget: boolean;
  char: CharacterDef;
  pedalPhase: number;
  fireTimer: number;
  grenadeTimer: number;
  bleedTimer: number;
  slowTimer: number;
  markedTimer: number;
}

interface Bullet {
  x: number;
  y: number;
  groundY: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  fromPlayer: boolean;
  ownerId?: 'P1' | 'P2';
  pierce: number;
  isMortar: boolean;
  isGrenade: boolean;
  spin: number;
  mortarLife: number;
  damage: number;
  color: string;
  radius: number;
}

interface PickupItem {
  uid: number;
  x: number;
  y: number;
  type: PickupType;
  magnetizedTo?: 'P1' | 'P2';
}

interface ObstacleItem {
  uid: number;
  x: number;
  y: number;
  kind: 'crate' | 'barricade' | 'puddle';
}

interface ZoneEffect {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  kind: 'heal_zone' | 'bell_wave' | 'soup_slick' | 'explosion';
  ownerId?: 'P1' | 'P2';
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
}

interface FallenCyclistSim {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  angle: number;
  targetAngle: number;
  angularVel: number;
  skidDist: number;
  wheelSpin: number;
  wheelSpinVel: number;
  bounces: number;
  life: number;
  character: CharacterDef;
  isAxisEnemy: boolean;
  label?: string;
}

const LOGICAL_W = 1080;
const LOGICAL_H = 540;
const ROAD_TOP = 138;
const ROAD_BOTTOM = 472;

const MODE_LABELS: Record<GameMode, string> = {
  SOLO: '单人模式',
  MULTIPLAYER: '多人对抗',
  COOP: '多人合作',
  AXIS_INVASION: '轴心国入侵',
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  difficultyId,
  p1CharacterId,
  p2CharacterId,
  allCharacters,
  allDifficulties,
  p2IsAi,
  autoFire,
  onToggleP2Ai,
  onToggleAutoFire,
  onMuteChange,
  initialSnapshot,
  savedTotalBones,
  savedTotalExp,
  onSaveSnapshot,
  onClearSnapshot,
  onRunComplete,
  onExitToLobby,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const darknessCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [playState, setPlayState] = useState<GamePlayState>('PLAYING');
  const [muted, setMuted] = useState<boolean>(soundEngine.muted);
  const [runKey, setRunKey] = useState<number>(1);
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null);

  const [hudState, setHudState] = useState({
    distance: 0,
    score: 0,
    p1Hp: 100,
    p1MaxHp: 100,
    p1Cd: 0,
    p2Hp: 100,
    p2MaxHp: 100,
    p2Cd: 0,
    p1Score: 0,
    p2Score: 0,
    combo: 0,
    normalBones: 0,
    greenBones: 0,
    purpleBones: 0,
    bandages: 0,
    medkits: 0,
    enemiesDefeated: 0,
    shotsFired: 0,
    silentStatus: '',
    tutorialHint: '',
    weather: 'clear' as WeatherType,
    rankLevel: getRankProgress(savedTotalBones, savedTotalExp).current.level,
    rankName: getRankProgress(savedTotalBones, savedTotalExp).current.name,
    rankColor: getRankProgress(savedTotalBones, savedTotalExp).current.accentColor,
    liveBones: savedTotalBones,
  });

  const playStateRef = useRef<GamePlayState>('PLAYING');
  playStateRef.current = playState;
  const autoFireRef = useRef<boolean>(autoFire);
  autoFireRef.current = autoFire;
  const p2IsAiRef = useRef<boolean>(p2IsAi);
  p2IsAiRef.current = p2IsAi;
  const baseTotalBonesRef = useRef<number>(savedTotalBones);
  baseTotalBonesRef.current = savedTotalBones;
  const baseTotalExpRef = useRef<number>(savedTotalExp);
  baseTotalExpRef.current = savedTotalExp;
  const snapshotAppliedRef = useRef<boolean>(false);
  const onSaveSnapshotRef = useRef(onSaveSnapshot);
  onSaveSnapshotRef.current = onSaveSnapshot;
  const onClearSnapshotRef = useRef(onClearSnapshot);
  onClearSnapshotRef.current = onClearSnapshot;
  const onToggleAutoFireRef = useRef(onToggleAutoFire);
  onToggleAutoFireRef.current = onToggleAutoFire;

  const charMap = useMemo(
    () => Object.fromEntries(allCharacters.map((c) => [c.id, c])),
    [allCharacters]
  );
  const diffMap = useMemo(
    () => Object.fromEntries(allDifficulties.map((d) => [d.id, d])),
    [allDifficulties]
  );

  const difficulty = diffMap[difficultyId] ?? allDifficulties[0];
  const p1Char = charMap[p1CharacterId] ?? allCharacters[0];
  const p2Char = charMap[p2CharacterId] ?? allCharacters[1] ?? allCharacters[0];
  const hasTwoPlayers = mode === 'MULTIPLAYER' || mode === 'COOP';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!darknessCanvasRef.current) {
      const off = document.createElement('canvas');
      off.width = LOGICAL_W;
      off.height = LOGICAL_H;
      darknessCanvasRef.current = off;
    }
    const darkCtx = darknessCanvasRef.current.getContext('2d');

    const keys = new Set<string>();
    const justPressed = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const code = e.code;
      if (!keys.has(code)) {
        justPressed.add(code);
      }
      keys.add(code);

      if (code === 'Escape' || code === 'KeyP') {
        setPlayState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
      if (code === 'KeyR' && mode === 'AXIS_INVASION') {
        onToggleAutoFireRef.current();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
    };

    let mouseFiring = false;
    const onMouseDown = () => {
      mouseFiring = true;
    };
    const onMouseUp = () => {
      mouseFiring = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Initialize simulation state
    const makeRider = (id: 'P1' | 'P2', char: CharacterDef, y: number): RiderEntity => ({
      id,
      char,
      x: id === 'P1' ? 165 : 135,
      y,
      vx: 0,
      vy: 0,
      jumpOffset: 0,
      jumpVel: 0,
      isGrounded: true,
      hp: char.stats.maxHp,
      maxHp: char.stats.maxHp,
      alive: true,
      pedalPhase: id === 'P1' ? 0 : 1.5,
      leanAngle: 0,
      skillCooldownLeft: 0,
      shieldTimer: 0,
      dashTimer: 0,
      whistleTimer: 0,
      slowTimer: 0,
      hurtFlash: 0,
      fireCooldown: 0,
      grenadeCooldownLeft: 0,
      selfRepairTimer: 0,
      armoredFrontCooldown: 0,
      score: 0,
      combo: 0,
      comboTimer: 0,
    });

    const riders: RiderEntity[] = [
      makeRider('P1', p1Char, hasTwoPlayers ? ROAD_TOP + 95 : (ROAD_TOP + ROAD_BOTTOM) / 2),
    ];
    if (hasTwoPlayers) {
      riders.push(makeRider('P2', p2Char, ROAD_BOTTOM - 95));
    }

    const enemies: EnemyCyclist[] = [];
    const fallenCyclists: FallenCyclistSim[] = [];
    const bullets: Bullet[] = [];
    const pickups: PickupItem[] = [];
    const obstacles: ObstacleItem[] = [];
    const zones: ZoneEffect[] = [];
    const floatTexts: FloatingText[] = [];
    const groundBloodSplatters: GroundBloodSplatter[] = [];
    const airBloodDroplets: AirBloodDroplet[] = [];
    const groundCraters: GroundCrater[] = [];
    const groundSparks: GroundSpark[] = [];
    const rubbleChunks: RubbleChunk[] = [];
    const smokePuffs: SmokePuff[] = [];
    const explosionEffects: ExplosionEffect[] = [];

    let uidCounter = 1;
    let scrollDist = 0;
    let elapsed = 0;
    let screenShake = 0;
    let deathOutroTimer = -1; // > 0 lets fallen protagonist skid & yelp visibly before modal opens
    let enemyTimer = 1.2;
    let obstacleTimer = 1.6;
    let pickupTimer = 0.7;

    let normalBones = 0;
    let greenBones = 0;
    let purpleBones = 0;
    let bandagesUsed = 0;
    let medkitsUsed = 0;
    let enemiesDefeated = 0;
    let shotsFired = 0;
    let bulletsClearedBySkill = 0;
    let damageTaken = 0;
    let p1DamageTaken = 0;
    let p1HitCount = 0;
    let maxCombo = 0;
    let jumpsPerformed = 0;

    // Silent blackout state
    let silentBlackoutsSurvived = 0;
    let blackoutBlindSeconds = 0;
    let wasInBlackout = false;
    let darknessAlpha = difficulty.darknessMode === 'dim_shadow' ? 0.76 : 0;

    // Dynamic Weather state
    let currentWeather: WeatherType = difficulty.tier >= 6 ? pickNextWeather('clear', difficulty.tier) : 'clear';
    let weatherTimer = difficulty.tier >= 4 ? 7 : 11;
    let weatherBlend = currentWeather === 'clear' ? 0 : 1;
    const weatherParticles: WeatherParticle[] = Array.from({ length: 110 }, () => ({
      x: Math.random() * LOGICAL_W,
      y: Math.random() * LOGICAL_H,
      vx: 0,
      vy: 0,
      size: 1.5 + Math.random() * 2.4,
      alpha: 0.45 + Math.random() * 0.45,
    }));

    let hudSyncTimer = 0;
    let snapshotSyncTimer = 0;
    let finished = false;
    const targetScrollDist = difficulty.targetDistanceMeters * 16;
    let finishNoticeShown = false;

    const addFloatText = (x: number, y: number, text: string, color: string) => {
      floatTexts.push({ x, y, vy: -36, text, color, life: 1.0 });
    };

    // Restore persisted active run progress if refreshing mid-game
    if (
      runKey === 1 &&
      !snapshotAppliedRef.current &&
      initialSnapshot &&
      initialSnapshot.mode === mode &&
      initialSnapshot.difficultyId === difficultyId &&
      initialSnapshot.p1CharacterId === p1CharacterId &&
      (!hasTwoPlayers || initialSnapshot.p2CharacterId === p2CharacterId) &&
      initialSnapshot.scrollDist > 16 &&
      initialSnapshot.scrollDist < targetScrollDist
    ) {
      scrollDist = initialSnapshot.scrollDist;
      elapsed = initialSnapshot.elapsed;
      riders[0].hp = Math.max(1, Math.min(riders[0].maxHp, initialSnapshot.p1Hp));
      riders[0].score = initialSnapshot.p1Score;
      if (riders[1]) {
        riders[1].hp = Math.max(1, Math.min(riders[1].maxHp, initialSnapshot.p2Hp));
        riders[1].score = initialSnapshot.p2Score;
      }
      normalBones = initialSnapshot.normalBones;
      greenBones = initialSnapshot.greenBones;
      purpleBones = initialSnapshot.purpleBones;
      bandagesUsed = initialSnapshot.bandagesUsed;
      medkitsUsed = initialSnapshot.medkitsUsed;
      enemiesDefeated = initialSnapshot.enemiesDefeated;
      shotsFired = initialSnapshot.shotsFired;
      bulletsClearedBySkill = initialSnapshot.bulletsClearedBySkill;
      damageTaken = initialSnapshot.damageTaken;
      p1DamageTaken = initialSnapshot.p1DamageTaken ?? initialSnapshot.damageTaken;
      p1HitCount = initialSnapshot.p1HitCount ?? 0;
      silentBlackoutsSurvived = initialSnapshot.silentBlackoutsSurvived;
      blackoutBlindSeconds = initialSnapshot.blackoutBlindSeconds;
      maxCombo = initialSnapshot.maxCombo;
      jumpsPerformed = initialSnapshot.jumpsPerformed;
      currentWeather = initialSnapshot.currentWeather;
      weatherBlend = currentWeather === 'clear' ? 0 : 1;
      addFloatText(LOGICAL_W * 0.5, ROAD_TOP + 26, '已恢复上次骑行进度', '#4BE39E');
    }
    snapshotAppliedRef.current = true;
    const initRunScore =
      mode === 'MULTIPLAYER'
        ? Math.max(riders[0].score, riders[1]?.score ?? 0)
        : riders[0].score + (riders[1]?.score ?? 0);
    let liveHighestRankLevel = getRankProgress(
      baseTotalBonesRef.current + normalBones + greenBones + purpleBones,
      baseTotalExpRef.current + initRunScore
    ).current.level;

    const saveCurrentSnapshot = () => {
      if (finished || !riders.some((r) => r.alive)) return;
      onSaveSnapshotRef.current({
        mode,
        difficultyId,
        p1CharacterId,
        p2CharacterId,
        scrollDist,
        elapsed,
        p1Hp: riders[0].hp,
        p1Score: riders[0].score,
        p2Hp: riders[1]?.hp ?? 0,
        p2Score: riders[1]?.score ?? 0,
        normalBones,
        greenBones,
        purpleBones,
        bandagesUsed,
        medkitsUsed,
        enemiesDefeated,
        shotsFired,
        bulletsClearedBySkill,
        damageTaken,
        p1DamageTaken,
        p1HitCount,
        silentBlackoutsSurvived,
        blackoutBlindSeconds,
        maxCombo,
        jumpsPerformed,
        currentWeather,
        savedAt: Date.now(),
      });
    };

    const onPageUnload = () => {
      saveCurrentSnapshot();
    };
    window.addEventListener('pagehide', onPageUnload);
    window.addEventListener('beforeunload', onPageUnload);

    const stampBloodSplatter = (x: number, y: number, radius: number) => {
      if (groundBloodSplatters.length > 750) {
        groundBloodSplatters.shift();
      }
      const clampedY = Math.max(ROAD_TOP + 6, Math.min(ROAD_BOTTOM - 6, y));
      const lobes = Array.from({ length: 10 }, () => 0.68 + Math.random() * 0.56);
      const dropCount = 3 + Math.floor(Math.random() * 4);
      const droplets = Array.from({ length: dropCount }, () => {
        const ang = Math.random() * Math.PI * 2;
        const dist = radius * (1.05 + Math.random() * 1.15);
        return {
          dx: Math.cos(ang) * dist,
          dy: Math.sin(ang) * dist,
          rx: 1.4 + Math.random() * 2.6,
          ry: 0.9 + Math.random() * 1.6,
          rot: ang,
        };
      });
      groundBloodSplatters.push({
        x,
        y: clampedY,
        radius,
        rotation: Math.random() * Math.PI * 2,
        lobes,
        droplets,
        freshness: 0.78 + Math.random() * 0.22,
      });
    };

    const spawnBloodSpray = (
      x: number,
      y: number,
      count: number,
      groundedImmediate = 0,
      dirX = 1
    ) => {
      for (let k = 0; k < count; k++) {
        const gy = Math.max(ROAD_TOP + 6, Math.min(ROAD_BOTTOM - 6, y + (Math.random() - 0.5) * 30));
        airBloodDroplets.push({
          x: x + (Math.random() - 0.5) * 16,
          groundY: gy,
          z: 10 + Math.random() * 20,
          vx: dirX * (55 + Math.random() * 175) + (Math.random() - 0.5) * 95,
          vy: (Math.random() - 0.5) * 115,
          vz: 75 + Math.random() * 155,
          size: 2.2 + Math.random() * 2.8,
          dark: Math.random() < 0.45,
        });
      }
      for (let k = 0; k < groundedImmediate; k++) {
        stampBloodSplatter(
          x + dirX * (Math.random() * 22) + (Math.random() - 0.5) * 32,
          y + (Math.random() - 0.5) * 26,
          5.5 + Math.random() * 6.5
        );
      }
    };

    const spawnBulletGroundSparks = (x: number, groundY: number, vx: number, _color: string) => {
      const sparkCount = 9 + Math.floor(Math.random() * 6);
      const dir = vx >= 0 ? 1 : -1;
      for (let k = 0; k < sparkCount; k++) {
        const sparkColor =
          k % 3 === 0 ? '#FEF08A' : k % 3 === 1 ? '#FB923C' : '#F97316';
        groundSparks.push({
          x,
          groundY,
          z: 1.5,
          vx: dir * (70 + Math.random() * 190) + (Math.random() - 0.5) * 90,
          vy: (Math.random() - 0.5) * 140,
          vz: 85 + Math.random() * 155,
          life: 0.22 + Math.random() * 0.24,
          maxLife: 0.45,
          color: sparkColor,
        });
      }
      // Subtle puff of impact dust/smoke on the asphalt
      smokePuffs.push({
        x,
        groundY,
        z: 2,
        vx: -25,
        vz: 18 + Math.random() * 14,
        radius: 6 + Math.random() * 4,
        life: 0.35,
        maxLife: 0.35,
        dark: false,
      });
      soundEngine.playSpark();
    };

    const stampBlastCrater = (x: number, y: number, radiusX: number, radiusY: number) => {
      const clampedY = Math.max(ROAD_TOP + 14, Math.min(ROAD_BOTTOM - 12, y));
      const rimOffsets = Array.from({ length: 12 }, () => 0.76 + Math.random() * 0.4);
      const crackCount = 5 + Math.floor(Math.random() * 3);
      const crackAngles = Array.from(
        { length: crackCount },
        (_, idx) => (idx / crackCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
      );
      const pebbles = Array.from({ length: 11 }, () => {
        const ang = Math.random() * Math.PI * 2;
        const dist = (0.35 + Math.random() * 0.85);
        return {
          dx: Math.cos(ang) * radiusX * dist,
          dy: Math.sin(ang) * radiusY * dist,
          r: 1.2 + Math.random() * 2.3,
          light: Math.random() < 0.45,
        };
      });
      groundCraters.push({
        x,
        y: clampedY,
        radiusX,
        radiusY,
        rimOffsets,
        crackAngles,
        pebbles,
      });
      if (groundCraters.length > 140) {
        groundCraters.shift();
      }
    };

    const detonateExplosive = (
      x: number,
      groundY: number,
      damage: number,
      fromPlayer: boolean,
      ownerId: 'P1' | 'P2' | undefined,
      isGrenade: boolean
    ) => {
      const blastY = Math.max(ROAD_TOP + 12, Math.min(ROAD_BOTTOM - 10, groundY));
      const blastRadius = isGrenade ? 78 : 70;

      // 1. Pockmark the asphalt with realistic deep blast craters (primary + satellite pockmarks)
      const mainRx = isGrenade ? 36 + Math.random() * 10 : 28 + Math.random() * 8;
      const mainRy = mainRx * 0.48;
      stampBlastCrater(x, blastY, mainRx, mainRy);
      if (isGrenade) {
        const subCount = 2 + Math.floor(Math.random() * 2);
        for (let k = 0; k < subCount; k++) {
          const ang = Math.random() * Math.PI * 2;
          const dist = mainRx * (0.65 + Math.random() * 0.45);
          const sr = 12 + Math.random() * 9;
          stampBlastCrater(x + Math.cos(ang) * dist, blastY + Math.sin(ang) * dist * 0.45, sr, sr * 0.5);
        }
      }

      // 2. Fireball, shockwave, sparks, flying asphalt rubble & rising smoke plumes
      explosionEffects.push({
        x,
        y: blastY,
        radius: blastRadius,
        life: 0.36,
        maxLife: 0.36,
      });
      for (let k = 0; k < 20; k++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 120 + Math.random() * 260;
        groundSparks.push({
          x,
          groundY: blastY,
          z: 3,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd * 0.48,
          vz: 130 + Math.random() * 240,
          life: 0.35 + Math.random() * 0.3,
          maxLife: 0.65,
          color: k % 2 === 0 ? '#FDE047' : '#FB923C',
        });
      }
      for (let k = 0; k < 11; k++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 65 + Math.random() * 155;
        rubbleChunks.push({
          x,
          groundY: blastY,
          z: 3,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd * 0.5,
          vz: 160 + Math.random() * 210,
          size: 3.5 + Math.random() * 4.5,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 14,
          life: 0.9 + Math.random() * 0.45,
          maxLife: 1.35,
        });
      }
      for (let k = 0; k < 7; k++) {
        smokePuffs.push({
          x: x + (Math.random() - 0.5) * 28,
          groundY: blastY + (Math.random() - 0.5) * 14,
          z: 6 + Math.random() * 14,
          vx: -35 + (Math.random() - 0.5) * 35,
          vz: 38 + Math.random() * 45,
          radius: 16 + Math.random() * 14,
          life: 0.75 + Math.random() * 0.45,
          maxLife: 1.2,
          dark: true,
        });
      }

      screenShake = Math.max(screenShake, isGrenade ? 9.5 : 6.5);
      soundEngine.playExplosion();

      // 3. Area blast damage
      const owner = riders.find((r) => r.id === ownerId) ?? riders[0];
      if (fromPlayer || isGrenade) {
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
          const e = enemies[ei];
          if (Math.hypot(e.x - x, e.y - blastY) <= blastRadius + 8) {
            if (damageEnemy(e, damage, fromPlayer ? owner : undefined)) {
              enemies.splice(ei, 1);
            }
          }
        }
      }
      if (!fromPlayer) {
        for (const r of riders) {
          if (r.alive && r.jumpOffset < 32 && Math.hypot(r.x - x, r.y - blastY) <= blastRadius) {
            damageRider(r, damage);
          }
        }
      } else if (mode === 'MULTIPLAYER') {
        for (const r of riders) {
          if (r.alive && r.id !== ownerId && Math.hypot(r.x - x, r.y - blastY) <= blastRadius + 6) {
            damageRider(r, damage, { isSkillHit: true, attacker: owner });
          }
        }
      }
    };

    const spawnBullet = (
      x: number,
      y: number,
      vx: number,
      vy: number,
      fromPlayer: boolean,
      opts?: Partial<Bullet>
    ) => {
      const isMortar = opts?.isMortar ?? false;
      const isGrenade = opts?.isGrenade ?? false;
      const z = opts?.z ?? (isMortar || isGrenade ? 22 : 17);
      const groundY = Math.max(
        ROAD_TOP + 8,
        Math.min(ROAD_BOTTOM - 6, opts?.groundY ?? y + z)
      );
      bullets.push({
        x,
        y: groundY - z,
        groundY,
        z,
        vx,
        vy,
        vz: opts?.vz ?? (isMortar || isGrenade ? 210 : -2 + (Math.random() - 0.5) * 5),
        gravity: opts?.gravity ?? (isMortar || isGrenade ? 620 : fromPlayer ? 54 : 38),
        fromPlayer,
        pierce: opts?.pierce ?? 1,
        isMortar,
        isGrenade,
        spin: Math.random() * Math.PI * 2,
        mortarLife: opts?.mortarLife ?? 1.4,
        damage: opts?.damage ?? 16,
        color: opts?.color ?? (fromPlayer ? '#F5C451' : '#EF4444'),
        radius: opts?.radius ?? 4.2,
        ownerId: opts?.ownerId,
      });
    };

    const triggerSkill = (rider: RiderEntity) => {
      if (!rider.alive || rider.skillCooldownLeft > 0) return;
      const coopSpeedBoost =
        mode === 'COOP' && riders.some((r) => r.alive && r.char.skillType === 'rally_whistle')
          ? 0.75
          : 1;
      rider.skillCooldownLeft = rider.char.skillCooldown * coopSpeedBoost;
      soundEngine.playSkill();

      // 多人对抗模式：寻找敌对骑手（可能是真人或 AI 操控）以便确定技能朝向与命中判定
      const rivalRider =
        mode === 'MULTIPLAYER' ? riders.find((r) => r.id !== rider.id && r.alive) : undefined;
      const dirToRivalX = rivalRider && rivalRider.x < rider.x - 18 ? -1 : 1;

      switch (rider.char.skillType) {
        case 'parcel_toss': {
          spawnBullet(rider.x + dirToRivalX * 28, rider.y - 16, dirToRivalX * 470, 0, true, {
            ownerId: rider.id,
            pierce: 3,
            damage: 45,
            color: '#D69445',
            radius: 9,
          });
          addFloatText(rider.x, rider.y - 54, '加急包裹!', '#E29D3E');
          break;
        }
        case 'brass_bell': {
          let cleared = 0;
          for (let i = bullets.length - 1; i >= 0; i--) {
            if (!bullets[i].fromPlayer) {
              const dx = bullets[i].x - rider.x;
              const dy = bullets[i].y - rider.y;
              if (Math.hypot(dx, dy) < 250) {
                bullets.splice(i, 1);
                cleared++;
              }
            }
          }
          bulletsClearedBySkill += cleared;
          zones.push({
            x: rider.x,
            y: rider.y - 12,
            radius: 240,
            life: 0.45,
            maxLife: 0.45,
            kind: 'bell_wave',
            ownerId: rider.id,
          });
          // 多人对抗：铜铃震波近距离也会震伤对手（真人或 AI）
          if (rivalRider && Math.hypot(rivalRider.x - rider.x, rivalRider.y - rider.y) <= 240) {
            damageRider(rivalRider, 26, { isSkillHit: true, attacker: rider });
          }
          addFloatText(rider.x, rider.y - 54, `铜铃震波 ×${cleared}`, '#67B8E3');
          break;
        }
        case 'paper_fan': {
          for (const angle of [-0.22, 0, 0.22]) {
            const baseAngle = dirToRivalX < 0 ? Math.PI + angle : angle;
            spawnBullet(
              rider.x + dirToRivalX * 24,
              rider.y - 18,
              Math.cos(baseAngle) * 520,
              Math.sin(baseAngle) * 520,
              true,
              {
                ownerId: rider.id,
                pierce: 1,
                damage: 34,
                color: '#F2EFE9',
                radius: 6,
              }
            );
          }
          addFloatText(rider.x, rider.y - 54, '三连晨报!', '#F2EFE9');
          break;
        }
        case 'iron_mudguard': {
          rider.shieldTimer = 3.2;
          addFloatText(rider.x, rider.y - 54, '铁皮护盾 3s', '#5AC88E');
          break;
        }
        case 'soup_slick': {
          // 多人对抗：泼出的热汤滑渍区域会减速并烫伤踩中的真人或 AI 对手
          zones.push({
            x: rider.x - 10,
            y: rider.y,
            radius: 85,
            life: 3.5,
            maxLife: 3.5,
            kind: 'soup_slick',
            ownerId: rider.id,
          });
          if (rivalRider && Math.hypot(rivalRider.x - rider.x, rivalRider.y - rider.y) < 135) {
            rivalRider.slowTimer = 2.2;
            damageRider(rivalRider, 24, { isSkillHit: true, attacker: rider });
          }
          addFloatText(rider.x, rider.y - 54, '热汤滑渍!', '#E8A829');
          break;
        }
        case 'gravel_spray': {
          const angles =
            mode === 'MULTIPLAYER' ? [-0.3, -0.1, 0.1, 0.3, Math.PI - 0.18, Math.PI + 0.18] : [-0.3, -0.1, 0.1, 0.3];
          for (const angle of angles) {
            spawnBullet(rider.x + Math.cos(angle) * 18, rider.y - 14, Math.cos(angle) * 430, Math.sin(angle) * 430, true, {
              ownerId: rider.id,
              damage: 26,
              color: '#9CA3AF',
              radius: 5.5,
            });
          }
          addFloatText(rider.x, rider.y - 54, '碎石喷溅!', '#9CA3AF');
          break;
        }
        case 'confetti_pull': {
          for (const p of pickups) {
            if (p.x > rider.x - 40 && p.x < rider.x + 480) {
              p.magnetizedTo = rider.id;
            }
          }
          // 多人对抗：拉响礼花的同时向四周迸射礼花爆裂弹，命中对手可扣血
          if (mode === 'MULTIPLAYER') {
            for (let k = 0; k < 6; k++) {
              const a = (k / 6) * Math.PI * 2;
              spawnBullet(rider.x + Math.cos(a) * 16, rider.y - 16, Math.cos(a) * 450, Math.sin(a) * 450, true, {
                ownerId: rider.id,
                damage: 24,
                color: '#FF6B7D',
                radius: 5.5,
              });
            }
          }
          addFloatText(rider.x, rider.y - 54, '礼花抢骨!', '#FF6B7D');
          break;
        }
        case 'slipstream_dash': {
          rider.dashTimer = 2.1;
          rider.shieldTimer = Math.max(rider.shieldTimer, 1.8);
          // 多人对抗：抽车冲刺瞬间朝对手方向劈出一道破风气刃
          if (mode === 'MULTIPLAYER') {
            spawnBullet(rider.x + dirToRivalX * 26, rider.y - 16, dirToRivalX * 560, 0, true, {
              ownerId: rider.id,
              pierce: 2,
              damage: 28,
              color: '#67B8E3',
              radius: 7,
            });
          }
          addFloatText(rider.x, rider.y - 54, '破风抽车冲刺!', '#67B8E3');
          break;
        }
        case 'field_bandage_zone': {
          zones.push({
            x: rider.x + 25,
            y: rider.y,
            radius: 95,
            life: 4.5,
            maxLife: 4.5,
            kind: 'heal_zone',
            ownerId: rider.id,
          });
          addFloatText(rider.x, rider.y - 54, '急救区展开', '#489B82');
          break;
        }
        case 'steel_umbrella': {
          for (const r of riders) {
            if (r.alive && (mode !== 'MULTIPLAYER' || r.id === rider.id)) {
              r.shieldTimer = Math.max(r.shieldTimer, 3.5);
            }
          }
          addFloatText(rider.x, rider.y - 54, mode === 'MULTIPLAYER' ? '钢伞自保盾!' : '双人钢伞盾!', '#67B8E3');
          break;
        }
        case 'rally_whistle': {
          for (const r of riders) {
            if (r.alive && (mode !== 'MULTIPLAYER' || r.id === rider.id)) {
              r.whistleTimer = 4.5;
              r.dashTimer = Math.max(r.dashTimer, 1.4);
            }
          }
          addFloatText(rider.x, rider.y - 54, '鼓舞加速哨!', '#E29D3E');
          break;
        }
        case 'warm_biscuit': {
          for (const r of riders) {
            if (r.alive && (mode !== 'MULTIPLAYER' || r.id === rider.id)) {
              r.hp = Math.min(r.maxHp, r.hp + 15);
            }
          }
          soundEngine.playHeal(false);
          addFloatText(rider.x, rider.y - 54, '热饼 +15HP', '#5AC88E');
          break;
        }
        case 'mg_overclock': {
          rider.dashTimer = 2.8;
          for (let i = -2; i <= 2; i++) {
            spawnBullet(rider.x + dirToRivalX * 32, rider.y - 18, dirToRivalX * 640, i * 75, true, {
              ownerId: rider.id,
              damage: 25,
              color: '#F5C451',
              radius: 4.5,
            });
            shotsFired++;
          }
          addFloatText(rider.x, rider.y - 54, '过热弹雨倾泻!', '#E29D3E');
          break;
        }
        case 'rangefinder_mark': {
          for (const e of enemies) e.markedTimer = 6.0;
          for (let i = 0; i < 3; i++) {
            spawnBullet(rider.x + dirToRivalX * (34 + i * 16), rider.y - 18, dirToRivalX * 760, 0, true, {
              ownerId: rider.id,
              pierce: 3,
              damage: 45,
              color: '#7DD3FC',
              radius: 5,
            });
            shotsFired++;
          }
          addFloatText(rider.x, rider.y - 54, '测距双倍穿甲!', '#7DD3FC');
          break;
        }
        case 'mortar_salvo': {
          for (const offset of [-32, 0, 32]) {
            spawnBullet(
              rider.x + dirToRivalX * 20,
              rider.y - 22,
              dirToRivalX * (310 + Math.abs(offset) * 2.2),
              offset * 1.4,
              true,
              {
                ownerId: rider.id,
                groundY: rider.y + offset * 0.4,
                z: 24,
                vz: 225 + Math.abs(offset) * 1.1,
                gravity: 630,
                isMortar: true,
                isGrenade: true,
                mortarLife: 1.5,
                damage: 55,
                color: '#F97316',
                radius: 7,
              }
            );
            shotsFired++;
          }
          addFloatText(rider.x, rider.y - 54, '三连手榴弹齐射!', '#F97316');
          break;
        }
        case 'armored_ram': {
          rider.dashTimer = 2.0;
          rider.shieldTimer = Math.max(rider.shieldTimer, 2.0);
          for (let i = -1; i <= 1; i++) {
            spawnBullet(rider.x + dirToRivalX * 32, rider.y - 16, dirToRivalX * 560, i * 95, true, {
              ownerId: rider.id,
              damage: 30,
              color: '#FBBF24',
              radius: 5,
            });
            shotsFired++;
          }
          addFloatText(rider.x, rider.y - 54, '铁甲冲锋!', '#FBBF24');
          break;
        }
      }
    };

    const throwPlayerGrenade = (rider: RiderEntity) => {
      if (!rider.alive || rider.grenadeCooldownLeft > 0) return;
      rider.grenadeCooldownLeft = 2.2;
      soundEngine.playSkill();
      spawnBullet(rider.x + 22, rider.y - 24, 340, (Math.random() - 0.5) * 32, true, {
        ownerId: rider.id,
        groundY: rider.y,
        z: 24,
        vz: 245,
        gravity: 640,
        isGrenade: true,
        isMortar: true,
        mortarLife: 1.5,
        damage: 70,
        color: '#F97316',
        radius: 6.5,
      });
      shotsFired++;
      addFloatText(rider.x, rider.y - 52, '投掷手榴弹!', '#FB923C');
    };

    const firePlayerWeapon = (rider: RiderEntity) => {
      if (!rider.alive || rider.char.weaponStyle === 'none') return;
      const rate = (rider.char.fireRate ?? 4) * (rider.dashTimer > 0 ? 1.5 : 1);
      if (rider.fireCooldown > 0) return;
      rider.fireCooldown = 1 / rate;

      const style = rider.char.weaponStyle;
      soundEngine.playShoot(style);

      if (style === 'twin_mg') {
        const offset = (Math.random() - 0.5) * 28;
        spawnBullet(rider.x + 34, rider.y - 18, 660, offset, true, {
          ownerId: rider.id,
          groundY: rider.y,
          z: 18,
          damage: 18,
          color: '#F5C451',
          radius: 4,
        });
        shotsFired++;
      } else if (style === 'piercing_carbine') {
        spawnBullet(rider.x + 36, rider.y - 18, 780, 0, true, {
          ownerId: rider.id,
          groundY: rider.y,
          z: 18,
          pierce: 2,
          damage: 34,
          color: '#7DD3FC',
          radius: 4.5,
        });
        shotsFired++;
      } else if (style === 'flak_mortar') {
        spawnBullet(rider.x + 22, rider.y - 24, 355, (Math.random() - 0.5) * 35, true, {
          ownerId: rider.id,
          groundY: rider.y,
          z: 24,
          vz: 235,
          gravity: 620,
          isMortar: true,
          isGrenade: true,
          mortarLife: 1.5,
          damage: 48,
          color: '#FB923C',
          radius: 6.5,
        });
        shotsFired++;
      } else if (style === 'scatter_carbine') {
        for (const vy of [-75, 0, 75]) {
          spawnBullet(rider.x + 32, rider.y - 17, 560, vy, true, {
            ownerId: rider.id,
            groundY: rider.y,
            z: 17,
            damage: 16,
            color: '#FDE047',
            radius: 3.8,
          });
          shotsFired++;
        }
      }
    };

    const rollPickupType = (): PickupType => {
      const r = Math.random();
      let acc = difficulty.medkitChance;
      if (r < acc) return 'medkit';
      acc += difficulty.bandageChance;
      if (r < acc) return 'bandage';
      acc += difficulty.purpleBoneChance;
      if (r < acc) return 'bone_purple';
      acc += difficulty.greenBoneChance;
      if (r < acc) return 'bone_green';
      return 'bone_normal';
    };

    const spawnFallenCyclist = (
      x: number,
      y: number,
      z: number,
      character: CharacterDef,
      opts?: { isAxisEnemy?: boolean; isProtagonist?: boolean; label?: string; pitchScale?: number }
    ) => {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const isProtag = Boolean(opts?.isProtagonist);
      fallenCyclists.push({
        x,
        y,
        z: Math.max(0, z),
        vx: isProtag ? 185 : 110 + Math.random() * 60,
        vy: dir * (38 + Math.random() * 44),
        vz: 145 + Math.random() * 65,
        angle: 0,
        targetAngle: dir * (1.32 + Math.random() * 0.14),
        angularVel: dir * (4.6 + Math.random() * 2.2),
        skidDist: 0,
        wheelSpin: Math.random() * Math.PI * 2,
        wheelSpinVel: 14,
        bounces: 0,
        life: isProtag ? 8.0 : 5.5,
        character,
        isAxisEnemy: Boolean(opts?.isAxisEnemy),
        label: opts?.label,
      });
      soundEngine.playDeathYelp(opts?.pitchScale ?? (0.9 + Math.random() * 0.25));
    };

    const damageEnemy = (e: EnemyCyclist, dmg: number, killerRider?: RiderEntity) => {
      e.hp -= dmg;
      // 打中其他车手时四溅真实血花，并在路面留下不消失的血渍
      const isHeavyAxis = mode === 'AXIS_INVASION';
      const sprayCount = e.hp <= 0 ? (isHeavyAxis ? 32 : 20) : isHeavyAxis ? 14 : 9;
      const groundPoolCount = e.hp <= 0 ? (isHeavyAxis ? 7 : 4) : isHeavyAxis ? 3 : 2;
      spawnBloodSpray(e.x, e.y, sprayCount, groundPoolCount, killerRider ? 1 : -1);
      if (e.hp > 0) {
        soundEngine.playHurtYelp(0.95 + Math.random() * 0.2);
        addFloatText(e.x, e.y - 42, `-${Math.round(dmg)}`, '#FCA5A5');
        return false;
      }
      enemiesDefeated++;
      if (killerRider) {
        const markMult = e.markedTimer > 0 ? 2 : 1;
        const pts = Math.round((e.isAxis ? 55 : 40) * difficulty.scoreMultiplier * markMult);
        killerRider.score += pts;
        killerRider.combo++;
        killerRider.comboTimer = 3.5;
        maxCombo = Math.max(maxCombo, killerRider.combo);
        addFloatText(e.x, e.y - 34, `+${pts}`, '#F5C451');
      } else {
        addFloatText(e.x, e.y - 34, '翻车倒下!', '#F87171');
      }
      spawnFallenCyclist(e.x, e.y, 6, e.char, {
        isAxisEnemy: e.isAxis,
        label: e.isAxis ? '轴心倒地' : '翻车',
        pitchScale: 0.88 + Math.random() * 0.28,
      });
      return true;
    };

    const damageRider = (
      rider: RiderEntity,
      rawDmg: number,
      opts?: { isSkillHit?: boolean; attacker?: RiderEntity }
    ) => {
      if (!rider.alive || rider.hurtFlash > 0) return;
      if (rider.shieldTimer > 0) {
        bulletsClearedBySkill++;
        addFloatText(rider.x, rider.y - 50, '格挡!', '#5AC88E');
        rider.hurtFlash = 0.25;
        return;
      }
      if (rider.char.id === 'axis_grei_armored' && rider.armoredFrontCooldown <= 0) {
        rider.armoredFrontCooldown = 10.0;
        addFloatText(rider.x, rider.y - 50, '铁甲偏转!', '#94A3B8');
        rider.hurtFlash = 0.4;
        return;
      }
      // 多人对抗：技能命中真人或 AI 时直接扣除对应技能血量，不受超低难度减伤削弱
      const actualDmg = opts?.isSkillHit
        ? Math.max(15, Math.round(rawDmg * Math.max(0.85, difficulty.damageMultiplier)))
        : Math.max(4, Math.round(rawDmg * difficulty.damageMultiplier));

      rider.hp = Math.max(0, rider.hp - actualDmg);
      rider.hurtFlash = 0.75;
      rider.combo = 0;
      damageTaken += actualDmg;
      spawnBloodSpray(rider.x, rider.y, rider.hp <= 0 ? 24 : 11, rider.hp <= 0 ? 5 : 2, -1);
      if (rider.id === 'P1') {
        p1DamageTaken += actualDmg;
        p1HitCount++;
      }

      const isAiTarget = rider.id === 'P2' && p2IsAiRef.current;
      const targetLabel = isAiTarget ? `${rider.id}(AI)` : `${rider.id}(真人)`;

      if (opts?.attacker) {
        const hitBonus = Math.round(30 * difficulty.scoreMultiplier);
        opts.attacker.score += hitBonus;
        addFloatText(rider.x, rider.y - 50, `技能命中 -${actualDmg} HP`, '#FB923C');
      } else {
        addFloatText(rider.x, rider.y - 50, `-${actualDmg} HP`, '#F87171');
      }

      // 多人对抗：如果真人或 AI 血量归 0，触发真实翻车倒下动画并播放狗惨叫声
      if (rider.hp <= 0) {
        rider.alive = false;
        rider.diedAtDist = scrollDist / 16;
        rider.diedAtTime = elapsed;
        if (opts?.attacker) {
          opts.attacker.score += Math.round(100 * difficulty.scoreMultiplier);
        }
        spawnFallenCyclist(rider.x, rider.y, rider.jumpOffset, rider.char, {
          isAxisEnemy: rider.char.category === 'AXIS_INVASION',
          isProtagonist: true,
          label: `${targetLabel} 倒地!`,
          pitchScale: rider.id === 'P1' ? 0.96 : 1.12,
        });
        addFloatText(rider.x, rider.y - 68, `${targetLabel} 倒地惨叫!`, '#EF4444');
      } else if (opts?.isSkillHit) {
        soundEngine.playHurtYelp(rider.id === 'P1' ? 0.96 : 1.08);
        soundEngine.playHit();
      } else {
        soundEngine.playHit();
      }
    };

    const updateAiRider = (rider: RiderEntity, dt: number) => {
      // Find nearest threat ahead
      let targetVy = 0;
      let shouldJump = false;

      const nearestObs = obstacles.find((o) => o.x > rider.x - 10 && o.x < rider.x + 160 && Math.abs(o.y - rider.y) < 34);
      const nearestBullet = bullets.find((b) => !b.fromPlayer && b.x > rider.x && b.x < rider.x + 170 && Math.abs(b.y - rider.y) < 32);
      const rival = mode === 'MULTIPLAYER' ? riders.find((r) => r.id !== rider.id && r.alive) : undefined;

      if (nearestObs) {
        if (nearestObs.kind !== 'puddle' && rider.isGrounded && Math.random() < 0.7) {
          shouldJump = true;
        } else {
          targetVy = rider.y > (ROAD_TOP + ROAD_BOTTOM) / 2 ? -1 : 1;
        }
      } else if (nearestBullet) {
        targetVy = nearestBullet.y > rider.y ? -1 : 1;
      } else if (rival && rider.skillCooldownLeft <= 0.3 && Math.abs(rival.y - rider.y) > 22) {
        // 多人对抗中 AI 技能就绪时主动贴近对手车道准备释放技能
        targetVy = rival.y > rider.y ? 1 : -1;
      } else {
        // Chase best pickup
        const bestPickup = pickups
          .filter((p) => p.x > rider.x && p.x < rider.x + 350)
          .sort((a, b) => Math.hypot(a.x - rider.x, a.y - rider.y) - Math.hypot(b.x - rider.x, b.y - rider.y))[0];
        if (bestPickup && Math.abs(bestPickup.y - rider.y) > 12) {
          targetVy = bestPickup.y > rider.y ? 1 : -1;
        }
      }

      const speedFactor = 180 + rider.char.stats.handling * 16;
      rider.vy = targetVy * speedFactor * 0.85;
      rider.y += rider.vy * dt;
      rider.x += Math.sin(elapsed * 1.4) * 20 * dt;

      if (shouldJump && rider.isGrounded) {
        rider.jumpVel = 365;
        rider.isGrounded = false;
        jumpsPerformed++;
      }

      const rivalInSights = Boolean(
        rival && Math.abs(rival.y - rider.y) < 55 && Math.abs(rival.x - rider.x) < 320
      );
      if (
        rider.skillCooldownLeft <= 0 &&
        (rivalInSights || nearestBullet || enemies.length > 1 || (mode === 'COOP' && rider.hp < 75))
      ) {
        triggerSkill(rider);
      }
    };

    let lastTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (playStateRef.current !== 'PLAYING' || finished) {
        justPressed.clear();
        return;
      }

      elapsed += dt;

      // Dynamic Weather Cycling & Particle Simulation
      weatherTimer -= dt;
      if (weatherTimer <= 0) {
        currentWeather = pickNextWeather(currentWeather, difficulty.tier);
        weatherTimer = 15 + Math.random() * 7;
        weatherBlend = currentWeather === 'clear' ? 0 : 0.12;
        const meta = WEATHER_META[currentWeather];
        addFloatText(LOGICAL_W * 0.5, ROAD_TOP - 18, `天气变化：${meta.label}`, meta.accentColor);
      }
      if (currentWeather === 'clear') {
        weatherBlend = Math.max(0, weatherBlend - dt * 0.45);
      } else {
        weatherBlend = Math.min(1, weatherBlend + dt * 0.45);
      }
      const p1WeatherPhys = getWeatherPhysics(currentWeather, weatherBlend, difficulty, elapsed, p1Char.id);
      const weatherIntensity = p1WeatherPhys.visualIntensity;

      if (currentWeather === 'rain' || currentWeather === 'snow') {
        const countLimit = Math.round(weatherParticles.length * Math.max(0.3, weatherIntensity));
        for (let i = 0; i < countLimit; i++) {
          const p = weatherParticles[i];
          if (currentWeather === 'rain') {
            p.x -= (260 + difficulty.roadSpeed * 0.35) * dt;
            p.y += 590 * dt;
          } else {
            // Wind-driven snow
            p.x -= (155 + Math.sin(elapsed * 1.4 + i) * 45) * dt;
            p.y += (85 + p.size * 22 + Math.cos(elapsed * 0.9 + i) * 18) * dt;
          }
          if (p.y > LOGICAL_H + 10) {
            p.y = -10;
            p.x = Math.random() * (LOGICAL_W + 180);
          }
          if (p.x < -30) {
            p.x = LOGICAL_W + Math.random() * 40;
          }
        }
      }

      const anyPlayerAliveAtStart = riders.some((r) => r.alive);
      const roadSpeed = anyPlayerAliveAtStart ? difficulty.roadSpeed : difficulty.roadSpeed * 0.12;
      scrollDist += roadSpeed * dt;

      // Silent difficulty cyclic darkness: "寂静他过一会儿就会暗"
      let silentStatus = '';
      if (difficulty.darknessMode === 'cyclic_blackout') {
        // 22s repeating cycle:
        // 0..7s: Dusk (0.25)
        // 7..9s: Transition to Blackout (0.25 -> 0.96)
        // 9..19s: Deep Blackout (0.96)
        // 19..22s: Brief dawn lift (0.96 -> 0.25)
        const cycle = elapsed % 22;
        if (cycle < 7) {
          darknessAlpha = 0.25;
          silentStatus = `微光窗口 · 距变暗 ${(7 - cycle).toFixed(1)}s`;
          if (wasInBlackout) {
            wasInBlackout = false;
            silentBlackoutsSurvived++;
            soundEngine.playBlackoutShift(false);
          }
        } else if (cycle < 9) {
          const t = (cycle - 7) / 2;
          darknessAlpha = 0.25 + t * (0.96 - 0.25);
          silentStatus = '寂静暗幕降临中...';
          if (!wasInBlackout && t > 0.5) {
            wasInBlackout = true;
            soundEngine.playBlackoutShift(true);
          }
        } else if (cycle < 19) {
          darknessAlpha = 0.96;
          blackoutBlindSeconds += dt;
          silentStatus = `寂静全黑 · 保持照明 ${(19 - cycle).toFixed(1)}s`;
        } else {
          const t = (cycle - 19) / 3;
          darknessAlpha = 0.96 - t * (0.96 - 0.25);
          silentStatus = '黎明微光回升...';
        }
      } else if (difficulty.darknessMode === 'dim_shadow') {
        darknessAlpha = 0.78;
        silentStatus = '暗影暮色 · 车灯索路';
      } else {
        darknessAlpha = 0;
      }

      // Tutorial road hints
      let tutorialHint = '';
      if (difficultyId === 'tutorial') {
        if (elapsed < 7) tutorialHint = '操作指引：使用 W/S 或 ↑/↓ 上下变道，A/D 调整前后站位';
        else if (elapsed < 14) tutorialHint = '操作指引：遇到木箱与路障时，按「空格 Space」蹬车跃起！';
        else if (elapsed < 21) tutorialHint = '操作指引：按「F」释放专属技能（如震碎子弹、抛掷包裹或治疗）';
        else if (elapsed < 29) tutorialHint = '计分法则：绿骨头 = +2倍 (30分) · 紫骨头 = +6.5倍 (75分)';
        else tutorialHint = '高难度提示：「困难」起会出现战地绷带与医疗包，「寂静」会周期变黑！';
      }

      // Check Tow Mastiff & Medic Retriever Coop Passives
      const mastiff = mode === 'COOP' ? riders.find((r) => r.alive && r.char.id === 'coop_tow_mastiff') : undefined;
      const medic = mode === 'COOP' ? riders.find((r) => r.alive && r.char.id === 'coop_medic_retriever') : undefined;
      if (medic) {
        for (const r of riders) {
          if (r.id !== medic.id && r.alive && Math.hypot(r.x - medic.x, r.y - medic.y) < 135) {
            r.hp = Math.min(r.maxHp, r.hp + 2.6 * dt);
          }
        }
      }

      // Update Riders
      for (const rider of riders) {
        if (!rider.alive) continue;

        rider.skillCooldownLeft = Math.max(0, rider.skillCooldownLeft - dt);
        rider.grenadeCooldownLeft = Math.max(0, rider.grenadeCooldownLeft - dt);
        rider.shieldTimer = Math.max(0, rider.shieldTimer - dt);
        rider.dashTimer = Math.max(0, rider.dashTimer - dt);
        rider.whistleTimer = Math.max(0, rider.whistleTimer - dt);
        rider.slowTimer = Math.max(0, rider.slowTimer - dt);
        rider.hurtFlash = Math.max(0, rider.hurtFlash - dt);
        rider.fireCooldown = Math.max(0, rider.fireCooldown - dt);
        rider.armoredFrontCooldown = Math.max(0, rider.armoredFrontCooldown - dt);

        if (rider.comboTimer > 0) {
          rider.comboTimer -= dt;
          if (rider.comboTimer <= 0) rider.combo = 0;
        }

        // Workshop Dalmatian passive self-repair
        if (rider.char.id === 'solo_workshop_dalmatian') {
          rider.selfRepairTimer += dt;
          if (rider.selfRepairTimer >= 15) {
            rider.selfRepairTimer = 0;
            rider.hp = Math.min(rider.maxHp, rider.hp + 6);
            addFloatText(rider.x, rider.y - 45, '自检 +6HP', '#5AC88E');
          }
        }

        // Input handling
        if (rider.id === 'P2' && p2IsAiRef.current) {
          updateAiRider(rider, dt);
        } else {
          let moveX = 0;
          let moveY = 0;
          if (rider.id === 'P1') {
            const allowArrows = !hasTwoPlayers;
            if (keys.has('KeyW') || (allowArrows && keys.has('ArrowUp'))) moveY -= 1;
            if (keys.has('KeyS') || (allowArrows && keys.has('ArrowDown'))) moveY += 1;
            if (keys.has('KeyA') || (allowArrows && keys.has('ArrowLeft'))) moveX -= 1;
            if (keys.has('KeyD') || (allowArrows && keys.has('ArrowRight'))) moveX += 1;

            if ((justPressed.has('Space') || justPressed.has('KeyK')) && rider.isGrounded) {
              const bonus = rider.char.id === 'mp_trail_doberman' ? 1.18 : 1.0;
              rider.jumpVel = 385 * bonus * (rider.whistleTimer > 0 ? 1.12 : 1);
              rider.isGrounded = false;
              jumpsPerformed++;
              soundEngine.playJump();
            }
            if (justPressed.has('KeyF') || justPressed.has('ShiftLeft') || justPressed.has('KeyE')) {
              triggerSkill(rider);
            }
            if (justPressed.has('KeyG')) {
              throwPlayerGrenade(rider);
            }
            if (rider.char.infiniteAmmo && (autoFireRef.current || keys.has('KeyJ') || mouseFiring)) {
              firePlayerWeapon(rider);
            }
          } else {
            // P2 Controls
            if (keys.has('ArrowUp')) moveY -= 1;
            if (keys.has('ArrowDown')) moveY += 1;
            if (keys.has('ArrowLeft')) moveX -= 1;
            if (keys.has('ArrowRight')) moveX += 1;

            if ((justPressed.has('Enter') || justPressed.has('Slash') || justPressed.has('ShiftRight')) && rider.isGrounded) {
              const bonus = rider.char.id === 'mp_trail_doberman' ? 1.18 : 1.0;
              rider.jumpVel = 385 * bonus * (rider.whistleTimer > 0 ? 1.12 : 1);
              rider.isGrounded = false;
              jumpsPerformed++;
              soundEngine.playJump();
            }
            if (justPressed.has('KeyL') || justPressed.has('Period')) {
              triggerSkill(rider);
            }
          }

          // Slipstream passive for Greyhound
          let speedBonus = 1;
          if (rider.char.id === 'mp_track_greyhound') {
            const drafting = [...riders, ...enemies].some(
              (o) => (o as RiderEntity).id !== rider.id && Math.abs(o.y - rider.y) < 35 && o.x > rider.x && o.x - rider.x < 160
            );
            if (drafting) speedBonus = 1.22;
          }
          if (rider.dashTimer > 0) speedBonus *= 1.35;
          if (rider.whistleTimer > 0) speedBonus *= 1.2;
          if (rider.slowTimer > 0) speedBonus *= 0.62;

          const riderWeather = getWeatherPhysics(
            currentWeather,
            weatherBlend,
            difficulty,
            elapsed,
            rider.char.id
          );
          const baseMoveSpeed =
            (165 + rider.char.stats.speed * 15) * speedBonus * riderWeather.speedScale;
          const handlingSpeed =
            (175 + rider.char.stats.handling * 16) * speedBonus * riderWeather.speedScale;

          const targetVx = moveX * baseMoveSpeed;
          const targetVy = moveY * handlingSpeed + riderWeather.crosswindVy;
          const lerpAlpha = Math.min(1, riderWeather.steeringResponse * dt);

          rider.vx += (targetVx - rider.vx) * lerpAlpha;
          rider.vy += (targetVy - rider.vy) * lerpAlpha;
          rider.x += rider.vx * dt;
          rider.y += rider.vy * dt;
          rider.leanAngle = (rider.vy / Math.max(120, handlingSpeed)) * 0.1;
        }

        // Clamp within road bounds
        rider.x = Math.max(64, Math.min(LOGICAL_W * 0.52, rider.x));
        rider.y = Math.max(ROAD_TOP + 22, Math.min(ROAD_BOTTOM - 16, rider.y));

        // Jump physics
        if (!rider.isGrounded) {
          rider.jumpOffset += rider.jumpVel * dt;
          rider.jumpVel -= 1080 * dt;
          if (rider.jumpOffset <= 0) {
            rider.jumpOffset = 0;
            rider.jumpVel = 0;
            rider.isGrounded = true;
          }
        }

        rider.pedalPhase += dt * (8.5 + rider.char.stats.speed * 0.45) * (rider.dashTimer > 0 ? 1.45 : 1);
      }

      const finishGateX = 165 + (targetScrollDist - scrollDist);
      const nearFinish = finishGateX < LOGICAL_W + 300;
      if (nearFinish && !finishNoticeShown) {
        finishNoticeShown = true;
        addFloatText(LOGICAL_W * 0.55, ROAD_TOP + 26, '前方接近终点线！全力冲刺！', '#5AC88E');
      }

      // Spawn Pickups (pause near final 30m)
      pickupTimer -= dt;
      if (pickupTimer <= 0 && !nearFinish) {
        pickupTimer = mode === 'MULTIPLAYER' ? 0.65 : 0.88;
        const type = rollPickupType();
        pickups.push({
          uid: uidCounter++,
          x: LOGICAL_W + 40,
          y: ROAD_TOP + 28 + Math.random() * (ROAD_BOTTOM - ROAD_TOP - 52),
          type,
        });
      }

      // Spawn Obstacles (clear final stretch before finish arch)
      obstacleTimer -= dt;
      if (obstacleTimer <= 0 && !nearFinish) {
        const baseInterval = 1 / Math.max(0.18, difficulty.obstacleSpawnRate);
        obstacleTimer = baseInterval * (0.7 + Math.random() * 0.65);
        const kinds: ('crate' | 'barricade' | 'puddle')[] = ['crate', 'barricade', 'puddle'];
        obstacles.push({
          uid: uidCounter++,
          x: LOGICAL_W + 50,
          y: ROAD_TOP + 32 + Math.random() * (ROAD_BOTTOM - ROAD_TOP - 60),
          kind: kinds[Math.floor(Math.random() * kinds.length)],
        });
      }

      // Spawn Enemy / Rival / Axis Patrol Cyclists
      enemyTimer -= dt;
      if (enemyTimer <= 0 && !nearFinish) {
        const rate = mode === 'AXIS_INVASION' ? difficulty.enemySpawnRate * 1.45 : difficulty.enemySpawnRate;
        enemyTimer = (1 / Math.max(0.2, rate)) * (0.75 + Math.random() * 0.55);

        const isAxis =
          mode === 'AXIS_INVASION'
            ? Math.random() < 0.38 // Axis defenders + Allied targets!
            : Math.random() < difficulty.axisPatrolChance;

        const isAlliedTarget = mode === 'AXIS_INVASION' && !isAxis;
        const pool = isAxis
          ? allCharacters.filter((c) => c.category === 'AXIS_INVASION')
          : allCharacters.filter((c) => c.category !== 'AXIS_INVASION');
        const pickedChar = pool[Math.floor(Math.random() * pool.length)] ?? allCharacters[0];

        const spawnX = LOGICAL_W + 55;
        const spawnY = ROAD_TOP + 30 + Math.random() * (ROAD_BOTTOM - ROAD_TOP - 56);
        enemies.push({
          uid: uidCounter++,
          x: spawnX,
          y: spawnY,
          speedX: isAlliedTarget ? roadSpeed * 0.42 : roadSpeed * (0.48 + Math.random() * 0.25),
          hp: isAxis ? 52 : 34,
          maxHp: isAxis ? 52 : 34,
          isAxis,
          isAlliedTarget,
          char: pickedChar,
          pedalPhase: Math.random() * 6,
          fireTimer: 0.7 + Math.random() * 0.9,
          grenadeTimer: 2.2 + Math.random() * 2.8,
          bleedTimer: 0.14,
          slowTimer: 0,
          markedTimer: 0,
        });
      }

      // Update Zones
      for (let i = zones.length - 1; i >= 0; i--) {
        const z = zones[i];
        z.life -= dt;
        if (z.kind === 'heal_zone') {
          for (const r of riders) {
            if (r.alive && (mode !== 'MULTIPLAYER' || r.id === z.ownerId) && Math.hypot(r.x - z.x, r.y - z.y) <= z.radius) {
              r.hp = Math.min(r.maxHp, r.hp + 7.5 * dt);
            }
          }
        } else if (z.kind === 'soup_slick') {
          z.x -= roadSpeed * 0.5 * dt;
          for (const e of enemies) {
            if (Math.hypot(e.x - z.x, e.y - z.y) <= z.radius) {
              e.slowTimer = 1.5;
            }
          }
          // 多人对抗：对方真人或 AI 踩中热汤滑渍区域会减速并扣除血量
          if (mode === 'MULTIPLAYER') {
            const caster = riders.find((r) => r.id === z.ownerId);
            for (const r of riders) {
              if (r.alive && r.id !== z.ownerId && r.jumpOffset < 16 && Math.hypot(r.x - z.x, r.y - z.y) <= z.radius) {
                r.slowTimer = Math.max(r.slowTimer, 1.5);
                damageRider(r, 20, { isSkillHit: true, attacker: caster });
              }
            }
          }
        }
        if (z.life <= 0) zones.splice(i, 1);
      }

      // 多人对抗：冲刺技能期间撞击对手车手（真人或 AI）也会造成技能冲撞伤害
      if (mode === 'MULTIPLAYER' && riders.length >= 2 && riders[0].alive && riders[1].alive) {
        const [r1, r2] = riders;
        if (Math.hypot(r1.x - r2.x, r1.y - r2.y) < 38 && Math.abs(r1.jumpOffset - r2.jumpOffset) < 22) {
          if (r1.dashTimer > 0) {
            damageRider(r2, 26, { isSkillHit: true, attacker: r1 });
          }
          if (r2.dashTimer > 0) {
            damageRider(r1, 26, { isSkillHit: true, attacker: r2 });
          }
        }
      }

      // Update Pickups
      for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (p.magnetizedTo) {
          const target = riders.find((r) => r.id === p.magnetizedTo && r.alive);
          if (target) {
            const dx = target.x - p.x;
            const dy = target.y - p.y;
            const d = Math.max(1, Math.hypot(dx, dy));
            p.x += (dx / d) * 520 * dt;
            p.y += (dy / d) * 520 * dt;
          } else {
            p.x -= roadSpeed * dt;
          }
        } else {
          p.x -= roadSpeed * dt;
          // Postal Hound bone magnet
          for (const r of riders) {
            if (r.alive && r.char.id === 'solo_postal_hound' && p.type.startsWith('bone')) {
              const dist = Math.hypot(r.x - p.x, r.y - p.y);
              if (dist < 130) {
                p.x += ((r.x - p.x) / Math.max(1, dist)) * 280 * dt;
                p.y += ((r.y - p.y) / Math.max(1, dist)) * 280 * dt;
              }
            }
          }
        }

        let collected = false;
        for (const r of riders) {
          if (!r.alive) continue;
          const dx = r.x - p.x;
          const dy = r.y - riderJumpPull(r) - p.y;
          if (Math.hypot(dx, dy) < 38) {
            collected = true;
            const whistleMult = r.whistleTimer > 0 ? 1.3 : 1;
            const postalMult = r.char.id === 'solo_postal_hound' ? 1.15 : 1;
            const corgiColorMult = r.char.id === 'mp_parade_corgi' && p.type !== 'bone_normal' ? 1.2 : 1;
            const pantryMult =
              mode === 'COOP' && riders.some((x) => x.alive && x.char.id === 'coop_pantry_shiba') ? 1.4 : 1;

            if (p.type === 'bone_normal') {
              normalBones++;
              const pts = Math.round(BONE_VALUES.normal * difficulty.scoreMultiplier * whistleMult * postalMult);
              r.score += pts;
              r.combo++;
              r.comboTimer = 3.2;
              soundEngine.playBone('normal');
              addFloatText(p.x, p.y - 16, `+${pts}`, '#F2EBDD');
            } else if (p.type === 'bone_green') {
              greenBones++;
              const pts = Math.round(
                BONE_VALUES.green * difficulty.scoreMultiplier * whistleMult * postalMult * corgiColorMult
              );
              r.score += pts;
              r.combo++;
              r.comboTimer = 3.5;
              soundEngine.playBone('green');
              addFloatText(p.x, p.y - 18, `绿骨头 +${pts} (+2倍)`, '#4BE39E');
            } else if (p.type === 'bone_purple') {
              purpleBones++;
              const pts = Math.round(
                BONE_VALUES.purple * difficulty.scoreMultiplier * whistleMult * postalMult * corgiColorMult
              );
              r.score += pts;
              r.combo++;
              r.comboTimer = 4.0;
              soundEngine.playBone('purple');
              addFloatText(p.x, p.y - 20, `紫骨头 +${pts} (+6.5倍)`, '#C084FC');
            } else if (p.type === 'bandage') {
              bandagesUsed++;
              const heal = Math.round(20 * pantryMult);
              r.hp = Math.min(r.maxHp, r.hp + heal);
              soundEngine.playHeal(false);
              addFloatText(p.x, p.y - 18, `绷带 +${heal} HP`, '#FCA5A5');
            } else if (p.type === 'medkit') {
              medkitsUsed++;
              const heal = Math.round(55 * pantryMult);
              r.hp = Math.min(r.maxHp, r.hp + heal);
              r.shieldTimer = Math.max(r.shieldTimer, 2.0);
              soundEngine.playHeal(true);
              addFloatText(p.x, p.y - 20, `医疗包 +${heal} HP`, '#6EE7B7');
            }
            if (
              p.type === 'bone_normal' ||
              p.type === 'bone_green' ||
              p.type === 'bone_purple'
            ) {
              const liveRunScore =
                mode === 'MULTIPLAYER'
                  ? Math.max(riders[0].score, riders[1]?.score ?? 0)
                  : riders[0].score + (riders[1]?.score ?? 0);
              const liveRank = getRankProgress(
                baseTotalBonesRef.current + normalBones + greenBones + purpleBones,
                baseTotalExpRef.current + liveRunScore
              ).current;
              if (liveRank.level > liveHighestRankLevel) {
                liveHighestRankLevel = liveRank.level;
                soundEngine.playAchievement();
                addFloatText(
                  r.x,
                  r.y - 68,
                  `${liveRank.tierType === 'realm' ? '境界突破' : '军衔晋升'}：${liveRank.level}.${liveRank.name}（不消耗）`,
                  liveRank.accentColor
                );
              }
            }
            maxCombo = Math.max(maxCombo, r.combo);
            break;
          }
        }

        if (collected || p.x < -50) {
          pickups.splice(i, 1);
        }
      }

      // Update Obstacles (damages BOTH player/AI riders AND road NPC cyclists!)
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= roadSpeed * dt;

        let removed = false;
        for (const r of riders) {
          if (!r.alive) continue;
          if (Math.abs(r.x - obs.x) < 26 && Math.abs(r.y - obs.y) < 18) {
            if (r.jumpOffset > 18) continue; // Jumped cleanly over!
            if (obs.kind === 'puddle') {
              if (r.char.id !== 'solo_vintage_terrier' && r.char.id !== 'mp_trail_doberman') {
                r.slowTimer = 1.1;
              }
            } else {
              if (r.dashTimer > 0) {
                removed = true;
                addFloatText(obs.x, obs.y - 20, '撞碎!', '#E29D3E');
              } else {
                damageRider(r, 18);
                removed = true;
              }
            }
          }
        }

        if (!removed) {
          for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const e = enemies[ei];
            if (Math.abs(e.x - obs.x) < 25 && Math.abs(e.y - obs.y) < 18) {
              if (obs.kind === 'puddle') {
                e.slowTimer = 1.2;
              } else {
                const dead = damageEnemy(e, 18);
                if (dead) enemies.splice(ei, 1);
                removed = true;
                break;
              }
            }
          }
        }

        if (removed || obs.x < -60) obstacles.splice(i, 1);
      }

      // Update Enemies & Axis Infinite-Ammo Shooting
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const spd = e.slowTimer > 0 ? e.speedX * 0.55 : e.speedX;
        e.slowTimer = Math.max(0, e.slowTimer - dt);
        e.markedTimer = Math.max(0, e.markedTimer - dt);
        e.x -= spd * dt;
        e.pedalPhase += dt * 9;

        // 受伤车手骑行途中持续滴落血花到路面，血渍留在地上不消失
        if (e.hp < e.maxHp) {
          e.bleedTimer -= dt;
          if (e.bleedTimer <= 0) {
            e.bleedTimer = mode === 'AXIS_INVASION' ? 0.11 + Math.random() * 0.07 : 0.18 + Math.random() * 0.1;
            spawnBloodSpray(e.x - 10, e.y, 2, 1, -1);
          }
        }

        // Axis Army units have infinite ammo and shoot at players AND other riders!
        if (e.isAxis && e.x < LOGICAL_W - 20 && e.x > 80) {
          e.fireTimer -= dt;
          e.grenadeTimer -= dt;
          const candidates: { x: number; y: number }[] = [
            ...riders.filter((r) => r.alive).map((r) => ({ x: r.x, y: r.y })),
            ...enemies.filter((other) => other.uid !== e.uid && !other.isAxis).map((other) => ({ x: other.x, y: other.y })),
          ];
          if (e.fireTimer <= 0) {
            e.fireTimer = difficulty.enemyFireInterval * (0.85 + Math.random() * 0.35);
            if (candidates.length > 0) {
              const target = candidates[Math.floor(Math.random() * candidates.length)];
              const dx = target.x - e.x;
              const dy = target.y - e.y;
              const len = Math.max(1, Math.hypot(dx, dy));
              const bSpd = difficulty.enemyBulletSpeed;
              spawnBullet(e.x - 24, e.y - 18, (dx / len) * bSpd, (dy / len) * bSpd, false, {
                groundY: e.y,
                z: 18,
                damage: 15,
                color: '#F87171',
                radius: 4.5,
              });
            }
          }
          if (e.grenadeTimer <= 0 && (mode === 'AXIS_INVASION' || difficulty.tier >= 4) && candidates.length > 0) {
            e.grenadeTimer = 3.2 + Math.random() * 2.4;
            const target = candidates[Math.floor(Math.random() * candidates.length)];
            const z0 = 22;
            const vz = 235;
            const g = 620;
            const flightTime = (vz + Math.sqrt(vz * vz + 2 * g * z0)) / g;
            spawnBullet(
              e.x - 18,
              e.y - 22,
              (target.x - e.x) / flightTime,
              (target.y - e.y) / flightTime,
              false,
              {
                groundY: e.y,
                z: z0,
                vz,
                gravity: g,
                isGrenade: true,
                isMortar: true,
                mortarLife: flightTime + 0.15,
                damage: 28,
                color: '#F97316',
                radius: 6.5,
              }
            );
          }
        }

        // Rider collision with road cyclist (both take realistic damage!)
        let killed = false;
        for (const r of riders) {
          if (!r.alive) continue;
          if (Math.abs(r.x - e.x) < 34 && Math.abs(r.y - e.y) < 22 && r.jumpOffset < 18) {
            if (r.dashTimer > 0) {
              killed = damageEnemy(e, 999, r);
            } else {
              damageRider(r, 20);
              killed = damageEnemy(e, 38);
            }
            if (killed) break;
          }
        }

        if (killed || e.x < -70) enemies.splice(i, 1);
      }

      // Cyclist-to-cyclist side-swipe damage on crowded roads
      for (let i = enemies.length - 1; i >= 0; i--) {
        const a = enemies[i];
        if (!a) continue;
        for (let j = i - 1; j >= 0; j--) {
          const b = enemies[j];
          if (Math.abs(a.x - b.x) < 24 && Math.abs(a.y - b.y) < 14 && a.slowTimer <= 0 && b.slowTimer <= 0) {
            a.slowTimer = 0.6;
            b.slowTimer = 0.6;
            const aDead = damageEnemy(a, 14);
            const bDead = damageEnemy(b, 14);
            if (aDead) {
              enemies.splice(i, 1);
              break;
            }
            if (bDead) {
              enemies.splice(j, 1);
            }
          }
        }
      }

      // Update Bullets & Grenades (with 3D elevation, ground ricochet sparks, and cratering blasts)
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.groundY += b.vy * dt;
        b.vz -= b.gravity * dt;
        b.z += b.vz * dt;
        b.y = b.groundY - b.z;

        if (b.isMortar || b.isGrenade) {
          b.spin += dt * 11;
          b.mortarLife -= dt;
          if (b.z <= 0 || b.mortarLife <= 0) {
            detonateExplosive(b.x, b.groundY, b.damage, b.fromPlayer, b.ownerId, b.isGrenade);
            bullets.splice(i, 1);
            continue;
          }
        } else if (b.z <= 0) {
          // Missed shot struck the asphalt road -> realistic ricochet sparks & dust!
          spawnBulletGroundSparks(b.x, b.groundY, b.vx, b.color);
          bullets.splice(i, 1);
          continue;
        }

        let removeBullet = false;
        if (b.fromPlayer) {
          const owner = riders.find((r) => r.id === b.ownerId) ?? riders[0];
          // 多人对抗模式：玩家或 AI 发射的技能弹幕/投射物击中对方骑手会扣除对方血量
          if (mode === 'MULTIPLAYER') {
            for (const r of riders) {
              if (!r.alive || r.id === b.ownerId) continue;
              if (Math.hypot(r.x - b.x, r.y - r.jumpOffset - 16 - b.y) < 26 + b.radius) {
                if (b.isGrenade || b.isMortar) {
                  detonateExplosive(b.x, b.groundY, b.damage, true, b.ownerId, b.isGrenade);
                  removeBullet = true;
                  break;
                }
                damageRider(r, b.damage, { isSkillHit: true, attacker: owner });
                b.pierce--;
                if (b.pierce <= 0) {
                  removeBullet = true;
                  break;
                }
              }
            }
          }
          if (!removeBullet && b.z < 40) {
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
              const e = enemies[ei];
              if (Math.hypot(e.x - b.x, e.y - 14 - b.y) < 28 + b.radius) {
                if (b.isGrenade || b.isMortar) {
                  detonateExplosive(b.x, b.groundY, b.damage, true, b.ownerId, b.isGrenade);
                  removeBullet = true;
                  break;
                }
                if (damageEnemy(e, b.damage, owner)) {
                  enemies.splice(ei, 1);
                }
                b.pierce--;
                if (b.pierce <= 0) {
                  removeBullet = true;
                  break;
                }
              }
            }
          }
        } else {
          // Enemy bullet hits players OR other road cyclists!
          for (const r of riders) {
            if (!r.alive || r.jumpOffset > 28) continue;
            const protectedByMastiff =
              mastiff &&
              mastiff.id !== r.id &&
              mastiff.x > r.x &&
              Math.abs(mastiff.y - r.y) < 35;

            if (Math.hypot(r.x - b.x, r.y - 16 - b.y) < 22 + b.radius) {
              if (b.isGrenade || b.isMortar) {
                detonateExplosive(b.x, b.groundY, b.damage, false, undefined, b.isGrenade);
              } else if (protectedByMastiff) {
                addFloatText(r.x, r.y - 45, '掩护抵挡', '#94A3B8');
              } else {
                damageRider(r, b.damage);
              }
              removeBullet = true;
              break;
            }
          }
          if (!removeBullet && b.z < 40) {
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
              const e = enemies[ei];
              if (!e.isAxis && Math.hypot(e.x - b.x, e.y - 14 - b.y) < 24) {
                if (b.isGrenade || b.isMortar) {
                  detonateExplosive(b.x, b.groundY, b.damage, false, undefined, b.isGrenade);
                } else if (damageEnemy(e, b.damage)) {
                  enemies.splice(ei, 1);
                }
                removeBullet = true;
                break;
              }
            }
          }
        }

        if (removeBullet || b.x < -50 || b.x > LOGICAL_W + 50 || b.groundY < ROAD_TOP - 80 || b.groundY > LOGICAL_H + 50) {
          bullets.splice(i, 1);
        }
      }

      // Update Realistic Fallen / Crashed Cyclists
      const activeRoadDrag = riders.some((r) => r.alive) ? roadSpeed * 0.72 : roadSpeed * 0.15;
      for (let i = fallenCyclists.length - 1; i >= 0; i--) {
        const f = fallenCyclists[i];
        f.life -= dt;
        f.x += (f.vx - activeRoadDrag) * dt;
        f.y = Math.max(ROAD_TOP + 12, Math.min(ROAD_BOTTOM - 8, f.y + f.vy * dt));
        f.vx *= Math.pow(0.18, dt);
        f.vy *= Math.pow(0.14, dt);

        if (f.z > 0 || f.vz > 0) {
          f.z += f.vz * dt;
          f.vz -= 960 * dt;
          if (f.z <= 0) {
            f.z = 0;
            if (f.bounces < 1 && Math.abs(f.vz) > 65) {
              f.vz = -f.vz * 0.34;
              f.bounces++;
            } else {
              f.vz = 0;
            }
          }
        }

        // Accumulate asphalt skid marks & blood trail while sliding on tarmac
        if (f.z <= 2 && Math.abs(f.vx) > 15) {
          f.skidDist += Math.abs(f.vx) * dt * 0.85;
          if (Math.random() < dt * 15) {
            stampBloodSplatter(
              f.x + (Math.random() - 0.5) * 18,
              f.y + (Math.random() - 0.5) * 10,
              4.2 + Math.random() * 4.5
            );
          }
        }

        // Tip smoothly onto side
        if (Math.abs(f.angle) < Math.abs(f.targetAngle)) {
          f.angle += f.angularVel * dt;
          if (Math.abs(f.angle) >= Math.abs(f.targetAngle)) {
            f.angle = f.targetAngle;
            f.angularVel = 0;
          }
        }

        f.wheelSpin += f.wheelSpinVel * dt;
        f.wheelSpinVel *= Math.pow(0.28, dt);

        if (f.life <= 0 || f.x < -120) {
          fallenCyclists.splice(i, 1);
        }
      }

      // Update persistent ground craters & permanent floor blood splatters (never fade away, scroll naturally with road)
      screenShake = Math.max(0, screenShake - 28 * dt);
      for (let i = groundCraters.length - 1; i >= 0; i--) {
        const c = groundCraters[i];
        c.x -= roadSpeed * dt;
        if (c.x < -120) groundCraters.splice(i, 1);
      }
      for (let i = groundBloodSplatters.length - 1; i >= 0; i--) {
        const b = groundBloodSplatters[i];
        b.x -= roadSpeed * dt;
        if (b.x < -90) groundBloodSplatters.splice(i, 1);
      }

      // Update flying blood droplets -> permanently stain asphalt floor when z <= 0
      for (let i = airBloodDroplets.length - 1; i >= 0; i--) {
        const d = airBloodDroplets[i];
        d.x += (d.vx - roadSpeed * 0.55) * dt;
        d.groundY += d.vy * dt;
        d.vz -= 720 * dt;
        d.z += d.vz * dt;
        if (d.z <= 0) {
          stampBloodSplatter(d.x, d.groundY, d.size * (1.35 + Math.random() * 0.9));
          airBloodDroplets.splice(i, 1);
        } else if (d.x < -60) {
          airBloodDroplets.splice(i, 1);
        }
      }

      // Update bullet ricochet sparks & blast sparks
      for (let i = groundSparks.length - 1; i >= 0; i--) {
        const sp = groundSparks[i];
        sp.x += (sp.vx - roadSpeed * 0.65) * dt;
        sp.groundY += sp.vy * dt;
        sp.vz -= 680 * dt;
        sp.z += sp.vz * dt;
        if (sp.z <= 0) {
          sp.z = 0;
          sp.vz = Math.abs(sp.vz) * 0.42;
          sp.vx *= 0.72;
        }
        sp.life -= dt;
        if (sp.life <= 0) groundSparks.splice(i, 1);
      }

      // Update flying asphalt rubble chunks
      for (let i = rubbleChunks.length - 1; i >= 0; i--) {
        const r = rubbleChunks[i];
        r.x += (r.vx - roadSpeed * 0.78) * dt;
        r.groundY += r.vy * dt;
        r.vz -= 760 * dt;
        r.z += r.vz * dt;
        r.angle += r.spin * dt;
        if (r.z <= 0) {
          r.z = 0;
          r.vz = Math.abs(r.vz) * 0.3;
          r.vx *= 0.55;
          r.spin *= 0.4;
        }
        r.life -= dt;
        if (r.life <= 0 || r.x < -60) rubbleChunks.splice(i, 1);
      }

      // Update smoke puffs & explosion fireballs
      for (let i = smokePuffs.length - 1; i >= 0; i--) {
        const sm = smokePuffs[i];
        sm.x += (sm.vx - roadSpeed * 0.62) * dt;
        sm.z += sm.vz * dt;
        sm.life -= dt;
        if (sm.life <= 0) smokePuffs.splice(i, 1);
      }
      for (let i = explosionEffects.length - 1; i >= 0; i--) {
        const ex = explosionEffects[i];
        ex.x -= roadSpeed * 0.75 * dt;
        ex.life -= dt;
        if (ex.life <= 0) explosionEffects.splice(i, 1);
      }

      // Update floating texts
      for (let i = floatTexts.length - 1; i >= 0; i--) {
        const ft = floatTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) floatTexts.splice(i, 1);
      }

      // Check End Condition (either reached finish gate or all riders defeated after death fall outro)
      const anyAlive = riders.some((r) => r.alive);
      const crossedFinish =
        anyAlive &&
        (riders.some((r) => r.alive && r.x >= finishGateX - 10) || scrollDist >= targetScrollDist);

      if (!anyAlive && deathOutroTimer < 0 && !crossedFinish) {
        deathOutroTimer = 1.35; // Let protagonist fall, skid & yelp visibly before modal!
      }
      if (deathOutroTimer > 0) {
        deathOutroTimer -= dt;
      }

      if ((crossedFinish || (!anyAlive && deathOutroTimer <= 0)) && !finished) {
        finished = true;
        const reachedFinish = crossedFinish && anyAlive;
        const p1 = riders[0];
        const p2 = riders[1];

        const distanceMeters = reachedFinish
          ? difficulty.targetDistanceMeters
          : Math.min(difficulty.targetDistanceMeters, Math.round(scrollDist / 16));

        let mpWinner: 'P1' | 'P2' | 'DRAW' | undefined;
        let winReason: string | undefined;

        if (mode === 'MULTIPLAYER' && p2) {
          // 1) 一方幸存、另一方倒地 -> 幸存者胜出
          if (p1.alive !== p2.alive) {
            mpWinner = p1.alive ? 'P1' : 'P2';
            winReason = p1.alive ? '对手倒地，P1 幸存胜出' : '对手倒地，P2 幸存胜出';
          } else if (reachedFinish && p1.alive && p2.alive) {
            // 2) 双方均存活冲线 -> 先撞线 / 身位明显领先者胜出，并排再比积分
            const p1Crossed = p1.x >= finishGateX - 10;
            const p2Crossed = p2.x >= finishGateX - 10;
            if (p1Crossed !== p2Crossed) {
              mpWinner = p1Crossed ? 'P1' : 'P2';
              winReason = `${mpWinner} 率先冲过终点线`;
            } else if (Math.abs(p1.x - p2.x) >= 12) {
              mpWinner = p1.x > p2.x ? 'P1' : 'P2';
              winReason = `${mpWinner} 身位领先冲线`;
            } else {
              mpWinner = p1.score > p2.score ? 'P1' : p2.score > p1.score ? 'P2' : 'DRAW';
              winReason = mpWinner === 'DRAW' ? '并排冲线 · 积分相同' : `并排冲线 · ${mpWinner} 积分更高`;
            }
          } else {
            // 3) 双方均未抵达终点 -> 坚持骑行更远 / 存活更久者胜出，同时倒地再比积分
            const d1 = p1.diedAtDist ?? distanceMeters;
            const d2 = p2.diedAtDist ?? distanceMeters;
            const t1 = p1.diedAtTime ?? elapsed;
            const t2 = p2.diedAtTime ?? elapsed;
            if (Math.abs(d1 - d2) >= 5) {
              mpWinner = d1 > d2 ? 'P1' : 'P2';
              winReason = `${mpWinner} 坚持骑行更远`;
            } else if (Math.abs(t1 - t2) >= 0.25) {
              mpWinner = t1 > t2 ? 'P1' : 'P2';
              winReason = `${mpWinner} 存活时间更久`;
            } else {
              mpWinner = p1.score > p2.score ? 'P1' : p2.score > p1.score ? 'P2' : 'DRAW';
              winReason = mpWinner === 'DRAW' ? '同时退场 · 积分相同' : `同时退场 · ${mpWinner} 积分更高`;
            }
          }
        }

        if (reachedFinish) {
          const finishBonus = Math.round(500 * difficulty.scoreMultiplier);
          if (mode === 'MULTIPLAYER' && p2) {
            if (mpWinner === 'P1') {
              if (p1.alive) p1.score += finishBonus;
              if (p2.alive) p2.score += Math.round(finishBonus * 0.5);
            } else if (mpWinner === 'P2') {
              if (p2.alive) p2.score += finishBonus;
              if (p1.alive) p1.score += Math.round(finishBonus * 0.5);
            } else {
              if (p1.alive) p1.score += finishBonus;
              if (p2.alive) p2.score += finishBonus;
            }
          } else {
            if (p1.alive) p1.score += finishBonus;
            if (p2?.alive) p2.score += finishBonus;
          }
          soundEngine.playFinishVictory();
        }

        const totalScore =
          mode === 'MULTIPLAYER'
            ? mpWinner === 'P1'
              ? p1.score
              : mpWinner === 'P2'
              ? p2?.score ?? p1.score
              : Math.max(p1.score, p2?.score ?? 0)
            : p1.score + (p2?.score ?? 0);

        const summary: RunSummary = {
          mode,
          difficultyId,
          p1CharacterId,
          p2CharacterId: hasTwoPlayers ? p2CharacterId : undefined,
          distanceMeters,
          durationSeconds: Math.round(elapsed),
          score: totalScore,
          p1Score: p1.score,
          p2Score: p2?.score ?? 0,
          normalBones,
          greenBones,
          purpleBones,
          bandagesUsed,
          medkitsUsed,
          enemiesDefeated,
          shotsFired,
          bulletsClearedBySkill,
          damageTaken,
          p1DamageTaken,
          p1HitCount,
          p1Survived: p1.alive,
          silentBlackoutsSurvived,
          blackoutBlindSeconds,
          maxCombo,
          jumpsPerformed,
          reachedFinish,
          winner:
            mode === 'MULTIPLAYER' && p2
              ? mpWinner
              : mode === 'COOP'
              ? 'TEAM'
              : undefined,
          winReason,
        };
        setLastSummary(summary);
        setPlayState('GAME_OVER');
        onClearSnapshotRef.current();
        onRunComplete(summary);
      }

      // ==================== RENDER FRAME ====================
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.save();
      if (screenShake > 0.25) {
        const sx = (Math.random() - 0.5) * screenShake * 1.4;
        const sy = (Math.random() - 0.5) * screenShake * 1.2;
        ctx.translate(sx, sy);
      }

      drawRoadEnvironment(
        ctx,
        LOGICAL_W,
        LOGICAL_H,
        scrollDist,
        ROAD_TOP,
        ROAD_BOTTOM,
        darknessAlpha,
        currentWeather,
        weatherIntensity
      );

      // Render Finish Arch & Checkered Strip when approaching
      if (finishGateX > -120 && finishGateX < LOGICAL_W + 120) {
        drawFinishGate(ctx, finishGateX, ROAD_TOP, ROAD_BOTTOM, elapsed);
      }

      // Render persistent road blast craters & permanent floor blood splatters directly on the tarmac
      drawGroundCraters(ctx, groundCraters);
      drawGroundBloodSplatters(ctx, groundBloodSplatters);

      // Render Zones on road
      for (const z of zones) {
        const alpha = Math.max(0, z.life / z.maxLife);
        ctx.save();
        if (z.kind === 'heal_zone') {
          ctx.fillStyle = `rgba(72, 155, 130, ${0.24 * alpha})`;
          ctx.strokeStyle = `rgba(110, 231, 183, ${0.75 * alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (z.kind === 'bell_wave') {
          const r = z.radius * (1 - alpha * 0.7);
          ctx.strokeStyle = `rgba(103, 184, 227, ${0.85 * alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(z.x, z.y, r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (z.kind === 'soup_slick') {
          ctx.fillStyle = `rgba(232, 168, 41, ${0.42 * alpha})`;
          ctx.beginPath();
          ctx.ellipse(z.x, z.y, z.radius, z.radius * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (z.kind === 'explosion') {
          ctx.fillStyle = `rgba(249, 115, 22, ${0.45 * alpha})`;
          ctx.beginPath();
          ctx.arc(z.x, z.y, z.radius * (1.1 - alpha * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Render Obstacles
      for (const obs of obstacles) {
        drawObstacle(ctx, obs.x, obs.y, obs.kind);
      }

      // Render Pickups
      for (const p of pickups) {
        drawPickupItem(ctx, p.x, p.y, p.type, elapsed);
      }

      // Depth-sort all cyclists (fallen wrecks + active players + road cyclists) by Y
      const drawQueue: { y: number; draw: () => void }[] = [];
      for (const f of fallenCyclists) {
        drawQueue.push({
          y: f.y - 1,
          draw: () => {
            drawFallenCyclist(ctx, {
              x: f.x,
              y: f.y,
              z: f.z,
              angle: f.angle,
              skidDist: f.skidDist,
              wheelSpin: f.wheelSpin,
              character: f.character,
              isAxisEnemy: f.isAxisEnemy,
              label: f.label,
            });
          },
        });
      }
      for (const e of enemies) {
        drawQueue.push({
          y: e.y,
          draw: () => {
            drawDogOnBicycle(ctx, {
              x: e.x,
              y: e.y,
              jumpOffset: 0,
              pedalPhase: e.pedalPhase,
              leanAngle: 0,
              character: e.char,
              hp: e.hp,
              maxHp: e.maxHp,
              shieldActive: false,
              dashActive: false,
              hurtFlash: 0,
              isEnemy: true,
              isAxisEnemy: e.isAxis,
              playerTag: e.isAxis ? '轴心∞' : e.isAlliedTarget ? '目标' : undefined,
            });
          },
        });
      }
      for (const r of riders) {
        if (!r.alive) continue;
        drawQueue.push({
          y: r.y,
          draw: () => {
            drawDogOnBicycle(ctx, {
              x: r.x,
              y: r.y,
              jumpOffset: r.jumpOffset,
              pedalPhase: r.pedalPhase,
              leanAngle: r.leanAngle,
              character: r.char,
              hp: r.hp,
              maxHp: r.maxHp,
              shieldActive: r.shieldTimer > 0,
              dashActive: r.dashTimer > 0 || r.whistleTimer > 0,
              hurtFlash: r.hurtFlash,
              playerTag: r.id === 'P2' && p2IsAiRef.current ? 'P2·AI' : hasTwoPlayers ? r.id : undefined,
            });
          },
        });
      }
      drawQueue.sort((a, b) => a.y - b.y);
      for (const item of drawQueue) item.draw();

      // Render Bullets & Airborne Grenades
      for (const b of bullets) {
        if (b.isGrenade || b.isMortar) {
          drawGrenadeProjectile(ctx, b.x, b.groundY, Math.max(0, b.z), b.spin, b.fromPlayer);
        } else {
          ctx.save();
          // Faint ground shadow under bullet showing height above tarmac
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(b.x, b.groundY, b.radius * 0.9, b.radius * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
          // Bullet trail
          ctx.strokeStyle = b.color;
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = b.radius * 0.85;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - b.vx * 0.025, b.y - b.vy * 0.025);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Render ground ricochet sparks, flying asphalt rubble, blast smoke/fireballs, and airborne blood spray
      drawGroundSparks(ctx, groundSparks);
      drawRubbleChunks(ctx, rubbleChunks);
      drawExplosionsAndSmoke(ctx, explosionEffects, smokePuffs);
      drawAirBloodDroplets(ctx, airBloodDroplets);

      // Render Foreground Weather Particles & Mist (lit by headlights in dark modes)
      drawWeatherForeground(
        ctx,
        LOGICAL_W,
        LOGICAL_H,
        currentWeather,
        weatherIntensity,
        weatherParticles,
        elapsed,
        darknessAlpha
      );
      ctx.restore();

      // Render Shadow / Silent Darkness Mask with Headlight Cones!
      if (darknessAlpha > 0.03 && darkCtx && darknessCanvasRef.current) {
        darkCtx.globalCompositeOperation = 'source-over';
        darkCtx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
        darkCtx.fillStyle = `rgba(6, 8, 12, ${darknessAlpha})`;
        darkCtx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

        darkCtx.globalCompositeOperation = 'destination-out';

        // Carve player headlamp cones
        for (const r of riders) {
          if (!r.alive) continue;
          const beamLen =
            difficulty.headlightRadius * (r.char.id === 'solo_night_paperboy' ? 1.45 : 1.0);
          const lampX = r.x + 22;
          const lampY = r.y - r.jumpOffset - 18;

          // Local glow around the dog rider
          const selfGlow = darkCtx.createRadialGradient(r.x, r.y - 16, 15, r.x, r.y - 16, 95);
          selfGlow.addColorStop(0, 'rgba(0,0,0,1)');
          selfGlow.addColorStop(1, 'rgba(0,0,0,0)');
          darkCtx.fillStyle = selfGlow;
          darkCtx.beginPath();
          darkCtx.arc(r.x, r.y - 16, 95, 0, Math.PI * 2);
          darkCtx.fill();

          // Directional headlight cone
          const coneGrad = darkCtx.createRadialGradient(lampX, lampY, 8, lampX + beamLen * 0.55, lampY, beamLen);
          coneGrad.addColorStop(0, 'rgba(0,0,0,0.98)');
          coneGrad.addColorStop(0.7, 'rgba(0,0,0,0.65)');
          coneGrad.addColorStop(1, 'rgba(0,0,0,0)');
          darkCtx.fillStyle = coneGrad;
          darkCtx.beginPath();
          darkCtx.moveTo(lampX, lampY);
          darkCtx.lineTo(lampX + beamLen * 1.15, lampY - beamLen * 0.42);
          darkCtx.lineTo(lampX + beamLen * 1.15, lampY + beamLen * 0.42);
          darkCtx.closePath();
          darkCtx.fill();
        }

        // Faint luminescence around Green Bones, Purple Bones, Bandages, Medkits, and Bullets
        for (const p of pickups) {
          if (p.type === 'bone_normal') continue;
          const g = darkCtx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 44);
          g.addColorStop(0, 'rgba(0,0,0,0.85)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          darkCtx.fillStyle = g;
          darkCtx.beginPath();
          darkCtx.arc(p.x, p.y, 44, 0, Math.PI * 2);
          darkCtx.fill();
        }
        for (const b of bullets) {
          const g = darkCtx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 24);
          g.addColorStop(0, 'rgba(0,0,0,0.75)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          darkCtx.fillStyle = g;
          darkCtx.beginPath();
          darkCtx.arc(b.x, b.y, 24, 0, Math.PI * 2);
          darkCtx.fill();
        }
        for (const ex of explosionEffects) {
          const g = darkCtx.createRadialGradient(ex.x, ex.y, 8, ex.x, ex.y, ex.radius * 1.9);
          g.addColorStop(0, 'rgba(0,0,0,0.98)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          darkCtx.fillStyle = g;
          darkCtx.beginPath();
          darkCtx.arc(ex.x, ex.y, ex.radius * 1.9, 0, Math.PI * 2);
          darkCtx.fill();
        }
        for (const sp of groundSparks) {
          const g = darkCtx.createRadialGradient(sp.x, sp.groundY - sp.z, 2, sp.x, sp.groundY - sp.z, 22);
          g.addColorStop(0, 'rgba(0,0,0,0.65)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          darkCtx.fillStyle = g;
          darkCtx.beginPath();
          darkCtx.arc(sp.x, sp.groundY - sp.z, 22, 0, Math.PI * 2);
          darkCtx.fill();
        }
        if (finishGateX > -100 && finishGateX < LOGICAL_W + 100) {
          const fg = darkCtx.createRadialGradient(finishGateX, (ROAD_TOP + ROAD_BOTTOM) / 2, 24, finishGateX, (ROAD_TOP + ROAD_BOTTOM) / 2, 180);
          fg.addColorStop(0, 'rgba(0,0,0,0.92)');
          fg.addColorStop(1, 'rgba(0,0,0,0)');
          darkCtx.fillStyle = fg;
          darkCtx.beginPath();
          darkCtx.arc(finishGateX, (ROAD_TOP + ROAD_BOTTOM) / 2, 180, 0, Math.PI * 2);
          darkCtx.fill();
        }

        ctx.drawImage(darknessCanvasRef.current, 0, 0);
      }

      // Render Floating Callout Texts above darkness layer
      for (const ft of floatTexts) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, ft.life * 1.4);
        ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0F1318';
        ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // Sync React HUD at ~12fps and persist active run snapshot every ~0.8s
      hudSyncTimer += dt;
      snapshotSyncTimer += dt;
      if (snapshotSyncTimer >= 0.8) {
        snapshotSyncTimer = 0;
        saveCurrentSnapshot();
      }
      if (hudSyncTimer >= 0.08) {
        hudSyncTimer = 0;
        const p1 = riders[0];
        const p2 = riders[1];
        const totalScore =
          mode === 'MULTIPLAYER' ? Math.max(p1.score, p2?.score ?? 0) : p1.score + (p2?.score ?? 0);
        setHudState({
          distance: Math.round(scrollDist / 16),
          score: totalScore,
          p1Hp: Math.round(p1.hp),
          p1MaxHp: p1.maxHp,
          p1Cd: Number(p1.skillCooldownLeft.toFixed(1)),
          p2Hp: p2 ? Math.round(p2.hp) : 0,
          p2MaxHp: p2 ? p2.maxHp : 100,
          p2Cd: p2 ? Number(p2.skillCooldownLeft.toFixed(1)) : 0,
          p1Score: p1.score,
          p2Score: p2 ? p2.score : 0,
          combo: Math.max(p1.combo, p2?.combo ?? 0),
          normalBones,
          greenBones,
          purpleBones,
          bandages: bandagesUsed,
          medkits: medkitsUsed,
          enemiesDefeated,
          shotsFired,
          silentStatus,
          tutorialHint,
          weather: currentWeather,
          ...(() => {
            const totalNow =
              baseTotalBonesRef.current + normalBones + greenBones + purpleBones;
            const expNow = baseTotalExpRef.current + totalScore;
            const info = getRankProgress(totalNow, expNow);
            if (info.current.level > liveHighestRankLevel) {
              liveHighestRankLevel = info.current.level;
              soundEngine.playAchievement();
              addFloatText(
                p1.x,
                p1.y - 68,
                `${info.current.tierType === 'realm' ? '境界突破' : '军衔晋升'}：${info.current.level}.${info.current.name}`,
                info.current.accentColor
              );
            }
            return {
              liveBones: totalNow,
              rankLevel: info.current.level,
              rankName: info.current.name,
              rankColor: info.current.accentColor,
            };
          })(),
        });
      }

      justPressed.clear();
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pagehide', onPageUnload);
      window.removeEventListener('beforeunload', onPageUnload);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [runKey, mode, difficultyId, p1CharacterId, p2CharacterId]);

  const handleRestart = () => {
    onClearSnapshot();
    setLastSummary(null);
    setPlayState('PLAYING');
    setRunKey((k) => k + 1);
  };

  const handleExit = () => {
    onClearSnapshot();
    onExitToLobby();
  };

  const toggleMute = () => {
    soundEngine.muted = !soundEngine.muted;
    setMuted(soundEngine.muted);
    onMuteChange(soundEngine.muted);
  };

  return (
    <div className="min-h-screen bg-[#12161B] text-[#F2EFE9] flex flex-col">
      {/* Compact Uncluttered Top Bar */}
      <header className="border-b border-white/10 bg-[#171C23] px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#222933] hover:bg-[#2C3542] text-sm font-medium text-[#E5E0D5] transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            返回大厅
          </button>
          <div className="flex items-center gap-2 text-sm text-[#A9B2BE] truncate">
            <span className="font-semibold text-[#F2EFE9]">{MODE_LABELS[mode]}</span>
            <span aria-hidden="true">·</span>
            <span style={{ color: difficulty.accentColor }} className="font-medium">
              {difficulty.tier}. {difficulty.name}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{p1Char.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num whitespace-nowrap" style={{ color: hudState.rankColor }}>
              Lv.{hudState.rankLevel} {hudState.rankName} · 骨头 {hudState.liveBones}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {mode === 'AXIS_INVASION' && (
            <button
              onClick={onToggleAutoFire}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                autoFire ? 'bg-[#E29D3E] text-[#12161B]' : 'bg-[#222933] text-[#CBD5E1] hover:bg-[#2C3542]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              {autoFire ? '自动连射开 (R)' : '手动开火 (J/左键)'}
            </button>
          )}

          {hasTwoPlayers && (
            <button
              onClick={onToggleP2Ai}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                p2IsAi ? 'bg-[#3B82F6]/20 text-[#93C5FD] border border-[#3B82F6]/40' : 'bg-[#222933] text-[#CBD5E1]'
              }`}
            >
              {p2IsAi ? 'P2：AI 托管中' : 'P2：本地双人键盘'}
            </button>
          )}

          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-[#222933] hover:bg-[#2C3542] text-[#E5E0D5] transition-colors"
            title={muted ? '开启音效' : '静音'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setPlayState((s) => (s === 'PLAYING' ? 'PAUSED' : s === 'PAUSED' ? 'PLAYING' : s))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222933] hover:bg-[#2C3542] text-sm font-medium text-[#E5E0D5] transition-colors whitespace-nowrap shrink-0"
          >
            {playState === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {playState === 'PAUSED' ? '继续' : '暂停'}
          </button>

          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E29D3E] hover:bg-[#EBAD56] text-sm font-semibold text-[#12161B] transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            重新发车
          </button>
        </div>
      </header>

      {/* Main Arena + Clean HUD */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-4 flex flex-col gap-3">
        {/* Top Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* P1 Status */}
          <div className="bg-[#1A2028] border border-white/10 rounded-xl px-4 py-2.5">
            <div className="flex items-center justify-between text-xs text-[#A9B2BE] mb-1.5">
              <span className="font-medium text-[#F2EFE9] truncate">
                P1 · {p1Char.name}
              </span>
              <span className="font-mono-num text-[#E29D3E]">
                HP {hudState.p1Hp}/{hudState.p1MaxHp}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#11151A] overflow-hidden mb-1.5">
              <div
                className="h-full bg-[#34B37B] transition-[width] duration-150"
                style={{ width: `${Math.max(0, (hudState.p1Hp / hudState.p1MaxHp) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#8C96A4]">
              <span>技能(F): {hudState.p1Cd > 0 ? `${hudState.p1Cd}s` : '就绪'}</span>
              {mode === 'MULTIPLAYER' ? (
                <span className="font-mono-num text-[#E29D3E]">积分 {hudState.p1Score}</span>
              ) : (
                p1Char.infiniteAmmo && <span className="font-mono-num text-[#E29D3E]">子弹 ∞</span>
              )}
            </div>
          </div>

          {/* P2 Status OR Weapon/Bone Telemetry */}
          {hasTwoPlayers ? (
            <div className="bg-[#1A2028] border border-white/10 rounded-xl px-4 py-2.5">
              <div className="flex items-center justify-between text-xs text-[#A9B2BE] mb-1.5">
                <span className="font-medium text-[#F2EFE9] truncate">
                  {p2IsAi ? 'P2(AI)' : 'P2'} · {p2Char.name}
                </span>
                <span className="font-mono-num text-[#67B8E3]">
                  HP {hudState.p2Hp}/{hudState.p2MaxHp}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#11151A] overflow-hidden mb-1.5">
                <div
                  className="h-full bg-[#67B8E3] transition-[width] duration-150"
                  style={{ width: `${Math.max(0, (hudState.p2Hp / hudState.p2MaxHp) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#8C96A4]">
                <span>技能(L/.): {hudState.p2Cd > 0 ? `${hudState.p2Cd}s` : '就绪'}</span>
                <span className="font-mono-num">
                  {mode === 'MULTIPLAYER' ? `积分 ${hudState.p2Score}` : '协同'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#1A2028] border border-white/10 rounded-xl px-4 py-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[#A9B2BE]">
                <span>骨头与补给统计</span>
                <span className="font-mono-num">连击 ×{hudState.combo}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono-num mt-1">
                <span className="text-[#F2EBDD]">白 {hudState.normalBones}</span>
                <span className="text-[#4BE39E]">绿 {hudState.greenBones}</span>
                <span className="text-[#C084FC]">紫 {hudState.purpleBones}</span>
                <span className="text-[#FCA5A5]">绷带 {hudState.bandages}</span>
                <span className="text-[#6EE7B7]">医疗包 {hudState.medkits}</span>
              </div>
            </div>
          )}

          {/* Distance, Finish Line Progress & Score */}
          <div className="bg-[#1A2028] border border-white/10 rounded-xl px-4 py-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#A9B2BE]">
              <span>
                终点 {difficulty.targetDistanceMeters} m
              </span>
              <span className="font-mono-num text-[#E29D3E]">
                {hudState.score.toLocaleString()} 分
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#11151A] overflow-hidden my-1.5">
              <div
                className="h-full bg-[#E29D3E] transition-[width] duration-150"
                style={{
                  width: `${Math.min(100, (hudState.distance / difficulty.targetDistanceMeters) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono-num text-[#8C96A4]">
              <span>
                已骑 {hudState.distance} m · 剩{' '}
                {Math.max(0, difficulty.targetDistanceMeters - hudState.distance)} m
              </span>
              <span>击倒 {hudState.enemiesDefeated}</span>
            </div>
          </div>

          {/* Environment / Weather / Ammo Status */}
          <div className="bg-[#1A2028] border border-white/10 rounded-xl px-4 py-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#A9B2BE]">
              <span>天气与路况</span>
              <span
                className="font-medium"
                style={{ color: WEATHER_META[hudState.weather].accentColor }}
              >
                {WEATHER_META[hudState.weather].label}
              </span>
            </div>
            <div className="text-xs font-medium mt-1 truncate" style={{ color: difficulty.accentColor }}>
              {hudState.silentStatus ||
                (hudState.weather !== 'clear'
                  ? WEATHER_META[hudState.weather].handlingHint
                  : mode === 'AXIS_INVASION'
                  ? `无限子弹已发射 ${hudState.shotsFired} 发`
                  : `轴心巡逻率 ${Math.round(difficulty.axisPatrolChance * 100)}%`)}
            </div>
          </div>
        </div>

        {/* Tutorial Guidance Bar (when in 教程 difficulty) */}
        {hudState.tutorialHint && (
          <div className="bg-[#1D2835] border border-[#67B8E3]/35 rounded-xl px-4 py-2 text-sm text-[#D7EEFB]">
            {hudState.tutorialHint}
          </div>
        )}

        {/* Canvas Viewport */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0E1116] shadow-2xl">
          <canvas
            ref={canvasRef}
            width={LOGICAL_W}
            height={LOGICAL_H}
            className="w-full h-auto block select-none cursor-crosshair"
          />

          {/* Pause Overlay */}
          {playState === 'PAUSED' && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-[#1A2028] border border-white/15 rounded-2xl p-6 max-w-md w-full text-center space-y-4">
                <h3 className="text-2xl font-bold font-display text-[#F2EFE9]">车队暂时停靠</h3>
                <p className="text-sm text-[#A9B2BE]">
                  按 Esc / P 随时继续骑行，或调整策略重新发车。
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setPlayState('PLAYING')}
                    className="px-5 py-2.5 rounded-lg bg-[#E29D3E] hover:bg-[#EBAD56] text-[#12161B] font-semibold text-sm transition-colors"
                  >
                    继续骑行
                  </button>
                  <button
                    onClick={handleRestart}
                    className="px-5 py-2.5 rounded-lg bg-[#262F3A] hover:bg-[#323E4D] text-[#F2EFE9] font-medium text-sm transition-colors"
                  >
                    重新开始
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Summary Overlay */}
          {playState === 'GAME_OVER' && lastSummary && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="bg-[#1A2028] border border-white/15 rounded-2xl p-6 max-w-lg w-full space-y-5">
                <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3
                      className={`text-2xl font-bold font-display ${
                        lastSummary.reachedFinish ? 'text-[#5AC88E]' : 'text-[#F2EFE9]'
                      }`}
                    >
                      {lastSummary.reachedFinish ? '冲过终点 · 凯旋抵达！' : '中途退场 · 未达终点'}
                    </h3>
                    <p className="text-xs text-[#A9B2BE] mt-1">
                      {MODE_LABELS[mode]} · {difficulty.name}（终点 {difficulty.targetDistanceMeters} m）·{' '}
                      {p1Char.name}
                    </p>
                  </div>
                  {lastSummary.winner && (
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#E29D3E]">
                        {lastSummary.winner === 'TEAM'
                          ? lastSummary.reachedFinish
                            ? '合作胜利'
                            : '合作行动结束'
                          : lastSummary.winner === 'DRAW'
                          ? '双车平局'
                          : `${lastSummary.winner} 胜出`}
                      </span>
                      {lastSummary.winReason && (
                        <div className="text-[11px] text-[#A9B2BE] mt-0.5">{lastSummary.winReason}</div>
                      )}
                    </div>
                  )}
                </div>

                {mode === 'MULTIPLAYER' && (
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono-num">
                    <div
                      className={`rounded-xl px-3.5 py-2.5 border flex items-center justify-between ${
                        lastSummary.winner === 'P1'
                          ? 'bg-[#222B26] border-[#5AC88E]/60 text-[#F2EFE9]'
                          : 'bg-[#13171D] border-white/10 text-[#A9B2BE]'
                      }`}
                    >
                      <span>P1 积分</span>
                      <span className="text-sm font-bold text-[#E29D3E]">
                        {lastSummary.p1Score.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className={`rounded-xl px-3.5 py-2.5 border flex items-center justify-between ${
                        lastSummary.winner === 'P2'
                          ? 'bg-[#222B26] border-[#5AC88E]/60 text-[#F2EFE9]'
                          : 'bg-[#13171D] border-white/10 text-[#A9B2BE]'
                      }`}
                    >
                      <span>{p2IsAi ? 'P2(AI)' : 'P2'} 积分</span>
                      <span className="text-sm font-bold text-[#67B8E3]">
                        {lastSummary.p2Score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[#13171D] rounded-xl p-3">
                    <div className="text-xs text-[#8C96A4]">骑行里程</div>
                    <div className="text-lg font-bold font-mono-num mt-1">{lastSummary.distanceMeters} m</div>
                  </div>
                  <div className="bg-[#13171D] rounded-xl p-3">
                    <div className="text-xs text-[#8C96A4]">本局总分</div>
                    <div className="text-lg font-bold font-mono-num text-[#E29D3E] mt-1">
                      {lastSummary.score.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#13171D] rounded-xl p-3">
                    <div className="text-xs text-[#8C96A4]">击倒目标</div>
                    <div className="text-lg font-bold font-mono-num mt-1">{lastSummary.enemiesDefeated}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-[#CBD5E1] bg-[#13171D] rounded-xl p-4 font-mono-num">
                  <div className="flex justify-between">
                    <span className="text-[#8C96A4]">常规骨头</span>
                    <span>{lastSummary.normalBones}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4BE39E]">绿骨头 (+2倍)</span>
                    <span>{lastSummary.greenBones}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C084FC]">紫骨头 (+6.5倍)</span>
                    <span>{lastSummary.purpleBones}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#FCA5A5]">绷带 / 医疗包</span>
                    <span>
                      {lastSummary.bandagesUsed} / {lastSummary.medkitsUsed}
                    </span>
                  </div>
                </div>

                {(() => {
                  const runBones =
                    lastSummary.normalBones + lastSummary.greenBones + lastSummary.purpleBones;
                  const rankInfo = getRankProgress(savedTotalBones, savedTotalExp);
                  const nextUnit = rankInfo.next?.requirementKind === 'exp' ? '经验' : '根骨头';
                  return (
                    <div className="rounded-xl bg-[#13171D] border border-white/10 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <span className="text-[#A9B2BE]">
                        当前{rankInfo.current.tierType === 'realm' ? '境界' : '军衔'}：
                        <strong style={{ color: rankInfo.current.accentColor }} className="ml-1">
                          Lv.{rankInfo.current.level} {rankInfo.current.name}
                        </strong>
                        <span className="text-[#8C96A4] ml-2">（本局 +{runBones} 骨头，升级不消耗）</span>
                      </span>
                      <span className="font-mono-num text-[#E29D3E] shrink-0">
                        {rankInfo.next
                          ? `距「${rankInfo.next.name}」差 ${rankInfo.amountToNext.toLocaleString()} ${nextUnit}`
                          : '已达终极境界'}
                      </span>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleExit}
                    className="px-4 py-2.5 rounded-lg bg-[#262F3A] hover:bg-[#323E4D] text-sm font-medium text-[#E5E0D5] transition-colors whitespace-nowrap"
                  >
                    返回出车大厅
                  </button>
                  <button
                    onClick={handleRestart}
                    className="px-5 py-2.5 rounded-lg bg-[#E29D3E] hover:bg-[#EBAD56] text-sm font-semibold text-[#12161B] transition-colors whitespace-nowrap"
                  >
                    再骑一局
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls Reference Line (clean unboxed text) */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#8C96A4] px-1">
          <div className="flex flex-wrap items-center gap-3">
            <span>P1 移动：W/A/S/D {hasTwoPlayers ? '' : '或 方向键'}</span>
            <span aria-hidden="true">·</span>
            <span>P1 跳跃：空格 Space</span>
            <span aria-hidden="true">·</span>
            <span>P1 技能：F / E</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#FB923C]">手榴弹：G</span>
            {mode === 'AXIS_INVASION' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#E29D3E]">无限子弹开火：自动连射(R切换) / J / 鼠标左键</span>
              </>
            )}
            {hasTwoPlayers && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#67B8E3]">
                  {mode === 'MULTIPLAYER'
                    ? p2IsAi
                      ? '多人对抗：技能命中真人/AI可扣血并击倒惨叫'
                      : '多人对抗 P2：方向键移动 · Enter 跳跃 · L/句号 放技能互打'
                    : !p2IsAi
                    ? 'P2：方向键移动 · Enter/右Shift 跳跃 · L/句号 技能'
                    : 'P2：AI 自动协同护航'}
                </span>
              </>
            )}
          </div>
          <span>Esc / P 暂停</span>
        </div>
      </main>
    </div>
  );
};

function riderJumpPull(r: RiderEntity) {
  return r.jumpOffset * 0.6;
}

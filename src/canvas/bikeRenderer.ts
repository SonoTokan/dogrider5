import { CharacterDef, PickupType, WeatherType } from '../types/game';

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export interface RenderRiderParams {
  x: number;
  y: number;
  jumpOffset: number;
  pedalPhase: number;
  leanAngle: number;
  character: CharacterDef;
  hp: number;
  maxHp: number;
  shieldActive: boolean;
  dashActive: boolean;
  hurtFlash: number;
  playerTag?: string; // 'P1' | 'P2' | 'AI'
  isEnemy?: boolean;
  isAxisEnemy?: boolean;
}

export function drawRoadEnvironment(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scrollDist: number,
  roadTop: number,
  roadBottom: number,
  darknessAlpha: number,
  weather: WeatherType = 'clear',
  weatherIntensity: number = 0
) {
  // 1. Sky backdrop (reacts to weather and darkness)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, roadTop);
  if (darknessAlpha > 0.55) {
    skyGrad.addColorStop(0, '#090B10');
    skyGrad.addColorStop(1, '#121822');
  } else if (weather === 'rain') {
    skyGrad.addColorStop(0, '#141E28');
    skyGrad.addColorStop(0.6, '#1F2C38');
    skyGrad.addColorStop(1, '#2D3A46');
  } else if (weather === 'fog') {
    skyGrad.addColorStop(0, '#2B3540');
    skyGrad.addColorStop(0.6, '#434F5B');
    skyGrad.addColorStop(1, '#5D6973');
  } else if (weather === 'snow') {
    skyGrad.addColorStop(0, '#1D2938');
    skyGrad.addColorStop(0.6, '#324254');
    skyGrad.addColorStop(1, '#4C5C6C');
  } else {
    skyGrad.addColorStop(0, '#1D2733');
    skyGrad.addColorStop(0.6, '#2A3642');
    skyGrad.addColorStop(1, '#3D4447');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, roadTop);

  // Subtle distant ridge silhouettes
  ctx.fillStyle =
    darknessAlpha > 0.5
      ? '#10151C'
      : weather === 'fog'
      ? '#44505B'
      : weather === 'snow'
      ? '#344454'
      : '#232C35';
  ctx.beginPath();
  ctx.moveTo(0, roadTop);
  for (let x = 0; x <= w + 60; x += 60) {
    const hillY =
      roadTop -
      32 -
      Math.sin((x + scrollDist * 0.08) * 0.008) * 18 -
      Math.cos((x + scrollDist * 0.05) * 0.015) * 10;
    ctx.lineTo(x, hillY);
  }
  ctx.lineTo(w, roadTop);
  ctx.closePath();
  ctx.fill();

  // Midground trees & mileposts
  const treeSpacing = 220;
  const treeOffset = (scrollDist * 0.35) % treeSpacing;
  for (let x = -treeOffset; x < w + treeSpacing; x += treeSpacing) {
    // Wooden fence post
    ctx.fillStyle = '#3B342C';
    ctx.fillRect(x + 40, roadTop - 16, 6, 16);
    ctx.fillRect(x + 120, roadTop - 16, 6, 16);
    ctx.fillStyle = '#4B4136';
    ctx.fillRect(x + 35, roadTop - 12, 95, 3);

    // Stylized pine/cypress silhouette
    ctx.fillStyle =
      darknessAlpha > 0.5
        ? '#131A17'
        : weather === 'snow'
        ? '#2E433D'
        : weather === 'fog'
        ? '#33423D'
        : '#26392E';
    ctx.beginPath();
    ctx.moveTo(x + 12, roadTop - 68);
    ctx.lineTo(x - 10, roadTop - 10);
    ctx.lineTo(x + 34, roadTop - 10);
    ctx.closePath();
    ctx.fill();

    // Snow frost cap on tree tops during snow
    if (weather === 'snow' && weatherIntensity > 0.25) {
      ctx.fillStyle = `rgba(226, 238, 248, ${Math.min(0.65, weatherIntensity * 0.7)})`;
      ctx.beginPath();
      ctx.moveTo(x + 12, roadTop - 68);
      ctx.lineTo(x + 2, roadTop - 42);
      ctx.lineTo(x + 22, roadTop - 42);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 2. Roadside verge
  ctx.fillStyle = weather === 'snow' && weatherIntensity > 0.3 ? '#3A4644' : '#2B3529';
  ctx.fillRect(0, roadTop - 6, w, 12);

  // 3. Main paved/cobble countryside highway
  const roadGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
  if (weather === 'rain') {
    roadGrad.addColorStop(0, '#1F252D');
    roadGrad.addColorStop(0.5, '#27303A');
    roadGrad.addColorStop(1, '#1C2229');
  } else if (weather === 'snow') {
    roadGrad.addColorStop(0, '#2B323B');
    roadGrad.addColorStop(0.5, '#333C46');
    roadGrad.addColorStop(1, '#293038');
  } else {
    roadGrad.addColorStop(0, '#272B31');
    roadGrad.addColorStop(0.5, '#2E333B');
    roadGrad.addColorStop(1, '#23272D');
  }
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, roadTop, w, roadBottom - roadTop);

  // Road shoulders (frosty tint in snow, wet gloss in rain)
  ctx.fillStyle = weather === 'snow' && weatherIntensity > 0.3 ? '#8B9AA8' : '#5D564A';
  ctx.fillRect(0, roadTop, w, 4);
  ctx.fillRect(0, roadBottom - 4, w, 4);

  // Wet tarmac specular streaks during rain
  const roadHeight = roadBottom - roadTop;
  if (weather === 'rain' && weatherIntensity > 0.15) {
    const sheenPeriod = 190;
    const sheenOffset = (scrollDist * 1.05) % sheenPeriod;
    ctx.fillStyle = `rgba(130, 185, 225, ${0.12 * weatherIntensity})`;
    for (let x = -sheenOffset; x < w + sheenPeriod; x += sheenPeriod) {
      ctx.fillRect(x + 12, roadTop + roadHeight * 0.22, 58, 4);
      ctx.fillRect(x + 90, roadTop + roadHeight * 0.72, 74, 5);
    }
  }

  // Lane dividers (4 lanes across roadHeight)
  const dashWidth = 46;
  const dashGap = 44;
  const dashPeriod = dashWidth + dashGap;
  const dashOffset = scrollDist % dashPeriod;

  ctx.fillStyle = 'rgba(229, 217, 190, 0.28)';
  for (let lane = 1; lane <= 3; lane++) {
    const ly = roadTop + (roadHeight * lane) / 4;
    for (let x = -dashOffset; x < w + dashPeriod; x += dashPeriod) {
      ctx.fillRect(x, ly - 1.5, dashWidth, 3);
    }
  }

  // Cobble texture pebbles scrolling along the road
  const pebblePeriod = 140;
  const pebbleOffset = scrollDist % pebblePeriod;
  ctx.fillStyle =
    weather === 'snow' && weatherIntensity > 0.25
      ? `rgba(226, 238, 248, ${0.09 * weatherIntensity})`
      : 'rgba(255, 255, 255, 0.045)';
  for (let x = -pebbleOffset; x < w + pebblePeriod; x += pebblePeriod) {
    ctx.fillRect(x + 18, roadTop + 26, 12, 3);
    ctx.fillRect(x + 82, roadTop + roadHeight * 0.62, 16, 3);
    ctx.fillRect(x + 54, roadBottom - 28, 10, 3);
  }

  // Bottom grass strip
  ctx.fillStyle = weather === 'snow' && weatherIntensity > 0.3 ? '#2B3538' : '#1D251D';
  ctx.fillRect(0, roadBottom, w, h - roadBottom);
}

export function drawDogOnBicycle(ctx: CanvasRenderingContext2D, p: RenderRiderParams) {
  const {
    x,
    y,
    jumpOffset,
    pedalPhase,
    leanAngle,
    character,
    shieldActive,
    dashActive,
    hurtFlash,
    playerTag,
    isEnemy,
    isAxisEnemy,
  } = p;

  const drawY = y - jumpOffset;
  const scale = isEnemy ? 0.92 : 1.0;

  ctx.save();
  ctx.translate(x, drawY);
  ctx.scale(scale, scale);

  // Ground shadow (shrinks when jumping)
  const shadowScale = Math.max(0.45, 1 - jumpOffset / 110);
  ctx.save();
  ctx.translate(0, jumpOffset + 18);
  ctx.scale(shadowScale, shadowScale * 0.32);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.rotate(leanAngle);

  if (hurtFlash > 0 && Math.floor(hurtFlash * 18) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }

  // Dash speed lines
  if (dashActive) {
    ctx.strokeStyle = 'rgba(226, 157, 62, 0.65)';
    ctx.lineWidth = 2.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-48, -12 + i * 14);
      ctx.lineTo(-82 - Math.random() * 14, -12 + i * 14);
      ctx.stroke();
    }
  }

  const wheelRadius = character.frameStyle === 'vintage28' ? 17 : 15;
  const rearWheelX = -22;
  const frontWheelX = 24;
  const wheelY = 4;

  // Helper to draw spinning spoked bicycle wheel
  const drawWheel = (wx: number, wy: number, r: number) => {
    // Tire
    ctx.strokeStyle = '#181B20';
    ctx.lineWidth = character.frameStyle === 'gravel' ? 5.5 : 4;
    ctx.beginPath();
    ctx.arc(wx, wy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Rim
    ctx.strokeStyle = '#AEB8C4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(wx, wy, r - 2.5, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating spokes
    ctx.strokeStyle = 'rgba(215, 224, 235, 0.55)';
    ctx.lineWidth = 1;
    for (let s = 0; s < 6; s++) {
      const ang = pedalPhase * 2.2 + (s * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(ang) * (r - 3), wy + Math.sin(ang) * (r - 3));
      ctx.lineTo(wx - Math.cos(ang) * (r - 3), wy - Math.sin(ang) * (r - 3));
      ctx.stroke();
    }

    // Hub
    ctx.fillStyle = '#D9B15F';
    ctx.beginPath();
    ctx.arc(wx, wy, 2.8, 0, Math.PI * 2);
    ctx.fill();
  };

  drawWheel(rearWheelX, wheelY, wheelRadius);
  drawWheel(frontWheelX, wheelY, wheelRadius);

  // Sidecar medic tub behind/beside wheel
  if (character.frameStyle === 'sidecar_medic') {
    ctx.fillStyle = '#D9E5DC';
    ctx.strokeStyle = '#3B6E5B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-34, -10, 26, 15, 4);
    ctx.fill();
    ctx.stroke();
    // Red cross
    ctx.fillStyle = '#D94343';
    ctx.fillRect(-23, -6, 6, 2);
    ctx.fillRect(-21, -8, 2, 6);
  }

  // Bicycle Frame
  const frameColor = isAxisEnemy ? '#5D6652' : character.primaryColor;
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = character.frameStyle === 'cargo_tow' || character.frameStyle === 'axis_armored' ? 4 : 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const crankX = -2;
  const crankY = 3;
  const seatX = -11;
  const seatY = -14;
  const headX = 16;
  const headY = -16;

  ctx.beginPath();
  // Rear triangle
  ctx.moveTo(rearWheelX, wheelY);
  ctx.lineTo(seatX, seatY);
  ctx.lineTo(crankX, crankY);
  ctx.lineTo(rearWheelX, wheelY);
  // Top tube & down tube
  ctx.moveTo(seatX, seatY);
  ctx.lineTo(headX, headY);
  ctx.lineTo(crankX, crankY);
  // Front fork
  ctx.moveTo(headX, headY - 4);
  ctx.lineTo(frontWheelX, wheelY);
  ctx.stroke();

  // Handlebars
  ctx.strokeStyle = '#C9D1D9';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(headX, headY - 4);
  if (character.frameStyle === 'track') {
    ctx.lineTo(headX + 5, headY - 6);
    ctx.arc(headX + 5, headY - 3, 3, -Math.PI / 2, Math.PI / 2);
  } else {
    ctx.lineTo(headX - 3, headY - 9);
  }
  ctx.stroke();

  // Saddle
  ctx.fillStyle = '#4A2F1D';
  ctx.beginPath();
  ctx.ellipse(seatX - 1, seatY - 2, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Frame-specific quirky attachments
  if (character.frameStyle === 'postal' || character.frameStyle === 'bakery_crate') {
    ctx.fillStyle = character.frameStyle === 'postal' ? '#8F5B2E' : '#B98A4E';
    ctx.fillRect(-30, -17, 15, 11);
    ctx.strokeStyle = '#4A2F1D';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-30, -17, 15, 11);
  } else if (character.frameStyle === 'delivery') {
    ctx.fillStyle = '#E8A829';
    ctx.fillRect(-32, -23, 17, 15);
    ctx.strokeStyle = '#85570A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-32, -23, 17, 15);
  } else if (character.frameStyle === 'parade') {
    // Glowing paper lantern on front basket
    ctx.fillStyle = '#FF6B7D';
    ctx.beginPath();
    ctx.arc(frontWheelX + 2, headY - 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFE28A';
    ctx.beginPath();
    ctx.arc(frontWheelX + 2, headY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (character.frameStyle === 'axis_armored') {
    // Riveted steel front shield plate
    ctx.fillStyle = '#6B747E';
    ctx.strokeStyle = '#2B3036';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(frontWheelX - 3, headY - 12);
    ctx.lineTo(frontWheelX + 10, headY - 8);
    ctx.lineTo(frontWheelX + 12, wheelY + 3);
    ctx.lineTo(frontWheelX - 2, wheelY + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (character.frameStyle === 'folding_signal') {
    // Signal flag waving behind
    const wave = Math.sin(pedalPhase * 2) * 3;
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-24, -10);
    ctx.lineTo(-27, -34);
    ctx.stroke();
    ctx.fillStyle = '#E29D3E';
    ctx.beginPath();
    ctx.moveTo(-27, -34);
    ctx.lineTo(-42, -30 + wave);
    ctx.lineTo(-27, -25);
    ctx.closePath();
    ctx.fill();
  }

  // Mounted Axis Weapons (or Axis enemy rifle)
  if (character.infiniteAmmo || isAxisEnemy) {
    ctx.fillStyle = '#2B3038';
    ctx.strokeStyle = '#8B95A1';
    ctx.lineWidth = 1.2;
    if (character.frameStyle === 'axis_mortar') {
      // Angled mortar tube on rear/top
      ctx.save();
      ctx.translate(4, -18);
      ctx.rotate(-0.55);
      ctx.fillRect(0, -4, 22, 8);
      ctx.strokeRect(0, -4, 22, 8);
      ctx.restore();
    } else if (character.frameStyle === 'axis_carbine') {
      ctx.fillRect(10, headY - 7, 26, 4);
      ctx.fillStyle = '#D9B15F';
      ctx.fillRect(16, headY - 10, 8, 3);
    } else {
      // Twin MG / standard Axis patrol gun barrel
      ctx.fillRect(11, headY - 8, 22, 5);
      ctx.fillStyle = '#4B5563';
      ctx.fillRect(13, headY - 3, 9, 5); // ammo box
    }
  }

  // Front Headlamp
  ctx.fillStyle = '#F2C96D';
  ctx.beginPath();
  ctx.arc(headX + 4, headY - 3, 3.6, 0, Math.PI * 2);
  ctx.fill();

  // ---- THE BIG DOG RIDER ----
  const bob = Math.sin(pedalPhase * 2) * 1.4;
  const fur = isAxisEnemy ? '#8F6A43' : character.furColor;
  const ear = isAxisEnemy ? '#3B2F25' : character.earColor;

  // Wagging tail
  const tailWag = Math.sin(pedalPhase * 2.5) * 0.35;
  ctx.save();
  ctx.translate(-16, -18 + bob);
  ctx.rotate(-0.6 + tailWag);
  ctx.strokeStyle = fur;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, -8, -14, -4);
  ctx.stroke();
  ctx.restore();

  // Pedaling hind leg
  const pedalX = crankX + Math.cos(pedalPhase) * 6;
  const pedalY = crankY + Math.sin(pedalPhase) * 6;
  ctx.strokeStyle = ear;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, -17 + bob);
  ctx.lineTo(-4, -7 + bob * 0.5);
  ctx.lineTo(pedalX, pedalY);
  ctx.stroke();

  // Dog torso
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(-6, -24 + bob, 13, 9, -0.35, 0, Math.PI * 2);
  ctx.fill();

  // Collar / scarf
  ctx.strokeStyle = isAxisEnemy ? '#9E3D3D' : character.primaryColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-1, -30 + bob);
  ctx.lineTo(6, -24 + bob);
  ctx.stroke();

  // Front paw reaching handlebar
  ctx.strokeStyle = fur;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(2, -25 + bob);
  ctx.lineTo(headX - 2, headY - 8);
  ctx.stroke();

  // Dog head
  const hx = 6;
  const hy = -35 + bob;
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.arc(hx, hy, 10, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(hx + 9, hy + 2, 7.5, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#1B1E23';
  ctx.beginPath();
  ctx.arc(hx + 15, hy + 0.5, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#1B1E23';
  ctx.beginPath();
  ctx.arc(hx + 4, hy - 2.5, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(hx + 4.6, hy - 3.1, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Flapping dog ear
  const earFlap = Math.sin(pedalPhase * 2) * 0.14;
  ctx.save();
  ctx.translate(hx - 4, hy - 3);
  ctx.rotate(0.25 + earFlap);
  ctx.fillStyle = ear;
  ctx.beginPath();
  ctx.ellipse(-2, 6, 4.2, 8.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Aviator goggles or Axis helmet
  if (isAxisEnemy || character.category === 'AXIS_INVASION') {
    ctx.fillStyle = '#4B5342';
    ctx.beginPath();
    ctx.arc(hx, hy - 2, 10.6, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#252B21';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    // Goggles resting on brow
    ctx.fillStyle = '#D9B15F';
    ctx.fillRect(hx - 2, hy - 10, 9, 4);
    ctx.fillStyle = '#8CD3E8';
    ctx.fillRect(hx + 2, hy - 9.5, 4, 3);
  }

  // Shield Dome if active
  if (shieldActive) {
    ctx.strokeStyle = 'rgba(92, 214, 178, 0.85)';
    ctx.fillStyle = 'rgba(92, 214, 178, 0.14)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -16, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();

  // Floating tag above rider (P1 / P2 / Axis badge)
  if (playerTag) {
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(18, 22, 27, 0.85)';
    ctx.fillRect(x - 16, drawY - 64, 32, 16);
    ctx.fillStyle = playerTag === 'P2' ? '#67B8E3' : '#E29D3E';
    ctx.fillText(playerTag, x, drawY - 52);
    ctx.restore();
  }
}

export function drawPickupItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: PickupType,
  time: number
) {
  const bob = Math.sin(time * 4 + x * 0.03) * 3.5;
  ctx.save();
  ctx.translate(x, y + bob);

  if (type === 'bone_normal' || type === 'bone_green' || type === 'bone_purple') {
    const isGreen = type === 'bone_green';
    const isPurple = type === 'bone_purple';

    // Glow halo for green (+2x) & purple (+6.5x)
    if (isGreen || isPurple) {
      const glowColor = isPurple ? 'rgba(169, 139, 255, 0.38)' : 'rgba(52, 211, 153, 0.35)';
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    const fill = isPurple ? '#B589FF' : isGreen ? '#4BE39E' : '#F2EBDD';
    const stroke = isPurple ? '#5B21B6' : isGreen ? '#0E744B' : '#8C7D65';

    ctx.rotate(-0.22);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.6;

    // Classic dog bone silhouette
    ctx.beginPath();
    ctx.roundRect(-10, -3.5, 20, 7, 2);
    ctx.fill();
    ctx.stroke();

    const knobs = [
      [-11, -3.8],
      [-11, 3.8],
      [11, -3.8],
      [11, 3.8],
    ];
    for (const [kx, ky] of knobs) {
      ctx.beginPath();
      ctx.arc(kx, ky, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (isGreen || isPurple) {
      ctx.rotate(0.22);
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isPurple ? '#E9D5FF' : '#D1FAE5';
      ctx.fillText(isPurple ? '+6.5x' : '+2x', 0, -14);
    }
  } else if (type === 'bandage') {
    // 绷带: Rolled white gauze with red cross mark
    const grad = ctx.createRadialGradient(0, 0, 3, 0, 0, 20);
    grad.addColorStop(0, 'rgba(248, 113, 113, 0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-11, -8, 22, 16, 4);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(-4, 8);
    ctx.moveTo(4, -8);
    ctx.lineTo(4, 8);
    ctx.stroke();

    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-3, -1.5, 6, 3);
    ctx.fillRect(-1.5, -3, 3, 6);

    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FCA5A5';
    ctx.fillText('绷带', 0, -13);
  } else if (type === 'medkit') {
    // 医疗包: Olive/Ivory first-aid metal tin with bright cross
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
    grad.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E5B45';
    ctx.strokeStyle = '#A7F3D0';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-13, -10, 26, 20, 3);
    ctx.fill();
    ctx.stroke();

    // Handle
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(-5, -14);
    ctx.lineTo(5, -14);
    ctx.lineTo(5, -10);
    ctx.stroke();

    // White cross
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-6, -2, 12, 4);
    ctx.fillRect(-2, -6, 4, 12);

    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#A7F3D0';
    ctx.fillText('医疗包', 0, -18);
  }

  ctx.restore();
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: 'crate' | 'barricade' | 'puddle'
) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'crate') {
    ctx.fillStyle = '#7B5434';
    ctx.strokeStyle = '#3B2514';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -20, 32, 26, 3);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -18);
    ctx.lineTo(14, 4);
    ctx.moveTo(14, -18);
    ctx.lineTo(-14, 4);
    ctx.stroke();
  } else if (kind === 'barricade') {
    // Striped wooden roadblock
    ctx.fillStyle = '#3F444C';
    ctx.fillRect(-14, -18, 5, 24);
    ctx.fillRect(9, -18, 5, 24);
    ctx.fillStyle = '#D97724';
    ctx.fillRect(-19, -16, 38, 9);
    ctx.fillStyle = '#F4F1EA';
    ctx.fillRect(-12, -16, 7, 9);
    ctx.fillRect(5, -16, 7, 9);
  } else {
    // Mud/oil puddle
    ctx.fillStyle = 'rgba(30, 24, 18, 0.78)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(130, 105, 76, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawWeatherForeground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  weather: WeatherType,
  intensity: number,
  particles: WeatherParticle[],
  elapsed: number,
  darknessAlpha: number
) {
  if (weather === 'clear' || intensity <= 0.02) return;

  ctx.save();
  // Soften weather opacity slightly if world is near pitch-black so headlights stay dominant
  const visScale = darknessAlpha > 0.7 ? 0.55 : 1;

  if (weather === 'rain') {
    ctx.strokeStyle = `rgba(176, 216, 246, ${0.42 * intensity * visScale})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const p of particles) {
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 9, p.y + 18);
    }
    ctx.stroke();

    // Subtle rain splash ellipses on road surface
    ctx.strokeStyle = `rgba(190, 225, 255, ${0.24 * intensity * visScale})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i += 5) {
      const p = particles[i];
      if (p.y > 160 && p.y < 465) {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 4, 1.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else if (weather === 'fog') {
    // Layered misty fog overlay + drifting soft fog banks
    const fogGrad = ctx.createLinearGradient(0, 0, w, 0);
    const baseOpacity = 0.24 * intensity * visScale;
    fogGrad.addColorStop(0, `rgba(186, 200, 214, ${baseOpacity * 0.4})`);
    fogGrad.addColorStop(0.55, `rgba(195, 208, 220, ${baseOpacity * 0.85})`);
    fogGrad.addColorStop(1, `rgba(205, 218, 228, ${baseOpacity * 1.25})`);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 6; i++) {
      const bandX = ((i * 260 - elapsed * (45 + i * 11)) % (w + 360)) + w * 0.2;
      const wrappedX = bandX < -240 ? bandX + w + 360 : bandX;
      const bandY = 95 + (i % 3) * 145 + Math.sin(elapsed * 0.6 + i) * 14;
      const grad = ctx.createRadialGradient(wrappedX, bandY, 20, wrappedX, bandY, 210);
      grad.addColorStop(0, `rgba(206, 218, 228, ${0.22 * intensity * visScale})`);
      grad.addColorStop(1, 'rgba(206, 218, 228, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(wrappedX, bandY, 220, 72, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === 'snow') {
    // Cool winter atmospheric veil
    ctx.fillStyle = `rgba(180, 210, 236, ${0.07 * intensity * visScale})`;
    ctx.fillRect(0, 0, w, h);

    for (const p of particles) {
      ctx.fillStyle = `rgba(240, 247, 255, ${p.alpha * intensity * visScale})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawFinishGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  roadTop: number,
  roadBottom: number,
  elapsed: number
) {
  ctx.save();

  // Checkered finish line painted across all road lanes
  const cellSize = 12;
  const rows = Math.ceil((roadBottom - roadTop) / cellSize);
  for (let r = 0; r < rows; r++) {
    const cy = roadTop + r * cellSize;
    const ch = Math.min(cellSize, roadBottom - cy);
    for (let c = 0; c < 2; c++) {
      const isLight = (r + c) % 2 === 0;
      ctx.fillStyle = isLight ? 'rgba(244, 241, 234, 0.9)' : 'rgba(22, 26, 32, 0.9)';
      ctx.fillRect(x - cellSize + c * cellSize, cy, cellSize, ch);
    }
  }

  // Far pillar & near pillar
  const topArchY = roadTop - 64;
  ctx.fillStyle = '#3B424C';
  ctx.fillRect(x - 6, topArchY, 12, roadTop - topArchY + 8);
  ctx.fillRect(x - 6, roadBottom - 4, 12, 34);

  // Overhead banner board
  ctx.fillStyle = '#1E252E';
  ctx.strokeStyle = '#E29D3E';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x - 56, topArchY - 26, 112, 30, 6);
  ctx.fill();
  ctx.stroke();

  ctx.font = '700 14px "Outfit", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F2EFE9';
  ctx.fillText('终点线 FINISH', x, topArchY - 6);

  // Fluttering pennant flags at top
  const wave = Math.sin(elapsed * 6) * 4;
  ctx.fillStyle = '#E29D3E';
  ctx.beginPath();
  ctx.moveTo(x - 50, topArchY - 26);
  ctx.lineTo(x - 50, topArchY - 46);
  ctx.lineTo(x - 26, topArchY - 38 + wave);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#34B37B';
  ctx.beginPath();
  ctx.moveTo(x + 50, topArchY - 26);
  ctx.lineTo(x + 50, topArchY - 46);
  ctx.lineTo(x + 26, topArchY - 38 - wave);
  ctx.closePath();
  ctx.fill();

  // Warm lantern glow on arch
  const glow = ctx.createRadialGradient(x, topArchY + 6, 4, x, topArchY + 6, 48);
  glow.addColorStop(0, 'rgba(226, 157, 62, 0.45)');
  glow.addColorStop(1, 'rgba(226, 157, 62, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, topArchY + 6, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export interface FallenCyclistRender {
  x: number;
  y: number;
  z: number; // bounce height above asphalt
  angle: number; // tumble rotation (0 upright -> ~1.42 rad tipped flat on side)
  skidDist: number; // skid mark length behind bike
  wheelSpin: number;
  character: CharacterDef;
  isAxisEnemy?: boolean;
  label?: string;
}

export function drawFallenCyclist(ctx: CanvasRenderingContext2D, f: FallenCyclistRender) {
  const { x, y, z, angle, skidDist, wheelSpin, character, isAxisEnemy, label } = f;

  ctx.save();

  // 1. Dark rubber skid marks trailing across the tarmac
  if (skidDist > 4) {
    ctx.strokeStyle = 'rgba(15, 18, 22, 0.55)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - Math.min(85, skidDist), y + 5);
    ctx.lineTo(x - 10, y + 4);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - Math.min(70, skidDist * 0.8), y - 3);
    ctx.lineTo(x - 4, y - 2);
    ctx.stroke();
  }

  // 2. Ground shadow beneath tumbling cyclist
  const shadowScale = Math.max(0.55, 1 - z / 90);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(x, y + 7, 38 * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Fallen bicycle frame & sprawled dog rider
  ctx.translate(x, y - z);
  ctx.rotate(angle);

  // Squash vertically slightly once flat on road for perspective foreshortening
  const flatFactor = Math.min(1, Math.abs(angle) / 1.35);
  ctx.scale(1, 1 - flatFactor * 0.25);

  const frameColor = isAxisEnemy ? '#5D6652' : character.primaryColor;
  const fur = isAxisEnemy ? '#8F6A43' : character.furColor;
  const ear = isAxisEnemy ? '#3B2F25' : character.earColor;

  // Tipped wheels (still spinning down)
  const drawWreckWheel = (wx: number, wy: number, r: number) => {
    ctx.strokeStyle = '#181B20';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(wx, wy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(wx, wy, r - 2.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(215, 224, 235, 0.5)';
    ctx.lineWidth = 1;
    for (let s = 0; s < 5; s++) {
      const ang = wheelSpin + (s * Math.PI) / 2.5;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(ang) * (r - 3), wy + Math.sin(ang) * (r - 3));
      ctx.lineTo(wx - Math.cos(ang) * (r - 3), wy - Math.sin(ang) * (r - 3));
      ctx.stroke();
    }
  };

  drawWreckWheel(-22, 4, 14);
  drawWreckWheel(24, 2, 14);

  // Bent bicycle frame
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, 4);
  ctx.lineTo(-10, -13);
  ctx.lineTo(15, -14);
  ctx.lineTo(-2, 3);
  ctx.closePath();
  ctx.moveTo(15, -14);
  ctx.lineTo(24, 2);
  ctx.stroke();

  // Twisted handlebar
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(15, -14);
  ctx.lineTo(19, -22);
  ctx.stroke();

  // Sprawled Dog Rider ejected slightly forward/beside the saddle
  ctx.save();
  ctx.translate(16, -4);
  ctx.rotate(0.45);

  // Sprawled limbs
  ctx.strokeStyle = ear;
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-12, 2);
  ctx.lineTo(-22, 7);
  ctx.moveTo(4, 2);
  ctx.lineTo(14, 8);
  ctx.stroke();

  // Dog torso
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(-4, 0, 13, 8.5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(11, -3, 9.5, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.beginPath();
  ctx.ellipse(20, -1, 6.5, 4.5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#1B1E23';
  ctx.beginPath();
  ctx.arc(25, -2, 2.3, 0, Math.PI * 2);
  ctx.fill();

  // Dizzy "X" eye
  ctx.strokeStyle = '#1B1E23';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(10, -6);
  ctx.lineTo(14, -2);
  ctx.moveTo(14, -6);
  ctx.lineTo(10, -2);
  ctx.stroke();

  // Flopped ear
  ctx.fillStyle = ear;
  ctx.beginPath();
  ctx.ellipse(6, 4, 4, 8, 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.restore();

  if (label) {
    ctx.save();
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.fillText(label, x, y - z - 28);
    ctx.restore();
  }
}

export interface GroundBloodSplatter {
  x: number;
  y: number;
  radius: number;
  rotation: number;
  lobes: number[]; // irregular organic splash rim radii
  droplets: { dx: number; dy: number; rx: number; ry: number; rot: number }[];
  freshness: number; // 0.72..1.0
}

export interface AirBloodDroplet {
  x: number;
  groundY: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  dark: boolean;
}

export function drawGroundBloodSplatters(
  ctx: CanvasRenderingContext2D,
  splatters: GroundBloodSplatter[]
) {
  if (splatters.length === 0) return;
  ctx.save();
  for (const b of splatters) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(1, 0.56); // Perspective foreshortening onto asphalt plane
    ctx.rotate(b.rotation);

    // 1. Dark soaked asphalt rim around blood stain
    const count = b.lobes.length;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = b.radius * b.lobes[i] * 1.14;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(42, 6, 8, 0.55)';
    ctx.fill();

    // 2. Main arterial/venous crimson blood pool
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = b.radius * b.lobes[i];
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const poolGrad = ctx.createRadialGradient(
      -b.radius * 0.2,
      -b.radius * 0.15,
      b.radius * 0.1,
      0,
      0,
      b.radius * 1.15
    );
    poolGrad.addColorStop(0, b.freshness > 0.85 ? '#B91C1C' : '#991B1B');
    poolGrad.addColorStop(0.65, '#7F1D1D');
    poolGrad.addColorStop(1, '#450A0A');
    ctx.fillStyle = poolGrad;
    ctx.fill();

    // 3. Subtle wet sheen highlight
    ctx.fillStyle = `rgba(239, 68, 68, ${0.22 * b.freshness})`;
    ctx.beginPath();
    ctx.ellipse(-b.radius * 0.22, -b.radius * 0.18, b.radius * 0.34, b.radius * 0.2, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // 4. Directional splash droplets & micro-streaks radiated around stain
    ctx.fillStyle = '#7F1D1D';
    for (const d of b.droplets) {
      ctx.beginPath();
      ctx.ellipse(d.dx, d.dy, d.rx, d.ry, d.rot, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
  ctx.restore();
}

export function drawAirBloodDroplets(
  ctx: CanvasRenderingContext2D,
  droplets: AirBloodDroplet[]
) {
  if (droplets.length === 0) return;
  ctx.save();
  for (const d of droplets) {
    // Tiny ground shadow below flying droplet
    ctx.fillStyle = 'rgba(20, 4, 6, 0.22)';
    ctx.beginPath();
    ctx.ellipse(d.x, d.groundY, d.size * 0.7, d.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Velocity-stretched blood droplet streak in flight
    const drawY = d.groundY - d.z;
    const tailX = d.x - d.vx * 0.022;
    const tailY = drawY - (d.vy - d.vz) * 0.022;

    ctx.strokeStyle = d.dark ? '#7F1D1D' : '#DC2626';
    ctx.lineWidth = Math.max(1.4, d.size * 0.85);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(d.x, drawY);
    ctx.stroke();

    ctx.fillStyle = d.dark ? '#991B1B' : '#EF4444';
    ctx.beginPath();
    ctx.arc(d.x, drawY, d.size * 0.58, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export interface GroundCrater {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rimOffsets: number[];
  crackAngles: number[];
  pebbles: { dx: number; dy: number; r: number; light: boolean }[];
}

export function drawGroundCraters(ctx: CanvasRenderingContext2D, craters: GroundCrater[]) {
  if (craters.length === 0) return;
  ctx.save();
  for (const c of craters) {
    ctx.save();
    ctx.translate(c.x, c.y);

    // 1. Outer charred blast soot halo on asphalt
    const soot = ctx.createRadialGradient(0, 0, c.radiusX * 0.35, 0, 0, c.radiusX * 1.55);
    soot.addColorStop(0, 'rgba(6, 7, 9, 0.78)');
    soot.addColorStop(0.58, 'rgba(14, 16, 20, 0.45)');
    soot.addColorStop(1, 'rgba(14, 16, 20, 0)');
    ctx.fillStyle = soot;
    ctx.beginPath();
    ctx.ellipse(0, 0, c.radiusX * 1.55, c.radiusY * 1.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Jagged radial cracks splitting outward through road tarmac
    for (let i = 0; i < c.crackAngles.length; i++) {
      const ang = c.crackAngles[i];
      const len = 1.15 + (i % 3) * 0.22;
      const sx = Math.cos(ang) * c.radiusX * 0.72;
      const sy = Math.sin(ang) * c.radiusY * 0.72;
      const mx = Math.cos(ang + 0.08) * c.radiusX * (len * 0.85);
      const my = Math.sin(ang + 0.08) * c.radiusY * (len * 0.85);
      const ex = Math.cos(ang - 0.05) * c.radiusX * (len * 1.18);
      const ey = Math.sin(ang - 0.05) * c.radiusY * (len * 1.18);

      ctx.strokeStyle = 'rgba(130, 138, 148, 0.22)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy + 1);
      ctx.lineTo(mx, my + 1);
      ctx.lineTo(ex, ey + 1);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(8, 10, 12, 0.88)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(mx, my);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    // Build jagged polygonal blast rim path
    const tracePit = (scale = 1, ox = 0, oy = 0) => {
      const count = c.rimOffsets.length;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const rMul = c.rimOffsets[i];
        const px = ox + Math.cos(a) * c.radiusX * rMul * scale;
        const py = oy + Math.sin(a) * c.radiusY * rMul * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    // 3. Upheaved broken asphalt lip (bright crushed edge on lower-right)
    tracePit(1.06, 1.5, 1.8);
    ctx.fillStyle = 'rgba(96, 102, 112, 0.58)';
    ctx.fill();

    // 4. Deep sunken crater interior with directional shadow depth
    tracePit(0.95, 0, 0);
    const pitGrad = ctx.createLinearGradient(
      -c.radiusX * 0.6,
      -c.radiusY * 0.8,
      c.radiusX * 0.7,
      c.radiusY * 0.8
    );
    pitGrad.addColorStop(0, '#090B0E');
    pitGrad.addColorStop(0.55, '#191B1E');
    pitGrad.addColorStop(1, '#312A24');
    ctx.fillStyle = pitGrad;
    ctx.fill();

    // Inner rim dark shadow bevel on upper edge
    ctx.strokeStyle = 'rgba(5, 6, 8, 0.92)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Sub-pit deepest core
    tracePit(0.52, -c.radiusX * 0.08, -c.radiusY * 0.06);
    ctx.fillStyle = 'rgba(5, 6, 8, 0.85)';
    ctx.fill();

    // 5. Exposed gravel & pulverized asphalt rubble inside and along the rim
    for (const pb of c.pebbles) {
      ctx.fillStyle = pb.light ? '#69717C' : '#262320';
      ctx.beginPath();
      ctx.arc(pb.dx, pb.dy, pb.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
  ctx.restore();
}

export interface GroundSpark {
  x: number;
  groundY: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
}

export function drawGroundSparks(ctx: CanvasRenderingContext2D, sparks: GroundSpark[]) {
  if (sparks.length === 0) return;
  ctx.save();
  for (const sp of sparks) {
    const t = Math.max(0, sp.life / sp.maxLife);
    const sy = sp.groundY - sp.z;

    // Ground glow reflection under hot spark
    if (sp.z < 24) {
      ctx.fillStyle = `rgba(253, 186, 116, ${0.28 * t})`;
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.groundY, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Incandescent streak tail
    const tailX = sp.x - sp.vx * 0.022;
    const tailY = sy - (sp.vy - sp.vz) * 0.022;
    ctx.strokeStyle = sp.color;
    ctx.globalAlpha = Math.min(1, t * 1.2);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(sp.x, sy);
    ctx.stroke();

    // White-hot spark core
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(sp.x, sy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export interface RubbleChunk {
  x: number;
  groundY: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  angle: number;
  spin: number;
  life: number;
  maxLife: number;
}

export function drawRubbleChunks(ctx: CanvasRenderingContext2D, chunks: RubbleChunk[]) {
  if (chunks.length === 0) return;
  ctx.save();
  for (const r of chunks) {
    const alpha = Math.min(1, (r.life / r.maxLife) * 1.4);
    ctx.globalAlpha = alpha;
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(r.x, r.groundY, r.size * 0.8, r.size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spinning asphalt chunk
    ctx.save();
    ctx.translate(r.x, r.groundY - r.z);
    ctx.rotate(r.angle);
    ctx.fillStyle = '#3B3F46';
    ctx.strokeStyle = '#181A1E';
    ctx.lineWidth = 1;
    ctx.fillRect(-r.size * 0.5, -r.size * 0.4, r.size, r.size * 0.8);
    ctx.strokeRect(-r.size * 0.5, -r.size * 0.4, r.size, r.size * 0.8);
    ctx.restore();
  }
  ctx.restore();
}

export interface SmokePuff {
  x: number;
  groundY: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  life: number;
  maxLife: number;
  dark: boolean;
}

export interface ExplosionEffect {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export function drawExplosionsAndSmoke(
  ctx: CanvasRenderingContext2D,
  explosions: ExplosionEffect[],
  smokes: SmokePuff[]
) {
  ctx.save();
  // Smoke clouds first
  for (const sm of smokes) {
    const progress = 1 - sm.life / sm.maxLife;
    const alpha = Math.max(0, (1 - progress) * (sm.dark ? 0.52 : 0.28));
    const curR = sm.radius * (0.7 + progress * 1.25);
    const drawY = sm.groundY - sm.z;
    const grad = ctx.createRadialGradient(sm.x, drawY, curR * 0.1, sm.x, drawY, curR);
    if (sm.dark) {
      grad.addColorStop(0, `rgba(28, 30, 34, ${alpha})`);
      grad.addColorStop(0.65, `rgba(48, 52, 58, ${alpha * 0.65})`);
      grad.addColorStop(1, 'rgba(48, 52, 58, 0)');
    } else {
      grad.addColorStop(0, `rgba(210, 215, 220, ${alpha})`);
      grad.addColorStop(1, 'rgba(180, 185, 192, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sm.x, drawY, curR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fiery blast shockwave & incandescent core
  for (const ex of explosions) {
    const progress = 1 - ex.life / ex.maxLife;
    const fade = Math.max(0, 1 - progress);
    const curR = ex.radius * (0.35 + progress * 0.85);

    // Shockwave ring on asphalt
    ctx.strokeStyle = `rgba(255, 225, 160, ${fade * 0.72})`;
    ctx.lineWidth = Math.max(1.2, 4.5 * fade);
    ctx.beginPath();
    ctx.ellipse(ex.x, ex.y, curR * 1.22, curR * 0.56, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Fireball glow
    const fireGrad = ctx.createRadialGradient(ex.x, ex.y - 8, 2, ex.x, ex.y - 8, curR);
    fireGrad.addColorStop(0, `rgba(255, 250, 225, ${fade * 0.96})`);
    fireGrad.addColorStop(0.35, `rgba(251, 146, 60, ${fade * 0.88})`);
    fireGrad.addColorStop(0.75, `rgba(220, 38, 38, ${fade * 0.45})`);
    fireGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y - 8, curR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGrenadeProjectile(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  z: number,
  spin: number,
  fromPlayer: boolean
) {
  ctx.save();
  // Impact warning reticle / drop shadow on road
  const shadowScale = Math.max(0.45, 1 - z / 150);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x, groundY, 10 * shadowScale, 4.5 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!fromPlayer) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x, groundY, 20, 8.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Spinning military hand grenade in flight
  const drawY = groundY - z;
  ctx.translate(x, drawY);
  ctx.rotate(spin);

  // Olive-steel grenade body (pineapple/fragmentation shell)
  ctx.fillStyle = fromPlayer ? '#4D5D43' : '#5F3B33';
  ctx.strokeStyle = '#181C18';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 1, 5.8, 7.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Grid score lines on shell
  ctx.strokeStyle = 'rgba(18, 22, 18, 0.55)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-4, 1);
  ctx.lineTo(4, 1);
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 7);
  ctx.stroke();

  // Fuse cap & lever
  ctx.fillStyle = '#9CA3AF';
  ctx.fillRect(-2.2, -8, 4.4, 3);

  // Burning fuse spark
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(3, -8.5, 2.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}




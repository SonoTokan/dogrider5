import React, { useEffect, useRef } from 'react';
import { drawDogOnBicycle } from '../canvas/bikeRenderer';
import { CharacterDef } from '../types/game';

interface BikePreviewCanvasProps {
  character: CharacterDef;
  width?: number;
  height?: number;
  className?: string;
}

export const BikePreviewCanvas: React.FC<BikePreviewCanvasProps> = ({
  character,
  width = 220,
  height = 120,
  className = '',
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
    let last = performance.now();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      phase += dt * 7;

      ctx.clearRect(0, 0, width, height);

      // Subtle rolling road line
      ctx.fillStyle = '#1D232B';
      ctx.fillRect(0, height - 24, width, 24);
      ctx.fillStyle = 'rgba(229, 217, 190, 0.25)';
      const offset = (phase * 18) % 44;
      for (let x = -offset; x < width + 44; x += 44) {
        ctx.fillRect(x, height - 13, 22, 2);
      }

      ctx.save();
      ctx.translate(width * 0.5, height - 30);
      ctx.scale(1.22, 1.22);
      drawDogOnBicycle(ctx, {
        x: 0,
        y: 0,
        jumpOffset: 0,
        pedalPhase: phase,
        leanAngle: 0,
        character,
        hp: character.stats.maxHp,
        maxHp: character.stats.maxHp,
        shieldActive: false,
        dashActive: false,
        hurtFlash: 0,
        isAxisEnemy: false,
      });
      ctx.restore();
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [character, width, height]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={`block w-full h-auto rounded-xl bg-[#13171D] ${className}`}
    />
  );
};

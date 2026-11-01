'use client';

import { useRef, useEffect } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Twinkling starfield on a canvas, filling its positioned parent. Stars drift
 * very slowly and the odd shooting star crosses; with reduced motion it draws
 * one still frame.
 */
export function Starfield({ density = 1, shooting = true, sx }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;

    const still = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let stars = [];
    let meteor = null;
    let frame = 0;

    const seed = () => {
      const count = Math.round(((width * height) / 2600) * density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.08 ? 1.1 + Math.random() * 0.9 : 0.3 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.6,
        // A few warm and cool stars among the white ones.
        hue:
          Math.random() < 0.15
            ? Math.random() < 0.5
              ? '255,214,170'
              : '170,200,255'
            : '255,255,255',
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (time) => {
      const t = time / 1000;
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const twinkle = still ? 0.8 : 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
        const x = still ? s.x : (s.x + t * 2 * s.r) % width;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.hue},${twinkle})`;
        ctx.arc(x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.2) {
          ctx.fillStyle = `rgba(${s.hue},${twinkle * 0.12})`;
          ctx.beginPath();
          ctx.arc(x, s.y, s.r * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!still && shooting) {
        if (!meteor && Math.random() < 0.004) {
          meteor = {
            x: Math.random() * width * 0.8,
            y: Math.random() * height * 0.4,
            vx: 5 + Math.random() * 4,
            vy: 2 + Math.random() * 2,
            life: 1,
          };
        }
        if (meteor) {
          const { x, y, vx, vy, life } = meteor;
          const grad = ctx.createLinearGradient(x, y, x - vx * 12, y - vy * 12);
          grad.addColorStop(0, `rgba(255,255,255,${life})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - vx * 12, y - vy * 12);
          ctx.stroke();
          meteor.x += vx;
          meteor.y += vy;
          meteor.life -= 0.015;
          if (meteor.life <= 0 || meteor.x > width || meteor.y > height) meteor = null;
        }
      }

      if (!still) frame = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      if (still) draw(0);
    });
    observer.observe(canvas);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [density, shooting]);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        width: 1,
        height: 1,
        pointerEvents: 'none',
        ...sx,
      }}
    />
  );
}

// ----------------------------------------------------------------------

/** Night-sky sx: nebula gradients tinted with the topic colour. Pair with <Starfield />. */
export const cosmicSx = (tint = '#7C4DFF') => ({
  position: 'relative',
  overflow: 'hidden',
  color: '#fff',
  bgcolor: '#070818',
  backgroundImage: [
    `radial-gradient(ellipse at 18% 22%, ${tint}55 0%, transparent 45%)`,
    'radial-gradient(ellipse at 85% 80%, #00B8D940 0%, transparent 50%)',
    'radial-gradient(ellipse at 60% 10%, #FF563022 0%, transparent 40%)',
    'linear-gradient(160deg, #0B0D2A 0%, #070818 60%, #120A2E 100%)',
  ].join(','),
});

/** Deep-space backdrop: nebula gradients + starfield behind the children. */
export function CosmicPanel({ children, tint, density, sx }) {
  return (
    <Box sx={{ ...cosmicSx(tint), borderRadius: 2, ...sx }}>
      <Starfield density={density} />
      <Box sx={{ position: 'relative' }}>{children}</Box>
    </Box>
  );
}

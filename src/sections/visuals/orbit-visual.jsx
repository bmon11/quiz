'use client';

import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { CosmicPanel } from './starfield';

// ----------------------------------------------------------------------

const VIEW = 800;
const C = VIEW / 2;
const SUN_R = 38;
const R_MIN = 74;
const R_MAX = 378;

/** Simulated Earth days per real second. */
const SPEEDS = [
  { value: 0, icon: 'solar:pause-bold' },
  { value: 20, label: '20d/s' },
  { value: 120, label: '120d/s' },
  { value: 1000, label: '1000d/s' },
];

const bodyRadius = (size) => 3 + size * 2.1;

/** Log-scaled orbit radii, so Mercury and Pluto both fit on screen. */
const orbitScale = (bodies) => {
  const ds = bodies.map((b) => b.distanceAu).filter((d) => d > 0);
  const lo = Math.log(Math.min(...ds));
  const hi = Math.log(Math.max(...ds));
  return (d) => (hi === lo ? R_MAX : R_MIN + ((Math.log(d) - lo) / (hi - lo)) * (R_MAX - R_MIN));
};

// ----------------------------------------------------------------------

export function OrbitVisual({ visual, color }) {
  const { s, t } = useLang();
  const bodies = useMemo(() => visual.bodies ?? [], [visual.bodies]);
  const radiusOf = useMemo(() => orbitScale(bodies), [bodies]);
  const [selected, setSelected] = useState(null); // body id, 'star' or null
  const [speed, setSpeed] = useState(20);

  const nodes = useRef({});
  const days = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // Start positions spread out deterministically, so the first frame isn't a line.
  const phases = useMemo(() => bodies.map((_, i) => (i * 2.399963) % (Math.PI * 2)), [bodies]);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let last = performance.now();

    const place = () => {
      bodies.forEach((b, i) => {
        const el = nodes.current[b.id];
        if (!el) return;
        const angle = phases[i] - (2 * Math.PI * days.current) / b.periodDays;
        const r = radiusOf(b.distanceAu);
        el.setAttribute(
          'transform',
          `translate(${C + r * Math.cos(angle)} ${C + r * Math.sin(angle)})`
        );
      });
      const belt = nodes.current.__belt;
      if (belt) belt.setAttribute('transform', `rotate(${(-days.current / 1600) * 360} ${C} ${C})`);
    };

    const tick = (now) => {
      days.current += ((now - last) / 1000) * (reduced ? 0 : speedRef.current);
      last = now;
      place();
      frame = requestAnimationFrame(tick);
    };

    place();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [bodies, phases, radiusOf]);

  // Asteroid belt between Mars and Jupiter (≈2.2–3.2 AU), when both are shown.
  const belt = useMemo(() => {
    if (!bodies.some((b) => b.distanceAu > 3.2) || !bodies.some((b) => b.distanceAu < 2.2))
      return [];
    let x = 7;
    const rand = () => {
      x = (x * 16807) % 2147483647;
      return x / 2147483647;
    };
    return Array.from({ length: 220 }, () => {
      const r = radiusOf(2.2 + rand() * 1.0);
      const a = rand() * Math.PI * 2;
      return { x: C + r * Math.cos(a), y: C + r * Math.sin(a), r: 0.6 + rand() * 1.1 };
    });
  }, [bodies, radiusOf]);

  const active = selected === 'star' ? null : bodies.find((b) => b.id === selected);
  const toggle = (id) => setSelected((cur) => (cur === id ? null : id));

  return (
    <Box>
      <CosmicPanel tint={color} sx={{ mb: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, pt: 1.5, gap: 1, flexWrap: 'wrap' }}
        >
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {s.orbitHint}
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={speed}
            onChange={(_, v) => v !== null && setSpeed(v)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiToggleButton-root': {
                color: 'rgba(255,255,255,0.7)',
                border: 0,
                px: 1.25,
                fontSize: 12,
              },
              '& .Mui-selected': {
                color: '#fff !important',
                bgcolor: 'rgba(255,255,255,0.18) !important',
              },
            }}
          >
            {SPEEDS.map((sp) => (
              <ToggleButton key={sp.value} value={sp.value} aria-label={sp.label ?? s.pause}>
                {sp.icon ? <Iconify icon={sp.icon} width={16} /> : sp.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Box
          component="svg"
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          role="img"
          aria-label={t(visual.star?.name)}
          sx={{
            display: 'block',
            width: 1,
            maxWidth: 720,
            mx: 'auto',
            touchAction: 'manipulation',
          }}
        >
          <defs>
            <radialGradient id="orbit-sun" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#FFF6C8" />
              <stop offset="45%" stopColor={visual.star?.color ?? '#FDB813'} />
              <stop offset="100%" stopColor="#F26B1D" />
            </radialGradient>
            <radialGradient id="orbit-corona">
              <stop offset="40%" stopColor="#FDB813" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#FDB813" stopOpacity="0" />
            </radialGradient>
            {bodies.map((b) => (
              <radialGradient key={b.id} id={`orbit-${b.id}`} cx="35%" cy="35%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
                <stop offset="25%" stopColor={b.color} />
                <stop offset="100%" stopColor={b.color2 ?? b.color} />
              </radialGradient>
            ))}
            <filter id="orbit-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Orbits */}
          {bodies.map((b) => (
            <circle
              key={b.id}
              cx={C}
              cy={C}
              r={radiusOf(b.distanceAu)}
              fill="none"
              stroke={selected === b.id ? b.color : 'rgba(255,255,255,0.16)'}
              strokeWidth={selected === b.id ? 2 : 1}
              strokeDasharray={b.size < 2 ? '3 5' : undefined}
              style={{ transition: 'stroke 200ms' }}
            />
          ))}

          {/* Asteroid belt */}
          <g ref={(el) => (nodes.current.__belt = el)}>
            {belt.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="rgba(210,190,160,0.55)" />
            ))}
          </g>

          {/* Sun */}
          <g style={{ cursor: 'pointer' }} onClick={() => toggle('star')}>
            <Box
              component="circle"
              cx={C}
              cy={C}
              r={SUN_R * 1.9}
              fill="url(#orbit-corona)"
              sx={{
                transformOrigin: 'center',
                transformBox: 'fill-box',
                animation: 'orbitPulse 4s ease-in-out infinite',
                '@keyframes orbitPulse': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 0.85 },
                  '50%': { transform: 'scale(1.12)', opacity: 1 },
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
            <circle cx={C} cy={C} r={SUN_R} fill="url(#orbit-sun)" filter="url(#orbit-glow)" />
          </g>

          {/* Bodies */}
          {bodies.map((b) => {
            const r = bodyRadius(b.size);
            const isSel = selected === b.id;
            return (
              <g
                key={b.id}
                ref={(el) => (nodes.current[b.id] = el)}
                style={{ cursor: 'pointer' }}
                onClick={() => toggle(b.id)}
              >
                {/* Generous tap target */}
                <circle r={Math.max(r + 10, 18)} fill="transparent" />
                {isSel && (
                  <circle r={r + 7} fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.8">
                    <animate
                      attributeName="r"
                      values={`${r + 5};${r + 10};${r + 5}`}
                      dur="1.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                {b.ring && (
                  <ellipse
                    rx={r * 2}
                    ry={r * 0.6}
                    fill="none"
                    stroke={b.color2 ?? b.color}
                    strokeOpacity="0.85"
                    strokeWidth={Math.max(1.5, r * 0.28)}
                    transform="rotate(-20)"
                  />
                )}
                <circle r={r} fill={`url(#orbit-${b.id})`} />
                <text
                  y={r + 15}
                  textAnchor="middle"
                  fill="#fff"
                  fillOpacity={isSel ? 1 : 0.75}
                  fontSize={isSel ? 17 : 14}
                  fontWeight={isSel ? 700 : 500}
                  style={{ pointerEvents: 'none', paintOrder: 'stroke' }}
                  stroke="#070818"
                  strokeWidth="3"
                >
                  {t(b.name)}
                </text>
              </g>
            );
          })}
        </Box>

        {/* Quick picker — also the keyboard-accessible way in */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2, pb: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}
        >
          {visual.star && (
            <PickChip
              label={t(visual.star.name)}
              dot={visual.star.color}
              on={selected === 'star'}
              onClick={() => toggle('star')}
            />
          )}
          {bodies.map((b) => (
            <PickChip
              key={b.id}
              label={t(b.name)}
              dot={b.color}
              on={selected === b.id}
              onClick={() => toggle(b.id)}
            />
          ))}
        </Stack>
      </CosmicPanel>

      {selected === 'star' && visual.star && (
        <BodyPanel body={visual.star} accent={visual.star.color} />
      )}
      {active && <BodyPanel body={active} accent={active.color} />}
    </Box>
  );
}

// ----------------------------------------------------------------------

function PickChip({ label, dot, on, onClick }) {
  return (
    <Chip
      clickable
      onClick={onClick}
      label={label}
      icon={
        <Box
          sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dot, ml: '8px !important' }}
        />
      }
      sx={{
        flexShrink: 0,
        color: '#fff',
        bgcolor: on ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${on ? dot : 'transparent'}`,
        '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
      }}
    />
  );
}

export function BodyPanel({ body, accent }) {
  const { s, t } = useLang();

  return (
    <Box
      key={t(body.name)}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        border: `1px solid ${accent}55`,
        background: `linear-gradient(135deg, ${accent}1F, transparent 70%)`,
        animation: 'panelIn 260ms ease-out',
        '@keyframes panelIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'none' },
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #fff9, ${accent} 30%, ${body.color2 ?? accent})`,
            boxShadow: `0 0 24px ${accent}88`,
          }}
        />
        <Box>
          <Typography variant="h5">{t(body.name)}</Typography>
          {body.kind && (
            <Typography variant="body2" sx={{ color: accent, fontWeight: 700 }}>
              {t(body.kind)}
              {body.moons != null && ` · ${body.moons} ${s.moons}`}
            </Typography>
          )}
        </Box>
      </Stack>

      {body.stats?.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            mb: 2.5,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          {body.stats.map((st, i) => (
            <Box key={i} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {t(st.label)}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {t(st.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Stack component="ul" spacing={1}>
        {(body.facts ?? []).map((fact, i) => (
          <Typography component="li" key={i} sx={{ display: 'flex', gap: 1.25 }}>
            <Iconify
              icon="solar:star-shine-bold"
              width={18}
              sx={{ color: accent, flexShrink: 0, mt: '3px' }}
            />
            {t(fact)}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

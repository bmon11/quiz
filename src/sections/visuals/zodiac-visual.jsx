'use client';

import { useMemo, useState, useEffect } from 'react';
import { m, animate, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { CosmicPanel } from './starfield';

// ----------------------------------------------------------------------

const VIEW = 640;
const C = VIEW / 2;
const R_OUT = 300;
const R_IN = 196;
const R_GLYPH = 250;
const R_HUB = 112;

const polar = (r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

const wedgePath = (from, to) => {
  const [x1, y1] = polar(R_OUT, from);
  const [x2, y2] = polar(R_OUT, to);
  const [x3, y3] = polar(R_IN, to);
  const [x4, y4] = polar(R_IN, from);
  const large = to - from > 180 ? 1 : 0;
  return `M${x1} ${y1}A${R_OUT} ${R_OUT} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${R_IN} ${R_IN} 0 ${large} 0 ${x4} ${y4}Z`;
};

/** ♈…♓ default to emoji tiles on Apple/Android — ask for the plain text glyph. */
const glyph = (symbol = '') => (/^[\u2648-\u2653]$/.test(symbol) ? `${symbol}\uFE0E` : symbol);

// ----------------------------------------------------------------------

export function ZodiacVisual({ visual, color }) {
  const { s, t } = useLang();
  const signs = useMemo(() => visual.signs ?? [], [visual.signs]);
  const groups = useMemo(
    () => Object.fromEntries((visual.groups ?? []).map((g) => [g.id, g])),
    [visual.groups]
  );
  const step = 360 / Math.max(signs.length, 1);

  const [selected, setSelected] = useState(null); // sign id
  const [groupFilter, setGroupFilter] = useState(null);

  const rotation = useMotionValue(0);
  const counter = useTransform(rotation, (v) => -v);

  // Idle: the wheel turns slowly. On select it springs the sign to the top.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }, []);
  useAnimationFrame((_, delta) => {
    if (!selected && !reduced) rotation.set(rotation.get() + delta * 0.004);
  });

  const index = signs.findIndex((x) => x.id === selected);
  const sign = signs[index];
  const activeGroup = sign?.group ?? groupFilter;

  useEffect(() => {
    if (index < 0) return undefined;
    const current = rotation.get();
    const target = -(index * step);
    // Nearest equivalent angle, so it never spins the long way round.
    const delta = ((((target - current) % 360) + 540) % 360) - 180;
    const controls = animate(rotation, current + delta, {
      type: 'spring',
      stiffness: 70,
      damping: 16,
    });
    return () => controls.stop();
  }, [index, step, rotation]);

  // Lines joining the signs of the active group (the element "trines").
  const groupPoints = useMemo(
    () =>
      signs
        .map((x, i) => (x.group === activeGroup ? polar(R_IN - 8, i * step) : null))
        .filter(Boolean),
    [signs, activeGroup, step]
  );

  const groupColor = (id) => groups[id]?.color ?? color;
  const toggle = (id) => setSelected((cur) => (cur === id ? null : id));

  return (
    <Box>
      <CosmicPanel tint={color} sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ display: 'block', px: 2, pt: 1.5, opacity: 0.7 }}>
          {s.zodiacHint}
        </Typography>

        <Box
          component="svg"
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          role="img"
          sx={{
            display: 'block',
            width: 1,
            maxWidth: 600,
            mx: 'auto',
            touchAction: 'manipulation',
          }}
        >
          <defs>
            <radialGradient id="zodiac-hub">
              <stop
                offset="0%"
                stopColor={sign ? groupColor(sign.group) : color}
                stopOpacity="0.55"
              />
              <stop offset="100%" stopColor="#070818" stopOpacity="0.95" />
            </radialGradient>
            <filter id="zodiac-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Fixed pointer at the top */}
          <path
            d={`M${C - 10} ${C - R_OUT - 14} L${C + 10} ${C - R_OUT - 14} L${C} ${C - R_OUT + 2} Z`}
            fill="#fff"
            opacity="0.9"
          />

          <m.g style={{ rotate: rotation }}>
            <circle
              cx={C}
              cy={C}
              r={R_OUT + 6}
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="2 6"
            />
            {signs.map((x, i) => {
              const from = i * step - step / 2;
              const g = groupColor(x.group);
              const dim = activeGroup && x.group !== activeGroup;
              const on = x.id === selected;
              const [gx, gy] = polar(R_GLYPH, i * step);
              return (
                <g
                  key={x.id}
                  onClick={() => toggle(x.id)}
                  style={{ cursor: 'pointer', transition: 'opacity 240ms' }}
                  opacity={dim ? 0.28 : 1}
                >
                  <path
                    d={wedgePath(from, from + step)}
                    fill={g}
                    fillOpacity={on ? 0.55 : 0.2}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="1"
                  />
                  <m.g style={{ rotate: counter }}>
                    <text
                      x={gx}
                      y={gy - 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={signs.length > 12 ? 26 : 34}
                      fill="#fff"
                      filter={on ? 'url(#zodiac-glow)' : undefined}
                      style={{ pointerEvents: 'none' }}
                    >
                      {glyph(x.symbol)}
                    </text>
                    <text
                      x={gx}
                      y={gy + 26}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight={on ? 700 : 500}
                      fill="#fff"
                      fillOpacity="0.85"
                      style={{ pointerEvents: 'none' }}
                    >
                      {t(x.name)}
                    </text>
                  </m.g>
                </g>
              );
            })}

            {groupPoints.length > 1 && (
              <polygon
                points={groupPoints.map((p) => p.join(',')).join(' ')}
                fill={`${groupColor(activeGroup)}22`}
                stroke={groupColor(activeGroup)}
                strokeWidth="2"
                strokeLinejoin="round"
                filter="url(#zodiac-glow)"
              />
            )}
          </m.g>

          {/* Hub */}
          <circle cx={C} cy={C} r={R_HUB} fill="url(#zodiac-hub)" stroke="rgba(255,255,255,0.3)" />
          {sign ? (
            <g style={{ pointerEvents: 'none' }}>
              <text
                x={C}
                y={C - 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="64"
                fill="#fff"
                filter="url(#zodiac-glow)"
              >
                {glyph(sign.symbol)}
              </text>
              <text x={C} y={C + 46} textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">
                {t(sign.name)}
              </text>
            </g>
          ) : (
            <text
              x={C}
              y={C}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="15"
              fill="#fff"
              fillOpacity="0.75"
            >
              {s.tapASign}
            </text>
          )}
        </Box>

        {/* Group legend — tap to light up one element */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          justifyContent="center"
          sx={{ px: 2, pb: 2 }}
        >
          {(visual.groups ?? []).map((g) => {
            const on = activeGroup === g.id;
            return (
              <Chip
                key={g.id}
                clickable
                label={t(g.name)}
                onClick={() => {
                  setSelected(null);
                  setGroupFilter((cur) => (cur === g.id ? null : g.id));
                }}
                icon={
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: g.color,
                      ml: '8px !important',
                    }}
                  />
                }
                sx={{
                  color: '#fff',
                  bgcolor: on ? `${g.color}55` : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${on ? g.color : 'transparent'}`,
                  '&:hover': { bgcolor: `${g.color}40` },
                }}
              />
            );
          })}
        </Stack>
      </CosmicPanel>

      {sign && <SignPanel sign={sign} group={groups[sign.group]} accent={groupColor(sign.group)} />}
      {!sign && groupFilter && groups[groupFilter]?.note && (
        <GroupPanel
          group={groups[groupFilter]}
          signs={signs.filter((x) => x.group === groupFilter)}
          onPick={toggle}
        />
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

function SignPanel({ sign, group, accent }) {
  const { s, t } = useLang();

  return (
    <Box
      key={sign.id}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        border: `1px solid ${accent}55`,
        background: `linear-gradient(135deg, ${accent}24, transparent 70%)`,
        animation: 'panelIn 260ms ease-out',
        '@keyframes panelIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'none' },
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontSize: 34,
            color: '#fff',
            bgcolor: accent,
            boxShadow: `0 0 28px ${accent}99`,
          }}
        >
          {glyph(sign.symbol)}
        </Box>
        <Box>
          <Typography variant="h5">{t(sign.name)}</Typography>
          {sign.dates && (
            <Typography variant="body2" sx={{ color: accent, fontWeight: 700 }}>
              {t(sign.dates)}
            </Typography>
          )}
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        {group && (
          <Chip
            size="small"
            label={t(group.name)}
            sx={{ bgcolor: accent, color: '#fff', fontWeight: 700 }}
          />
        )}
        {(sign.tags ?? []).map((tag, i) => (
          <Chip key={i} size="small" variant="outlined" label={t(tag)} />
        ))}
      </Stack>

      <Typography sx={{ mb: 2, lineHeight: 1.7 }}>{t(sign.description)}</Typography>

      {sign.traits?.length > 0 && (
        <>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            {s.traits}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
            {sign.traits.map((tr, i) => (
              <Chip
                key={i}
                icon={
                  <Iconify
                    icon="solar:star-shine-bold"
                    width={16}
                    sx={{ color: `${accent} !important` }}
                  />
                }
                label={t(tr)}
                sx={{ bgcolor: `${accent}1A`, color: 'text.primary' }}
              />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}

function GroupPanel({ group, signs, onPick }) {
  const { t } = useLang();

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        border: `1px solid ${group.color}55`,
        background: `linear-gradient(135deg, ${group.color}24, transparent 70%)`,
      }}
    >
      <Typography variant="h6" sx={{ color: group.color, mb: 1 }}>
        {t(group.name)}
      </Typography>
      <Typography sx={{ mb: 2 }}>{t(group.note)}</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {signs.map((x) => (
          <Chip
            key={x.id}
            clickable
            onClick={() => onPick(x.id)}
            label={`${glyph(x.symbol)} ${t(x.name)}`}
          />
        ))}
      </Stack>
    </Box>
  );
}

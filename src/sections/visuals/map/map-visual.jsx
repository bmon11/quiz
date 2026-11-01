'use client';

import { useMemo, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { GeoMap } from './geo-map';
import { hexToChannel } from '../../home/home-view';

// ----------------------------------------------------------------------

const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString('en') : String(n));

/**
 * A lesson's map: each item colours its region — darker = bigger value when
 * the items have values — and tapping a region (or its chip) opens its facts.
 * Used for `visual.kind === 'map'` and for `lesson.map` beside another visual.
 */
export function MapVisual({ visual, color }) {
  const { s, t } = useLang();
  const [selected, setSelected] = useState(null);
  const channel = hexToChannel(color);
  const items = useMemo(() => visual.items ?? [], [visual.items]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const valued = items.filter((i) => typeof i.value === 'number');

  // Shade by rank, so one giant (Russia) doesn't wash out everyone else.
  const regions = useMemo(() => {
    const ranked = [...valued].sort((a, b) => a.value - b.value);
    const rank = new Map(
      ranked.map((i, n) => [i.id, ranked.length > 1 ? n / (ranked.length - 1) : 1])
    );
    return Object.fromEntries(
      items.map((i) => [
        i.id,
        { fill: varAlpha(channel, rank.has(i.id) ? 0.22 + 0.73 * rank.get(i.id) : 0.6) },
      ])
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, channel]);

  const item = selected ? byId.get(selected) : null;
  const min = valued.length ? Math.min(...valued.map((i) => i.value)) : null;
  const max = valued.length ? Math.max(...valued.map((i) => i.value)) : null;
  const chips =
    valued.length === items.length ? [...items].sort((a, b) => b.value - a.value) : items;

  return (
    <Box>
      <GeoMap
        name={visual.map}
        regions={regions}
        selected={selected}
        onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
        zoomable
        zoomTo={selected}
        labels={visual.map === 'mongolia' ? 'all' : 'regions'}
        ariaLabel={s.visualTitle.map}
      />

      {min !== null && max > min && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, maxWidth: 360 }}>
          <Typography variant="caption" color="text.secondary">
            {fmt(min)}
          </Typography>
          <Box
            sx={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: `linear-gradient(90deg, ${varAlpha(channel, 0.22)}, ${varAlpha(channel, 0.95)})`,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {fmt(max)} {t(visual.unit)}
          </Typography>
        </Stack>
      )}

      <Box
        sx={{
          mt: 2,
          p: 2,
          minHeight: 92,
          borderRadius: 1.5,
          bgcolor: varAlpha(channel, 0.08),
          borderLeft: `4px solid ${item ? color : 'transparent'}`,
        }}
      >
        {item ? (
          <>
            <Stack direction="row" alignItems="baseline" spacing={1} flexWrap="wrap" useFlexGap>
              <Typography variant="h6">{t(item.title)}</Typography>
              {typeof item.value === 'number' && (
                <Typography variant="subtitle2" sx={{ color }}>
                  {fmt(item.value)} {t(visual.unit)}
                </Typography>
              )}
            </Stack>
            {item.subtitle && (
              <Typography variant="body2" color="text.secondary">
                {t(item.subtitle)}
              </Typography>
            )}
            {item.facts?.length > 0 && (
              <Box component="ul" sx={{ mt: 1, pl: 2.5, display: 'grid', gap: 0.5 }}>
                {item.facts.map((f, i) => (
                  <Typography key={i} component="li" variant="body2">
                    {t(f)}
                  </Typography>
                ))}
              </Box>
            )}
          </>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
            <Iconify icon="solar:cursor-bold-duotone" width={20} sx={{ color }} />
            <Typography variant="body2">{s.mapHint}</Typography>
          </Stack>
        )}
      </Box>

      <Box
        sx={{
          mt: 1.5,
          maxHeight: 148,
          overflowY: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
        }}
      >
        {chips.map((i) => (
          <Chip
            key={i.id}
            size="small"
            clickable
            label={t(i.title)}
            onClick={() => setSelected((cur) => (cur === i.id ? null : i.id))}
            variant={selected === i.id ? 'filled' : 'outlined'}
            sx={selected === i.id ? { bgcolor: color, color: 'common.white' } : undefined}
          />
        ))}
      </Box>
    </Box>
  );
}

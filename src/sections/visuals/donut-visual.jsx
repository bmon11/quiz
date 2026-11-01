'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useLang } from 'src/locales';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

const PALETTE = [
  '#5B54E8',
  '#00A76F',
  '#FFAB00',
  '#FF5630',
  '#00B8D9',
  '#8E33FF',
  '#118D57',
  '#B76E00',
];

export function DonutVisual({ visual }) {
  const { t, lang } = useLang();
  const items = visual.items ?? [];
  const unit = t(visual.unit);
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const num = (v) =>
    Number(v).toLocaleString(lang === 'mn' ? 'mn-MN' : 'en-US', { maximumFractionDigits: 1 });

  const options = useChart({
    colors: PALETTE,
    labels: items.map((i) => t(i.label)),
    legend: { show: false },
    stroke: { width: 2 },
    dataLabels: {
      enabled: true,
      formatter: (pct) => `${Math.round(pct)}%`,
      dropShadow: { enabled: false },
    },
    tooltip: { y: { formatter: (v) => `${num(v)} ${unit}` } },
    plotOptions: {
      pie: {
        donut: {
          size: '62%',
          labels: {
            show: true,
            value: { formatter: (v) => num(v) },
            total: { show: true, label: unit, formatter: () => num(total) },
          },
        },
      },
    },
  });

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        alignItems: 'center',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      }}
    >
      <Chart
        type="donut"
        series={items.map((i) => i.value)}
        options={options}
        sx={{ height: 360, maxWidth: 400, mx: 'auto' }}
      />

      {/* The legend doubles as a readable table: name, value, share. */}
      <Stack spacing={1.25}>
        {items.map((item, idx) => (
          <Stack key={t(item.label)} direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: 0.75,
                flexShrink: 0,
                bgcolor: PALETTE[idx % PALETTE.length],
              }}
            />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle2">{t(item.label)}</Typography>
              {item.note && (
                <Typography variant="caption" color="text.secondary">
                  {t(item.note)}
                </Typography>
              )}
            </Box>
            <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>
              {num(item.value)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ width: 44, textAlign: 'right' }}
            >
              {total ? Math.round((item.value / total) * 100) : 0}%
            </Typography>
          </Stack>
        ))}
        <Typography variant="caption" color="text.secondary">
          {unit}
        </Typography>
      </Stack>
    </Box>
  );
}

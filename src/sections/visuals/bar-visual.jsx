'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useLang } from 'src/locales';

import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function BarVisual({ visual, color }) {
  const { t, lang } = useLang();
  const items = visual.items ?? [];
  const unit = t(visual.unit);
  // A long ranking only reads as horizontal bars with the labels down the side.
  const horizontal = !!visual.horizontal || items.length > 12;
  const format = (v) => `${Number(v).toLocaleString(lang === 'mn' ? 'mn-MN' : 'en-US')} ${unit}`;

  const options = useChart({
    colors: [color],
    chart: { animations: { enabled: true, speed: 600 } },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 6,
        columnWidth: '55%',
        barHeight: '70%',
        distributed: false,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (v) => Number(v).toLocaleString(lang === 'mn' ? 'mn-MN' : 'en-US'),
      style: { fontSize: '13px', fontWeight: 700 },
      offsetX: horizontal ? 6 : 0,
    },
    xaxis: {
      categories: items.map((i) => t(i.label)),
      labels: { style: { fontSize: '13px' }, trim: !horizontal, hideOverlappingLabels: false },
    },
    yaxis: { labels: { style: { fontSize: '13px' }, maxWidth: 180 } },
    tooltip: {
      y: {
        formatter: (v, { dataPointIndex }) => {
          const note = items[dataPointIndex]?.note;
          return note ? `${format(v)} — ${t(note)}` : format(v);
        },
        title: { formatter: () => '' },
      },
    },
    grid: { padding: { right: horizontal ? 32 : 8 } },
  });

  const notes = items.filter((i) => i.note);
  const height = horizontal ? Math.max(280, items.length * (items.length > 20 ? 30 : 52)) : 380;

  return (
    <>
      <Typography variant="caption" color="text.secondary">
        {unit}
      </Typography>
      <Chart
        type="bar"
        series={[{ name: unit, data: items.map((i) => i.value) }]}
        options={options}
        sx={{ height }}
      />
      {notes.length > 0 && (
        // Tooltips need a mouse — the notes stay readable on phones too.
        <Stack spacing={0.75} sx={{ mt: 2 }}>
          {notes.map((i) => (
            <Typography key={t(i.label)} variant="body2" color="text.secondary">
              <b>{t(i.label)}:</b> {t(i.note)}
            </Typography>
          ))}
        </Stack>
      )}
    </>
  );
}

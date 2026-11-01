'use client';

import { useLang } from 'src/locales';

import { GeoMap } from './geo-map';

// ----------------------------------------------------------------------

const GREEN = '#22C55E';
const GOLD = '#FFD666';

/**
 * The map on a quiz / Jeopardy card. Before answering it shows the prompt's
 * places (for "which one is highlighted?" questions, the region itself —
 * unlabelled); with the result it adds the answer's places in green.
 */
export function QuestionMap({ map, answer, color, maxHeight = 220 }) {
  const { s } = useLang();
  if (!map) return null;
  const revealed = Array.isArray(answer);
  const context = map.context ?? [];
  const shown = revealed ? [...new Set([...context, ...answer])] : context;
  if (!shown.length) return null;

  const regions = {};
  for (const id of context) regions[id] = { fill: map.locate ? GOLD : color, stroke: '#fff' };
  if (revealed) for (const id of answer) regions[id] = { fill: GREEN, stroke: '#fff' };

  return (
    <GeoMap
      name={map.name}
      regions={regions}
      focus={map.name === 'world' ? shown : undefined}
      // Naming the highlighted region before answering would give it away.
      labels={revealed || !map.locate ? shown : []}
      dark
      maxHeight={maxHeight}
      ariaLabel={s.visualTitle.map}
    />
  );
}

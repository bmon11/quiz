'use client';

import dynamic from 'next/dynamic';

import { BarVisual } from './bar-visual';
import { CardsVisual } from './cards-visual';
import { DonutVisual } from './donut-visual';
import { PairsVisual } from './pairs-visual';
import { OrbitVisual } from './orbit-visual';
import { ZodiacVisual } from './zodiac-visual';
import { TimelineVisual } from './timeline-visual';

// React Flow measures the DOM — client only.
const TreeVisual = dynamic(() => import('./tree-visual').then((mod) => mod.TreeVisual), {
  ssr: false,
});
const FamilyTree = dynamic(() => import('../family/family-tree').then((mod) => mod.FamilyTree), {
  ssr: false,
});

// ----------------------------------------------------------------------

export const VISUAL_ICONS = {
  bar: 'solar:chart-2-bold-duotone',
  donut: 'solar:pie-chart-2-bold-duotone',
  tree: 'solar:structure-bold-duotone',
  family: 'solar:users-group-two-rounded-bold-duotone',
  pairs: 'solar:transfer-horizontal-bold-duotone',
  cards: 'solar:widget-4-bold-duotone',
  timeline: 'solar:history-bold-duotone',
  orbit: 'solar:planet-2-bold-duotone',
  zodiac: 'solar:stars-minimalistic-bold-duotone',
};

const RENDERERS = {
  bar: BarVisual,
  donut: DonutVisual,
  tree: TreeVisual,
  family: FamilyTree,
  pairs: PairsVisual,
  cards: CardsVisual,
  timeline: TimelineVisual,
  orbit: OrbitVisual,
  zodiac: ZodiacVisual,
};

export function VisualRenderer({ visual, color }) {
  const Component = RENDERERS[visual?.kind];
  return Component ? <Component visual={visual} color={color} /> : null;
}

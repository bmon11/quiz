'use client';

import '@xyflow/react/dist/style.css';

import { useMemo } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { Handle, Position, Controls, ReactFlow, MarkerType } from '@xyflow/react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useLang } from 'src/locales';

import { hexToChannel } from '../home/home-view';

// ----------------------------------------------------------------------

const GROUP_COLORS = ['#8E33FF', '#FFAB00', '#5B54E8', '#637381', '#00B8D9', '#FF5630'];
const NODE_W = 150;
const GAP_X = 24;
const GAP_Y = 110;

const GROUP_LABELS = {
  primordial: { en: 'Primordial', mn: 'Анхдагч' },
  titan: { en: 'Titans', mn: 'Титанууд' },
  olympian: { en: 'Olympians', mn: 'Олимпийн бурхад' },
  underworld: { en: 'Underworld', mn: 'Газар доорх ертөнц' },
  aesir: { en: 'Æsir', mn: 'Асууд' },
  vanir: { en: 'Vanir', mn: 'Ванууд' },
  jotunn: { en: 'Giants (jötnar)', mn: 'Аварга (ётун)' },
  monster: { en: 'Monsters', mn: 'Мангасууд' },
};

/**
 * Layered layout without a layout library: a node's row is its longest path
 * from a root, and each row is ordered by the average x of its parents so
 * children sit under their parents and lines cross as little as possible.
 */
const layoutTree = (nodes, edges) => {
  const parents = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach((e) => parents.get(e.to)?.push(e.from));

  const depth = new Map();
  const depthOf = (id, seen = new Set()) => {
    if (depth.has(id)) return depth.get(id);
    if (seen.has(id)) return 0; // cycle guard
    seen.add(id);
    const ps = parents.get(id) ?? [];
    const d = ps.length ? Math.max(...ps.map((p) => depthOf(p, seen))) + 1 : 0;
    depth.set(id, d);
    return d;
  };
  nodes.forEach((n) => depthOf(n.id));

  const rows = [];
  nodes.forEach((n, i) => {
    const d = depth.get(n.id);
    (rows[d] ??= []).push({ id: n.id, i });
  });

  const x = new Map();
  rows.forEach((row) => {
    row.forEach((r) => {
      const xs = (parents.get(r.id) ?? []).map((p) => x.get(p)).filter((v) => v !== undefined);
      r.key = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : r.i;
    });
    row.sort((a, b) => a.key - b.key || a.i - b.i);
    const width = row.length * NODE_W + (row.length - 1) * GAP_X;
    row.forEach((r, idx) => x.set(r.id, idx * (NODE_W + GAP_X) - width / 2 + NODE_W / 2));
  });

  return new Map(
    nodes.map((n) => [n.id, { x: x.get(n.id) - NODE_W / 2, y: depth.get(n.id) * GAP_Y }])
  );
};

function GodNode({ data }) {
  const channel = hexToChannel(data.color);
  return (
    <Box
      sx={{
        width: NODE_W,
        px: 1.25,
        py: 1,
        borderRadius: 1.5,
        textAlign: 'center',
        bgcolor: 'background.paper',
        border: `2px solid ${data.color}`,
        boxShadow: `0 4px 12px ${varAlpha(channel, 0.2)}`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>
        {data.label}
      </Typography>
      {data.sub && (
        <Typography variant="caption" sx={{ color: data.color, display: 'block', lineHeight: 1.3 }}>
          {data.sub}
        </Typography>
      )}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </Box>
  );
}

const nodeTypes = { god: GodNode };

export function TreeVisual({ visual }) {
  const { t, lang } = useLang();
  const theme = useTheme();

  const groups = useMemo(
    () => [...new Set(visual.nodes.map((n) => n.group ?? 'other'))],
    [visual.nodes]
  );
  const colorOf = (group) => GROUP_COLORS[groups.indexOf(group ?? 'other') % GROUP_COLORS.length];

  const { nodes, edges } = useMemo(() => {
    const pos = layoutTree(visual.nodes, visual.edges);
    return {
      nodes: visual.nodes.map((n) => ({
        id: n.id,
        type: 'god',
        position: pos.get(n.id),
        data: { label: t(n.label), sub: t(n.sub), color: colorOf(n.group) },
        draggable: false,
        connectable: false,
      })),
      edges: visual.edges.map((e, i) => ({
        id: `e${i}`,
        source: e.from,
        target: e.to,
        type: 'smoothstep',
        label: e.label ? t(e.label) : undefined,
        labelStyle: { fontSize: 11, fill: theme.vars.palette.text.secondary },
        labelBgStyle: { fill: theme.vars.palette.background.paper },
        style: { stroke: theme.vars.palette.text.disabled, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: theme.vars.palette.text.disabled },
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visual, lang, theme]);

  return (
    <>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        {groups.map((g) => (
          <Stack key={g} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: colorOf(g) }} />
            <Typography variant="body2">{GROUP_LABELS[g]?.[lang] ?? g}</Typography>
          </Stack>
        ))}
      </Stack>
      <Box sx={{ height: { xs: 460, md: 620 }, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>
    </>
  );
}

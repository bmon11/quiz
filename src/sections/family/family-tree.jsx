'use client';

import '@xyflow/react/dist/style.css';

import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useEffect } from 'react';
import {
  Handle,
  Controls,
  Position,
  ReactFlow,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { useLang } from 'src/locales';

import { FamilyBranch } from './family-branch';
import { hexToChannel } from '../home/home-view';
import {
  NODE_W,
  NODE_H,
  indexFamily,
  highlightOf,
  relativesOf,
  GROUP_COLORS,
  GROUP_LABELS,
  layoutFamily,
} from './family-graph';

// ----------------------------------------------------------------------
// The whole family as a zoomable tree. Tap a god (in the tree or the row of
// names) and their parents, siblings, partners and children light up while the
// rest fades; the view zooms to them and their branch + facts show below.

const COPY = {
  en: {
    hint: 'Tap any god to see their family',
    roman: 'Roman name',
    spouse: 'Married to',
    showAll: 'Whole family',
  },
  mn: {
    hint: 'Бурхан дээр дарж гэр бүлийг нь хараарай',
    roman: 'Ром нэр',
    spouse: 'Ханьтай',
    showAll: 'Бүх гэр бүл',
  },
};

function PersonNode({ data }) {
  const channel = hexToChannel(data.color);
  return (
    <Box
      sx={{
        width: NODE_W,
        height: NODE_H,
        px: 1,
        gap: 0.75,
        display: 'flex',
        alignItems: 'center',
        borderRadius: 1.5,
        cursor: 'pointer',
        bgcolor: data.selected ? data.color : 'background.paper',
        color: data.selected ? '#fff' : 'text.primary',
        border: `2px solid ${data.color}`,
        boxShadow: data.selected
          ? `0 0 0 4px ${varAlpha(channel, 0.3)}`
          : `0 2px 8px ${varAlpha(channel, 0.16)}`,
        opacity: data.faded ? 0.22 : 1,
        transition: 'opacity 200ms, background-color 200ms',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Box component="span" sx={{ fontSize: 22, lineHeight: 1 }} aria-hidden>
        {data.emoji}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.25 }}>
          {data.label}
        </Typography>
        {data.sub && (
          <Typography
            variant="caption"
            noWrap
            component="div"
            sx={{
              lineHeight: 1.25,
              color: data.selected ? 'inherit' : data.color,
              opacity: data.selected ? 0.85 : 1,
            }}
          >
            {data.sub}
          </Typography>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </Box>
  );
}

function UnionNode({ data }) {
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        bgcolor: 'text.disabled',
        opacity: data.faded ? 0.22 : 1,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </Box>
  );
}

const nodeTypes = { person: PersonNode, union: UnionNode };

// ----------------------------------------------------------------------

export function FamilyTree({ visual, color }) {
  return (
    <ReactFlowProvider>
      <FamilyTreeInner family={visual} color={color} />
    </ReactFlowProvider>
  );
}

function FamilyTreeInner({ family, color }) {
  const { t, lang } = useLang();
  const theme = useTheme();
  const flow = useReactFlow();
  const index = useMemo(() => indexFamily(family), [family]);
  const positions = useMemo(() => layoutFamily(index), [index]);

  // ?focus=<id> opens on that god (links from quiz answers); Zeus otherwise.
  const [selected, setSelected] = useState(() => {
    if (typeof window === 'undefined') return 'zeus';
    const wanted = new URLSearchParams(window.location.search).get('focus');
    return wanted && index.people.has(wanted) ? wanted : index.people.has('zeus') ? 'zeus' : null;
  });
  const lit = useMemo(() => highlightOf(index, selected), [index, selected]);

  const nodes = useMemo(
    () => [
      ...[...index.people.values()].map((p) => ({
        id: p.id,
        type: 'person',
        position: positions.get(p.id),
        data: {
          label: t(p.name),
          sub: p.roman && t(p.roman) !== t(p.name) ? t(p.roman) : t(p.role),
          emoji: p.emoji,
          color: GROUP_COLORS[p.group] ?? '#637381',
          selected: p.id === selected,
          faded: lit ? !lit.has(p.id) : false,
        },
        draggable: false,
        connectable: false,
      })),
      ...index.unions.map((u) => ({
        id: u.id,
        type: 'union',
        position: positions.get(u.id),
        data: { faded: lit ? !lit.has(u.id) : false },
        draggable: false,
        connectable: false,
        selectable: false,
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, positions, selected, lit, lang]
  );

  const edges = useMemo(() => {
    const base = theme.vars.palette.text.disabled;
    const make = (id, source, target, on, arrow) => ({
      id,
      source,
      target,
      type: 'smoothstep',
      style: {
        stroke: on ? color : base,
        strokeWidth: on ? 2.5 : 1.25,
        opacity: lit && !on ? 0.2 : 1,
      },
      ...(arrow && { markerEnd: { type: MarkerType.ArrowClosed, color: on ? color : base } }),
    });
    return index.unions.flatMap((u) => [
      ...u.partners.map((p) =>
        make(`${p}-${u.id}`, p, u.id, !!lit && lit.has(p) && lit.has(u.id), false)
      ),
      ...u.children.map((c) =>
        make(`${u.id}-${c}`, u.id, c, !!lit && lit.has(c) && lit.has(u.id), true)
      ),
    ]);
  }, [index, lit, color, theme]);

  // Zoom to the selected god's family (or everyone).
  useEffect(() => {
    const ids = lit ? [...lit].filter((id) => index.people.has(id)) : null;
    const timer = setTimeout(
      () =>
        flow.fitView({
          nodes: ids?.map((id) => ({ id })),
          padding: 0.15,
          duration: 500,
          maxZoom: 1.1,
        }),
      60
    );
    return () => clearTimeout(timer);
  }, [lit, index, flow]);

  const person = selected ? index.people.get(selected) : null;
  const relatives = selected ? relativesOf(index, selected) : null;
  const groups = [...new Set(family.people.map((p) => p.group))];

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        spacing={2}
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle1" sx={{ mr: 'auto' }}>
          👆 {COPY[lang].hint}
        </Typography>
        {groups.map((g) => (
          <Stack key={g} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: GROUP_COLORS[g] }} />
            <Typography variant="body2">{t(GROUP_LABELS[g])}</Typography>
          </Stack>
        ))}
      </Stack>

      {/* Every name in one swipeable row — the easy way to pick on a phone. */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ overflowX: 'auto', pb: 1.5, mb: 1, mx: -0.5, px: 0.5, scrollbarWidth: 'thin' }}
      >
        <ButtonBase
          onClick={() => setSelected(null)}
          sx={{
            px: 1.5,
            py: 0.75,
            flexShrink: 0,
            borderRadius: 5,
            typography: 'subtitle2',
            border: `1.5px solid ${color}`,
            bgcolor: selected ? 'transparent' : color,
            color: selected ? 'text.primary' : '#fff',
          }}
        >
          🌳 {COPY[lang].showAll}
        </ButtonBase>
        {family.people.map((p) => {
          const on = p.id === selected;
          const c = GROUP_COLORS[p.group] ?? '#637381';
          return (
            <ButtonBase
              key={p.id}
              onClick={() => setSelected(p.id)}
              aria-pressed={on}
              sx={{
                px: 1.5,
                py: 0.75,
                gap: 0.5,
                flexShrink: 0,
                borderRadius: 5,
                typography: 'subtitle2',
                whiteSpace: 'nowrap',
                border: `1.5px solid ${c}`,
                bgcolor: on ? c : varAlpha(hexToChannel(c), 0.08),
                color: on ? '#fff' : 'text.primary',
              }}
            >
              <span aria-hidden>{p.emoji}</span>
              {t(p.name)}
            </ButtonBase>
          );
        })}
      </Stack>

      <Box sx={{ height: { xs: 440, md: 600 }, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_e, node) =>
            node.type === 'person' && setSelected(node.id === selected ? null : node.id)
          }
          onPaneClick={() => setSelected(null)}
          fitView
          minZoom={0.15}
          nodesDraggable={false}
          nodesConnectable={false}
          zoomOnScroll={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>

      {person && (
        <Card variant="outlined" sx={{ mt: 2, p: { xs: 2, md: 3 } }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ fontSize: 44, lineHeight: 1 }} aria-hidden>
              {person.emoji}
            </Box>
            <Box>
              <Typography variant="h5">{t(person.name)}</Typography>
              <Typography sx={{ color: GROUP_COLORS[person.group], fontWeight: 600 }}>
                {t(person.role)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {person.roman &&
                  t(person.roman) !== t(person.name) &&
                  `${COPY[lang].roman}: ${t(person.roman)}`}
                {relatives.spouses.length > 0 &&
                  `${person.roman && t(person.roman) !== t(person.name) ? ' · ' : ''}${COPY[lang].spouse}: ${relatives.spouses
                    .map((id) => t(index.people.get(id)?.name))
                    .join(', ')}`}
              </Typography>
            </Box>
          </Stack>
          {person.note && (
            <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
              {t(person.note)}
            </Typography>
          )}
          <FamilyBranch family={family} focus={[person.id]} onSelect={setSelected} />
        </Card>
      )}
    </>
  );
}

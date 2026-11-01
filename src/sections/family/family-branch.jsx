'use client';

import { useMemo } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { useLang } from 'src/locales';

import { hexToChannel } from '../home/home-view';
import { indexFamily, relativesOf, GROUP_COLORS } from './family-graph';

// ----------------------------------------------------------------------
// One person's branch of the family as a small top-down tree of name chips:
//   parents → the person among their siblings → each partner and their children.
// Plain HTML (not the zoomable graph) so it stays readable on a phone, inside a
// quiz card. `focus` is a list of ids: the first is the branch's centre, the
// others are highlighted too and decide which of the centre's partners to show.

const COPY = {
  en: { parents: 'Parents', children: 'Children', more: (n) => `+${n} more partners` },
  mn: { parents: 'Эцэг эх', children: 'Хүүхдүүд', more: (n) => `+${n} бусад хань` },
};

/** Shown unions when none involves another highlighted person. */
const MAX_UNIONS = 3;

export function FamilyBranch({ family, focus, onSelect, dark = false }) {
  const { t, lang } = useLang();
  const index = useMemo(() => indexFamily(family), [family]);
  const centre = focus.find((id) => index.people.has(id));
  if (!centre) return null;

  const r = relativesOf(index, centre);
  const marked = new Set(focus);
  const linked = r.unions.filter((u) =>
    [...u.partners, ...u.children].some((id) => id !== centre && marked.has(id))
  );
  const unions = linked.length ? linked : r.unions.slice(0, MAX_UNIONS);
  const hidden = r.unions.length - unions.length;

  const ink = dark ? 'rgba(255,255,255,0.72)' : 'text.secondary';
  const line = dark ? 'rgba(255,255,255,0.35)' : 'divider';

  const chip = (id) => {
    const person = index.people.get(id);
    if (!person) return null;
    const color = GROUP_COLORS[person.group] ?? '#637381';
    const on = marked.has(id);
    return (
      <ButtonBase
        key={id}
        disabled={!onSelect}
        onClick={() => onSelect?.(id)}
        sx={{
          px: 1,
          py: 0.5,
          gap: 0.5,
          borderRadius: 1,
          typography: 'body2',
          fontWeight: on ? 800 : 600,
          border: `1.5px solid ${color}`,
          color: on ? '#fff' : dark ? '#fff' : 'text.primary',
          bgcolor: on
            ? color
            : dark
              ? varAlpha(hexToChannel(color), 0.18)
              : varAlpha(hexToChannel(color), 0.08),
          '&.Mui-disabled': { color: on || dark ? '#fff' : 'text.primary' },
        }}
      >
        <span aria-hidden>{person.emoji}</span>
        {t(person.name)}
      </ButtonBase>
    );
  };

  const row = (ids, joiner) => (
    <Stack
      direction="row"
      flexWrap="wrap"
      justifyContent="center"
      alignItems="center"
      useFlexGap
      spacing={0.75}
    >
      {ids.map((id, i) => (
        <Box key={id} sx={{ display: 'contents' }}>
          {i > 0 && joiner && (
            <Typography component="span" sx={{ color: ink, fontSize: 14 }} aria-hidden>
              {joiner}
            </Typography>
          )}
          {chip(id)}
        </Box>
      ))}
    </Stack>
  );

  const connector = (
    <Box sx={{ width: 2, height: 14, mx: 'auto', bgcolor: line, borderRadius: 1 }} />
  );
  const note = (u) =>
    u?.note && (
      <Typography
        variant="caption"
        sx={{ color: ink, display: 'block', textAlign: 'center', mt: 0.5 }}
      >
        {t(u.note)}
      </Typography>
    );

  return (
    <Box role="group" aria-label={t(index.people.get(centre).name)}>
      {r.birth && (
        <>
          <Typography
            variant="overline"
            sx={{ color: ink, display: 'block', textAlign: 'center', lineHeight: 1.6 }}
          >
            {COPY[lang].parents}
          </Typography>
          {row(r.birth.partners, '♥')}
          {note(r.birth)}
          {connector}
        </>
      )}

      {/* The centre among its full siblings, in birth order. */}
      {row(r.birth ? r.birth.children : [centre])}

      {unions.map((u) => (
        <Box key={u.id}>
          {connector}
          <Stack
            direction="row"
            flexWrap="wrap"
            justifyContent="center"
            alignItems="center"
            useFlexGap
            spacing={0.75}
          >
            {u.partners.length > 1 && row(u.partners, '♥')}
            <Typography component="span" sx={{ color: ink }} aria-hidden>
              →
            </Typography>
            {row(u.children)}
          </Stack>
          {note(u)}
        </Box>
      ))}

      {hidden > 0 && (
        <Typography
          variant="caption"
          sx={{ color: ink, display: 'block', textAlign: 'center', mt: 1 }}
        >
          {COPY[lang].more(hidden)}
        </Typography>
      )}
    </Box>
  );
}

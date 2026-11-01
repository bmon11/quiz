'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const COPY = {
  en: { search: 'Search', more: (n) => `Show more (${n} left)`, none: 'Nothing matches' },
  mn: { search: 'Хайх', more: (n) => `Цааш үзэх (${n} үлдсэн)`, none: 'Тохирох зүйл алга' },
};

/** Long lists (80 paintings…) get a search box past this many items. */
const SEARCH_FROM = 12;

const fold = (text) =>
  (text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

/**
 * Search + "show more" for a visual's items. `text(item)` gives the words to
 * match (both languages are searched). Items keep their original `index` so
 * numbering stays true while filtering.
 */
export function useListTools(items, text, { page = 24 } = {}) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(page);

  const matches = useMemo(() => {
    const all = items.map((item, index) => ({ item, index }));
    const q = fold(query.trim());
    return q ? all.filter(({ item }) => fold(text(item)).includes(q)) : all;
  }, [items, query, text]);

  return {
    searchable: items.length > SEARCH_FROM,
    query,
    setQuery: (value) => {
      setQuery(value);
      setShown(page);
    },
    visible: matches.slice(0, shown),
    matches,
    left: Math.max(0, matches.length - shown),
    more: () => setShown((n) => n + page),
  };
}

export function ListSearch({ tools, sx }) {
  const { lang } = useLang();
  if (!tools.searchable) return null;
  return (
    <TextField
      size="small"
      fullWidth
      value={tools.query}
      onChange={(e) => tools.setQuery(e.target.value)}
      placeholder={COPY[lang].search}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        },
      }}
      sx={{ mb: 2, maxWidth: { sm: 360 }, ...sx }}
    />
  );
}

export function ListMore({ tools }) {
  const { lang } = useLang();
  if (tools.query && !tools.matches.length) {
    return <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>{COPY[lang].none}</Box>;
  }
  if (!tools.left) return null;
  return (
    <Box sx={{ mt: 2, textAlign: 'center' }}>
      <Button variant="outlined" color="inherit" onClick={tools.more}>
        {COPY[lang].more(tools.left)}
      </Button>
    </Box>
  );
}

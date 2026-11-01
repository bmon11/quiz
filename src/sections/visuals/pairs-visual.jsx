'use client';

import { useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { SmartIcon } from 'src/components/state-views';

import { hexToChannel } from '../home/home-view';
import { ListMore, ListSearch, useListTools } from './list-tools';

const pairText = (item) => [item.left, item.right].flatMap((l) => [l.en, l.mn]).join(' ');

// ----------------------------------------------------------------------

const COPY = {
  en: { cover: 'Hide answers (tap to reveal)', tap: 'Tap to show' },
  mn: { cover: 'Хариуг нуух (дарж харна)', tap: 'Дарж харах' },
};

export function PairsVisual({ visual, color }) {
  const { t, lang } = useLang();
  const [covered, setCovered] = useState(false);
  const [revealed, setRevealed] = useState({});
  const channel = hexToChannel(color);
  const tools = useListTools(visual.items ?? [], pairText, { page: 40 });

  const toggleCover = (_e, on) => {
    setCovered(on);
    setRevealed({});
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ typography: 'subtitle2' }}>
          <Box component="span">{t(visual.left)}</Box>
          <Iconify icon="solar:transfer-horizontal-linear" sx={{ color }} />
          <Box component="span">{t(visual.right)}</Box>
        </Stack>
        <FormControlLabel
          control={<Switch checked={covered} onChange={toggleCover} />}
          label={COPY[lang].cover}
        />
      </Stack>

      <ListSearch tools={tools} />
      <Stack spacing={1}>
        {tools.visible.map(({ item, index: i }) => {
          const hidden = covered && !revealed[i];
          return (
            <Box
              key={i}
              sx={{
                display: 'grid',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                gridTemplateColumns: { xs: '1fr auto 1fr', sm: '1fr auto 1fr 1.4fr' },
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: i % 2 ? 'transparent' : varAlpha(channel, 0.06),
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <SmartIcon icon={item.icon} size={22} color={color} />
                <Typography variant="subtitle1">{t(item.left)}</Typography>
              </Stack>
              <Iconify icon="solar:arrow-right-linear" sx={{ color: 'text.disabled' }} />
              <ButtonBase
                disabled={!hidden}
                onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
                sx={{
                  justifyContent: 'flex-start',
                  borderRadius: 1,
                  px: hidden ? 1.5 : 0,
                  py: hidden ? 0.5 : 0,
                  bgcolor: hidden ? varAlpha(channel, 0.16) : 'transparent',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ color: hidden ? 'text.secondary' : color, fontWeight: 700 }}
                >
                  {hidden ? COPY[lang].tap : t(item.right)}
                </Typography>
              </ButtonBase>
              {item.note && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    gridColumn: { xs: '1 / -1', sm: 'auto' },
                    visibility: hidden ? 'hidden' : 'visible',
                  }}
                >
                  {t(item.note)}
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>
      <ListMore tools={tools} />
    </>
  );
}

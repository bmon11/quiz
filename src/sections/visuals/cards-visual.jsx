'use client';

import { useMemo, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { SmartIcon } from 'src/components/state-views';

import { hexToChannel } from '../home/home-view';
import { PhotoLightbox } from './photo-lightbox';
import { ListMore, ListSearch, useListTools } from './list-tools';

const cardText = (item) =>
  [item.title, item.subtitle].flatMap((l) => (l ? [l.en, l.mn] : [])).join(' ');

// ----------------------------------------------------------------------

export function CardsVisual({ visual, color }) {
  const { t } = useLang();
  const items = useMemo(() => visual.items ?? [], [visual.items]);
  const tools = useListTools(items, cardText);
  // The viewer steps through every picture of the lesson, not just the visible ones.
  const pictured = useMemo(() => items.filter((item) => item.photo), [items]);
  const [open, setOpen] = useState(-1);

  return (
    <>
      <ListSearch tools={tools} />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        }}
      >
      {tools.visible.map(({ item, index }) => {
        const accent = item.color || color;
        return (
          <Card
            key={t(item.title)}
            variant="outlined"
            sx={{
              p: 2.5,
              pt: item.photo ? 0 : 2.5,
              position: 'relative',
              borderTop: `4px solid ${accent}`,
              bgcolor: varAlpha(hexToChannel(accent), 0.04),
              transition: 'box-shadow 0.2s, transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) => theme.vars.customShadows.z8,
              },
            }}
          >
            {item.photo && (
              <CardPhoto
                item={item}
                alt={t(item.title)}
                onOpen={() => setOpen(pictured.indexOf(item))}
              />
            )}
            {/* Numbered so a "nine districts" lesson reads as complete at a glance. */}
            <Typography
              variant="caption"
              sx={
                item.photo
                  ? {
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      px: 0.75,
                      borderRadius: 0.75,
                      fontWeight: 800,
                      color: 'common.white',
                      bgcolor: 'rgba(0, 0, 0, 0.55)',
                    }
                  : {
                      position: 'absolute',
                      top: 10,
                      right: 14,
                      fontWeight: 800,
                      color: 'text.disabled',
                    }
              }
            >
              {index + 1}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              {item.photo ? null : item.image ? (
                // A picture that is the fact itself (a flag, a coat of arms).
                <Box
                  component="img"
                  src={item.image}
                  alt={t(item.title)}
                  loading="lazy"
                  sx={{
                    width: 72,
                    height: 48,
                    flexShrink: 0,
                    objectFit: 'contain',
                    borderRadius: 0.5,
                    boxShadow: (theme) => theme.vars.customShadows.z1,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: varAlpha(hexToChannel(accent), 0.14),
                  }}
                >
                  <SmartIcon icon={item.icon} size={28} color={accent} />
                </Box>
              )}
              <Box sx={{ minWidth: 0, pr: 2 }}>
                <Typography variant="h6">{t(item.title)}</Typography>
                {item.subtitle && (
                  <Typography variant="body2" sx={{ color: accent, fontWeight: 600 }}>
                    {t(item.subtitle)}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Stack component="ul" spacing={0.75}>
              {(item.facts ?? []).map((fact, i) => (
                <Typography component="li" key={i} variant="body2" sx={{ display: 'flex', gap: 1 }}>
                  <Box component="span" sx={{ color: accent, fontWeight: 800 }}>
                    •
                  </Box>
                  {t(fact)}
                </Typography>
              ))}
            </Stack>
          </Card>
        );
      })}
      </Box>
      <ListMore tools={tools} />
      <PhotoLightbox items={pictured} index={open} onClose={() => setOpen(-1)} />
    </>
  );
}

// ----------------------------------------------------------------------

/** The real thing (a painting, a sculpture…) across the card top; tap to zoom. */
function CardPhoto({ item, alt, onOpen }) {
  return (
    <ButtonBase
      onClick={onOpen}
      aria-label={alt}
      sx={{
        display: 'block',
        position: 'relative',
        mx: -2.5,
        mb: 2,
        width: 'calc(100% + 40px)',
        height: 220,
        bgcolor: 'grey.900',
        overflow: 'hidden',
        '&:hover .zoom-hint': { opacity: 1 },
      }}
    >
      <Box
        component="img"
        src={item.photo.src}
        alt={alt}
        loading="lazy"
        decoding="async"
        // Contain, not cover: a painting is never cropped.
        sx={{ width: 1, height: 1, objectFit: 'contain' }}
      />
      <Box
        className="zoom-hint"
        sx={{
          position: 'absolute',
          right: 10,
          bottom: 10,
          width: 34,
          height: 34,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: 'common.white',
          bgcolor: 'rgba(0, 0, 0, 0.55)',
          opacity: { xs: 1, md: 0.7 },
          transition: 'opacity 0.2s',
        }}
      >
        <Iconify icon="solar:magnifer-zoom-in-linear" width={20} />
      </Box>
    </ButtonBase>
  );
}

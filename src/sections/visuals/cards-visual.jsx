'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useLang } from 'src/locales';

import { SmartIcon } from 'src/components/state-views';

import { hexToChannel } from '../home/home-view';

// ----------------------------------------------------------------------

export function CardsVisual({ visual, color }) {
  const { t } = useLang();

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
      }}
    >
      {(visual.items ?? []).map((item, index) => {
        const accent = item.color || color;
        return (
          <Card
            key={t(item.title)}
            variant="outlined"
            sx={{
              p: 2.5,
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
            {/* Numbered so a "nine districts" lesson reads as complete at a glance. */}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: 10,
                right: 14,
                fontWeight: 800,
                color: 'text.disabled',
              }}
            >
              {index + 1}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              {item.image ? (
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
  );
}

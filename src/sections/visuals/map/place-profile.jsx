'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { useLang } from 'src/locales';
import { usePlace } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';

import { hexToChannel } from '../../home/home-view';

// ----------------------------------------------------------------------

const COPY = {
  en: { formerNames: 'Former names', symbols: 'Symbols', facts: 'Good to know' },
  mn: { formerNames: 'Хуучин нэрс', symbols: 'Бэлгэ тэмдэг', facts: 'Сонирхолтой баримт' },
};

function Section({ icon, title, color, children }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
        <Iconify icon={icon} width={18} sx={{ color }} />
        <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

/**
 * Everything about the tapped aimag / country (GET /places/:map/:id): flag,
 * one-line summary, key numbers, former names, symbols and facts. Renders
 * nothing for a place without a profile yet.
 */
export function PlaceProfile({ map, id, color }) {
  const { t, lang } = useLang();
  const { place, placeLoading } = usePlace(map, id);
  const channel = hexToChannel(color);

  if (placeLoading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Skeleton width="70%" />
        <Skeleton width="90%" />
        <Skeleton width="60%" />
      </Box>
    );
  }
  if (!place) return null;

  return (
    <Box>
      {(place.flag || place.summary?.en) && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
          {place.flag && (
            <Box
              component="img"
              src={place.flag}
              alt=""
              sx={{ width: 54, height: 36, objectFit: 'contain', borderRadius: 0.5, flexShrink: 0 }}
            />
          )}
          {place.summary?.en && (
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {t(place.summary)}
            </Typography>
          )}
        </Stack>
      )}

      {place.stats?.length > 0 && (
        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gap: 1,
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          }}
        >
          {place.stats.map((stat, i) => (
            <Box key={i} sx={{ p: 1.25, borderRadius: 1, bgcolor: varAlpha(channel, 0.1) }}>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                {t(stat.label)}
              </Typography>
              <Typography variant="subtitle2">{t(stat.value)}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {place.formerNames?.length > 0 && (
        <Section icon="solar:history-bold-duotone" title={COPY[lang].formerNames} color={color}>
          <Stack spacing={0.5}>
            {place.formerNames.map((f, i) => (
              <Typography key={i} variant="body2">
                <b>{t(f.name)}</b>{' '}
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  · {t(f.period)}
                </Box>
              </Typography>
            ))}
          </Stack>
        </Section>
      )}

      {place.symbols?.length > 0 && (
        <Section icon="solar:shield-star-bold-duotone" title={COPY[lang].symbols} color={color}>
          <Box component="ul" sx={{ pl: 2.5, display: 'grid', gap: 0.5 }}>
            {place.symbols.map((sym, i) => (
              <Typography key={i} component="li" variant="body2">
                {t(sym)}
              </Typography>
            ))}
          </Box>
        </Section>
      )}

      {place.facts?.length > 0 && (
        <Section icon="solar:lightbulb-bolt-bold-duotone" title={COPY[lang].facts} color={color}>
          <Box component="ul" sx={{ pl: 2.5, display: 'grid', gap: 0.5 }}>
            {place.facts.map((fact, i) => (
              <Typography key={i} component="li" variant="body2">
                {t(fact)}
              </Typography>
            ))}
          </Box>
        </Section>
      )}
    </Box>
  );
}

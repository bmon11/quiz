'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { useLang } from 'src/locales';

import { SmartIcon } from 'src/components/state-views';

// ----------------------------------------------------------------------

export const JEOPARDY_BLUE = '#0A16C9';
export const JEOPARDY_GOLD = '#FFCC00';

/** Columns are lessons; a used clue leaves an empty tile. Scrolls sideways on a phone. */
export function JeopardyBoard({ board, used, onPick }) {
  const { s, t } = useLang();
  const n = board.columns.length;
  const done = new Set(used);

  return (
    <Box sx={{ overflowX: 'auto', mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, pb: 1 }}>
      <Box
        role="grid"
        aria-label={s.jeopardy}
        sx={{
          display: 'grid',
          gap: { xs: 0.75, md: 1 },
          gridTemplateColumns: `repeat(${n}, minmax(112px, 1fr))`,
          p: { xs: 0.75, md: 1 },
          borderRadius: 2,
          bgcolor: '#000',
          minWidth: n * 112,
        }}
      >
        {board.columns.map((col) => (
          <Stack
            key={col.lessonKey}
            role="columnheader"
            alignItems="center"
            justifyContent="center"
            spacing={0.5}
            sx={{
              px: 1,
              py: 1.25,
              minHeight: { xs: 84, md: 104 },
              textAlign: 'center',
              color: 'common.white',
              bgcolor: JEOPARDY_BLUE,
              borderRadius: 1,
              borderBottom: `3px solid ${col.topic?.color ?? JEOPARDY_GOLD}`,
            }}
          >
            {col.topic && (
              <Box sx={{ display: 'flex', opacity: 0.9 }}>
                <SmartIcon icon={col.topic.icon} size={18} />
              </Box>
            )}
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: 12, md: 14 },
                lineHeight: 1.2,
                textTransform: 'uppercase',
                letterSpacing: 0.3,
                textShadow: '0 2px 0 rgba(0,0,0,0.5)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {t(col.title)}
            </Typography>
          </Stack>
        ))}

        {board.columns[0].clues.map((_, row) =>
          board.columns.map((col, c) => {
            const clue = col.clues[row];
            const gone = !clue || done.has(`${c}-${row}`);
            return (
              <ButtonBase
                key={`${c}-${row}`}
                role="gridcell"
                disabled={gone}
                onClick={() => onPick(c, row)}
                aria-label={gone ? '' : `${t(col.title)} ${clue.value}`}
                sx={{
                  minHeight: { xs: 60, md: 84 },
                  borderRadius: 1,
                  bgcolor: gone ? '#050A5E' : JEOPARDY_BLUE,
                  color: JEOPARDY_GOLD,
                  fontWeight: 900,
                  fontSize: { xs: 22, md: 34 },
                  textShadow: '0 3px 0 rgba(0,0,0,0.55)',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'transform 120ms, filter 120ms',
                  '&:hover': { filter: 'brightness(1.25)' },
                  '&:active': { transform: 'scale(0.97)' },
                  '&.Mui-focusVisible': { outline: `3px solid ${JEOPARDY_GOLD}` },
                }}
              >
                {gone ? '' : clue.value}
              </ButtonBase>
            );
          })
        )}
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function Scoreboard({ players, control }) {
  const { s } = useLang();
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.25,
        mb: 2,
        gridTemplateColumns: `repeat(auto-fill, minmax(140px, 1fr))`,
      }}
    >
      {players.map((p, i) => (
        <Box
          key={i}
          sx={{
            px: 2,
            py: 1.25,
            borderRadius: 1.5,
            color: 'common.white',
            bgcolor: JEOPARDY_BLUE,
            boxShadow: i === control ? `0 0 0 3px ${JEOPARDY_GOLD}` : 'none',
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }} noWrap>
            {i === control ? `▶ ${p.name}` : p.name}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: p.score < 0 ? '#FF8A80' : JEOPARDY_GOLD,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {p.score.toLocaleString()}
          </Typography>
          {i === control && (
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              {s.picksNext}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

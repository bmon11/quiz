'use client';

import { useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { useLang } from 'src/locales';

import { useTap } from 'src/components/use-tap';
import { Iconify } from 'src/components/iconify';

import { ReportDialog } from './report-dialog';
import { FamilyBranch } from '../family/family-branch';

// ----------------------------------------------------------------------

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const GREEN = '#22C55E';
const RED = '#FF5630';

/**
 * One question on the dark story card. After answering only the picked and the
 * right choice stay (the card must fit a phone screen), then the explanation
 * and — for a question about the gods — their branch of the family tree.
 */
export function QuestionSlide({
  question,
  reply,
  checking,
  family,
  color,
  isLast,
  onChoose,
  onNext,
}) {
  const { s, t } = useLang();
  const answered = !!reply;
  const [reporting, setReporting] = useState(false);
  const showTree = answered && family && question.gods?.length > 0;

  return (
    <Box sx={{ px: 2.5, pt: 2, pb: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="caption" sx={{ color: 'grey.400', fontWeight: 700, mb: 0.5 }}>
        {s.difficulty[(question.difficulty ?? 1) - 1]}
        {question.source && (
          <Box
            component="span"
            sx={{
              ml: 1,
              px: 0.75,
              py: 0.25,
              borderRadius: 0.75,
              color: question.source === 'show' ? '#FFAB00' : 'grey.300',
              bgcolor:
                question.source === 'show' ? 'rgba(255,171,0,0.16)' : 'rgba(255,255,255,0.08)',
            }}
          >
            {s.source[question.source]}
          </Box>
        )}
      </Typography>
      <Typography
        component="h2"
        sx={{
          fontWeight: 800,
          lineHeight: 1.3,
          mb: 2.5,
          fontSize: { xs: '1.45rem', md: '1.6rem' },
          textShadow: '0 1px 10px rgba(0,0,0,0.35)',
        }}
      >
        {t(question.prompt)}
      </Typography>

      {/* Pushes the choices toward the thumb on tall phones. */}
      {!answered && <Box sx={{ flex: 1, minHeight: 8 }} />}

      <Stack spacing={1.25} role="radiogroup" aria-label={t(question.prompt)}>
        <AnimatePresence initial={false}>
          {question.choices.map((choice, i) => {
            const state = !answered
              ? 'idle'
              : i === reply.answer
                ? 'right'
                : i === reply.choice
                  ? 'wrong'
                  : 'gone';
            if (state === 'gone') return null;
            return (
              <m.div
                key={i}
                layout
                initial={false}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Choice
                  letter={LETTERS[i]}
                  label={t(choice)}
                  state={state}
                  loading={checking}
                  disabled={answered || checking}
                  onPick={() => onChoose(i)}
                />
              </m.div>
            );
          })}
        </AnimatePresence>
      </Stack>

      {answered && (
        <Box
          component={m.div}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ mt: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
            <Box component="span" sx={{ fontSize: 26 }} aria-hidden>
              {reply.correct ? '🎉' : '💡'}
            </Box>
            <Typography variant="h6" sx={{ color: reply.correct ? GREEN : '#FFD666' }}>
              {reply.correct ? s.correct : s.wrong}
            </Typography>
          </Stack>
          <Typography sx={{ lineHeight: 1.5, color: 'grey.100' }}>
            {t(reply.explanation)}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ flex: 1, color: 'grey.400' }}>
              👥{' '}
              {reply.correctRate === null || reply.correctRate === undefined
                ? s.firstToAnswer
                : s.othersGotIt(reply.correctRate)}
            </Typography>
            <Button
              size="small"
              onClick={() => setReporting(true)}
              startIcon={<Iconify icon="solar:flag-linear" width={16} />}
              sx={{ color: 'grey.400', flexShrink: 0, '&:hover': { color: 'common.white' } }}
            >
              {s.reportProblem}
            </Button>
          </Stack>
          <ReportDialog open={reporting} question={question} onClose={() => setReporting(false)} />

          {showTree && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(0,0,0,0.32)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  color: 'grey.300',
                  mb: 0.5,
                }}
              >
                <Iconify icon="solar:users-group-two-rounded-bold-duotone" width={16} />
                {s.familyTree}
              </Typography>
              <FamilyBranch family={family} focus={question.gods} dark />
            </Box>
          )}

          <Box sx={{ flex: 1 }} />
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="primary"
            onClick={onNext}
            endIcon={
              <Iconify icon={isLast ? 'solar:cup-star-bold' : 'eva:arrow-ios-forward-fill'} />
            }
            sx={{
              mt: 2.5,
              py: 1.5,
              fontSize: 17,
              bgcolor: color,
              '&:hover': { bgcolor: color, filter: 'brightness(1.08)' },
            }}
          >
            {isLast ? s.seeResults : s.next}
          </Button>
          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'grey.500' }}
          >
            {s.swipeNext} ←
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

function Choice({ letter, label, state, loading, disabled, onPick }) {
  // On the finger's lift (sedev's useTap): iOS drops clicks on busy, animating pages.
  // A swipe that starts and ends on this (full-width) answer is not a pick.
  const down = useRef(null);
  const tap = useTap((event) => {
    const start = down.current;
    const moved = start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10;
    if (!disabled && !moved) onPick();
  });
  const look = {
    idle: {
      border: 'rgba(255,255,255,0.4)',
      bg: 'rgba(255,255,255,0.1)',
      badge: 'rgba(255,255,255,0.2)',
    },
    right: { border: GREEN, bg: 'rgba(34,197,94,0.25)', badge: GREEN },
    wrong: { border: RED, bg: 'rgba(255,86,48,0.22)', badge: RED },
  }[state];

  return (
    <ButtonBase
      role="radio"
      aria-checked={state !== 'idle'}
      aria-disabled={disabled}
      {...tap}
      onPointerDown={(event) => {
        down.current = { x: event.clientX, y: event.clientY };
      }}
      sx={{
        width: 1,
        minHeight: 58,
        px: 1.5,
        py: 1.25,
        gap: 1.5,
        color: 'common.white',
        justifyContent: 'flex-start',
        textAlign: 'left',
        borderRadius: 2,
        border: `2px solid ${look.border}`,
        bgcolor: look.bg,
        backdropFilter: 'blur(6px)',
        transition: 'background-color 150ms, border-color 150ms, transform 120ms',
        '&:active': { transform: disabled ? 'none' : 'scale(0.98)' },
        '@media (hover: hover)': {
          '&:hover': { bgcolor: disabled ? look.bg : 'rgba(255,255,255,0.18)' },
        },
        '&.Mui-focusVisible': { outline: '3px solid #fff', outlineOffset: 2 },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: 1.25,
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          bgcolor: look.badge,
        }}
      >
        {state === 'right' ? (
          <Iconify icon="eva:checkmark-fill" />
        ) : state === 'wrong' ? (
          <Iconify icon="eva:close-fill" />
        ) : loading ? (
          <Iconify icon="svg-spinners:3-dots-fade" />
        ) : (
          letter
        )}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{label}</Typography>
    </ButtonBase>
  );
}

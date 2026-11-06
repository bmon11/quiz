'use client';

import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useAuth } from 'src/auth';
import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const formatDuration = (ms) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** The story's last card: score ring, rank, and what to do next (swipe up = next lesson). */
export function ResultSlide({
  result,
  slug,
  lessonKey,
  color,
  next,
  durationMs,
  onRestart,
  onNext,
  onClose,
}) {
  const { s, t } = useLang();
  const { user } = useAuth();
  const pathname = usePathname();

  if (!result) {
    return (
      <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <CircularProgress sx={{ color: 'common.white' }} />
      </Box>
    );
  }

  const { percent, score, total, betterThan } = result;
  const ring = percent >= 80 ? '#22C55E' : percent >= 50 ? '#FFFFFF' : '#FFD666';

  return (
    <Stack alignItems="center" sx={{ px: 3, pt: 3, pb: 3, flex: 1, textAlign: 'center' }}>
      <Typography component="h2" sx={{ fontWeight: 800, fontSize: '2rem', mb: 0.5 }}>
        {percent >= 80 ? '🏆 ' : percent >= 50 ? '⭐ ' : '🌱 '}
        {s.resultTitle(percent)}
      </Typography>
      <Typography sx={{ color: 'grey.300', mb: 3 }}>{s.youScored(score, total)}</Typography>

      <Box
        component={m.div}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        sx={{ position: 'relative', width: 180, height: 180, mb: 3 }}
      >
        <CircularProgress
          variant="determinate"
          value={100}
          size={180}
          thickness={4}
          sx={{ color: 'rgba(255,255,255,0.18)', position: 'absolute', top: 0, left: 0 }}
        />
        <CircularProgress
          variant="determinate"
          value={percent}
          size={180}
          thickness={4}
          sx={{
            color: ring,
            position: 'absolute',
            top: 0,
            left: 0,
            '& circle': { strokeLinecap: 'round' },
          }}
        />
        <Box sx={{ inset: 0, position: 'absolute', display: 'grid', placeItems: 'center' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '2.75rem' }}>{percent}%</Typography>
        </Box>
      </Box>

      <Stack
        direction="row"
        spacing={2.5}
        justifyContent="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 3, color: 'grey.200' }}
      >
        {/* "Better than 0%" discourages — skip the line instead. */}
        {betterThan !== 0 && (
          <Typography variant="subtitle1">
            🏅{' '}
            {betterThan === null || betterThan === undefined
              ? s.firstPlayer
              : s.betterThan(betterThan)}
          </Typography>
        )}
        <Typography variant="subtitle1">
          ⏱ {s.timeTaken}: {formatDuration(durationMs)}
        </Typography>
      </Stack>

      <FocusList result={result} slug={slug} lessonKey={lessonKey} />

      {result.saved ? (
        <Button
          size="small"
          component={RouterLink}
          href={paths.me}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
          sx={{ mb: 2, color: '#86EFAC' }}
        >
          {s.savedToProgress} · {s.seeAnalysis}
        </Button>
      ) : (
        !user && (
          <Button
            size="small"
            variant="outlined"
            component={RouterLink}
            href={paths.login(pathname)}
            startIcon={<Iconify icon="solar:login-3-bold-duotone" />}
            sx={{
              mb: 2,
              color: 'common.white',
              borderColor: 'rgba(255,255,255,0.4)',
              textAlign: 'left',
            }}
          >
            {s.signInToSave}
          </Button>
        )
      )}

      <Box sx={{ flex: 1 }} />

      <Stack spacing={1.25} sx={{ width: 1 }}>
        {next && (
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="primary"
            onClick={onNext}
            endIcon={<Iconify icon="eva:arrow-upward-fill" />}
            sx={{
              py: 1.5,
              fontSize: 17,
              bgcolor: color,
              '&:hover': { bgcolor: color, filter: 'brightness(1.08)' },
            }}
          >
            {s.nextLesson}: {t(next.title)}
          </Button>
        )}
        <Button
          fullWidth
          size="large"
          variant="outlined"
          onClick={onRestart}
          startIcon={<Iconify icon="solar:restart-bold" />}
          sx={{ py: 1.25, color: 'common.white', borderColor: 'rgba(255,255,255,0.5)' }}
        >
          {s.playAgain}
        </Button>
        <Button fullWidth onClick={onClose} sx={{ color: 'grey.300' }}>
          {s.backToLessons}
        </Button>
      </Stack>

      {next && (
        <Typography variant="caption" sx={{ mt: 1.5, color: 'grey.500' }}>
          ↑ {s.swipeUp}
        </Typography>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

/**
 * A quick quiz (or a tournament game) spans lessons: name the ones this run went
 * worst in, with a link to practise them in their own topic.
 */
function FocusList({ result, slug, lessonKey }) {
  const { s, t } = useLang();
  const weak = (result.breakdown ?? []).filter((row) => row.correct < row.total);
  if ((lessonKey && slug !== 'tournament') || !weak.length) return null;

  return (
    <Box sx={{ width: 1, mb: 2.5, textAlign: 'left' }}>
      <Typography variant="overline" sx={{ color: 'grey.400' }}>
        🎯 {s.focusOn}
      </Typography>
      <Stack spacing={0.75} sx={{ mt: 0.5 }}>
        {weak.slice(0, 3).map((row) => (
          <Stack
            key={row.lessonKey}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ px: 1.5, py: 1, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.08)' }}
          >
            <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
              {t(row.title)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.400' }}>
              {row.correct}/{row.total}
            </Typography>
            <Button
              size="small"
              // A plain link: the open reader keeps its own state, so load the lesson's quiz fresh.
              href={paths.quiz(row.topicSlug ?? slug, row.lessonKey)}
              sx={{ color: 'common.white', minWidth: 0 }}
            >
              {s.practice}
            </Button>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

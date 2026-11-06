'use client';

import { useMemo, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useLang } from 'src/locales';
import { useTournament } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { ErrorState, LoadingState } from 'src/components/state-views';

import { hexToChannel } from '../home/home-view';
import { QuizReader } from '../quiz/quiz-reader';

// ----------------------------------------------------------------------
// «Тэмцээний асуултууд»: real tournament questions, one deck per game (in the
// order they were asked), plus a random mix and the predicted questions. A deck
// opens in the ordinary quiz reader; swiping up / down moves between games.

const FEATURED = {
  mix: { icon: 'solar:shuffle-bold-duotone', hint: 'tournamentMix' },
  predicted: { icon: 'solar:magic-stick-3-bold-duotone', hint: 'tournamentPredicted' },
  photos: { icon: 'solar:camera-bold-duotone', hint: 'tournamentPhotos' },
};

export function TournamentView() {
  const { s, t } = useLang();
  const { topic, decks, tournamentLoading, tournamentError, retry } = useTournament();
  const color = topic?.color ?? '#B45309';

  const featured = decks.filter((d) => FEATURED[d.key]);
  const years = useMemo(() => {
    const byYear = new Map();
    decks
      .filter((d) => d.year)
      .forEach((d) => byYear.set(d.year, [...(byYear.get(d.year) ?? []), d]));
    return [...byYear.entries()];
  }, [decks]);

  if (tournamentError) return <ErrorState onRetry={retry} />;
  if (tournamentLoading || !topic) return <LoadingState />;

  return (
    <>
      <Typography variant="h3" sx={{ mb: 1 }}>
        {t(topic.title)}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 720 }}>
        {s.tournamentIntro}
      </Typography>

      <Box
        sx={{
          mb: 5,
          gap: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        }}
      >
        {featured.map((d) => (
          <Card key={d.key} sx={{ border: `2px solid ${varAlpha(hexToChannel(color), 0.24)}` }}>
            <CardActionArea
              component={RouterLink}
              href={paths.quiz(topic.slug, d.key)}
              sx={{ p: 3, height: 1, display: 'flex', alignItems: 'flex-start', gap: 2 }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  color,
                  bgcolor: varAlpha(hexToChannel(color), 0.12),
                }}
              >
                <Iconify icon={FEATURED[d.key].icon} width={28} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6">{t(d.title)}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {s[FEATURED[d.key].hint]}
                </Typography>
                <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
                  {s.questionsN(d.count)}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      <Typography variant="h4" sx={{ mb: 2 }}>
        {s.tournamentGames}
      </Typography>
      {years.map(([year, games]) => (
        <Box key={year} sx={{ mb: 4 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {year}
          </Typography>
          <Box
            sx={{
              gap: 1.5,
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
                md: 'repeat(6, 1fr)',
              },
            }}
          >
            {games.map((g) => (
              <Card key={g.key} variant="outlined">
                <CardActionArea
                  component={RouterLink}
                  href={paths.quiz(topic.slug, g.key)}
                  sx={{ px: 2, py: 1.5 }}
                >
                  <Typography variant="subtitle1">
                    {`${g.key.slice(4, 6)}.${g.key.slice(6, 8)}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.questionsN(g.count)}
                  </Typography>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      ))}
    </>
  );
}

// ----------------------------------------------------------------------

/** /tournament/quiz?lesson=<game> — the reader over every tournament deck. */
export function TournamentQuizScreen({ deckKey }) {
  const router = useRouter();
  const { topic, decks, tournamentError, retry } = useTournament();
  const close = useCallback(() => router.push(paths.tournament), [router]);

  if (tournamentError) return <ErrorState onRetry={retry} />;
  if (!topic) return <LoadingState />;

  return (
    <QuizReader
      slug={topic.slug}
      topic={topic}
      lessons={decks}
      lessonKey={deckKey ?? 'mix'}
      onClose={close}
    />
  );
}

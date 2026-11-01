'use client';

import { m } from 'framer-motion';
import { useMemo, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useAuth } from 'src/auth';
import { useLang } from 'src/locales';
import { useTopics, useAnalysis } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionContainer } from 'src/components/animate';
import { SmartIcon, ErrorState, LoadingState } from 'src/components/state-views';

import { cosmicSx, Starfield } from '../visuals/starfield';

// ----------------------------------------------------------------------

export function HomeView() {
  const { s, t } = useLang();
  const { user } = useAuth();
  const { topics, topicsLoading, topicsError, retry } = useTopics();
  const { analysis } = useAnalysis(!!user);
  const [search, setSearch] = useState('');

  const totals = useMemo(
    () => ({
      topics: topics.length,
      lessons: topics.reduce((n, x) => n + (x.lessonCount ?? 0), 0),
      questions: topics.reduce((n, x) => n + (x.questionCount ?? 0), 0),
    }),
    [topics]
  );
  const needle = search.trim().toLowerCase();
  const shown = needle
    ? topics.filter((x) =>
        [x.title?.en, x.title?.mn, x.tagline?.en, x.tagline?.mn].some((v) =>
          v?.toLowerCase().includes(needle)
        )
      )
    : topics;
  const focus = analysis?.improve?.slice(0, 3) ?? [];

  return (
    <MotionContainer>
      <Box
        component={m.div}
        variants={varFade('inUp')}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          mb: { xs: 4, md: 5 },
          px: { xs: 2.5, md: 6 },
          py: { xs: 5, md: 7 },
          borderRadius: 3,
          background: (theme) =>
            `radial-gradient(80% 120% at 0% 0%, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.18)} 0%, transparent 60%), radial-gradient(70% 120% at 100% 100%, ${varAlpha(theme.vars.palette.warning.mainChannel, 0.16)} 0%, transparent 60%)`,
          border: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Chip
          size="small"
          variant="soft"
          color="primary"
          icon={<Iconify icon="solar:stars-bold" width={16} />}
          label={s.heroBadge}
          sx={{ mb: 2.5, fontWeight: 600 }}
        />
        <Typography variant="h2" sx={{ mb: 1.5, fontSize: { xs: 30, md: 48 }, letterSpacing: -1 }}>
          {s.heroTitle}
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 400, maxWidth: 620, mx: 'auto', mb: 3.5 }}
        >
          {s.heroSubtitle}
        </Typography>

        {totals.topics > 0 && (
          <Stack
            direction="row"
            justifyContent="center"
            spacing={{ xs: 3, md: 6 }}
            sx={{ mb: 3.5 }}
          >
            {[
              [totals.topics, s.statTopics],
              [totals.lessons, s.statLessons],
              [totals.questions, s.statQuestions],
            ].map(([value, label]) => (
              <Box key={label}>
                <Typography variant="h3" sx={{ color: 'primary.main', lineHeight: 1.1 }}>
                  {value.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
          {user ? (
            <Button
              size="large"
              variant="contained"
              component={RouterLink}
              href={paths.me}
              startIcon={<Iconify icon="solar:chart-square-bold-duotone" />}
            >
              {s.myProgress}
            </Button>
          ) : (
            <Button
              size="large"
              variant="contained"
              component={RouterLink}
              href={paths.login()}
              startIcon={<Iconify icon="solar:login-3-bold-duotone" />}
            >
              {s.signIn}
            </Button>
          )}
          <Button
            size="large"
            variant="outlined"
            color="inherit"
            href="#categories"
            endIcon={<Iconify icon="solar:arrow-down-linear" />}
          >
            {s.browseTopics}
          </Button>
        </Stack>
      </Box>

      {focus.length > 0 && (
        <Box component={m.div} variants={varFade('inUp')} sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Iconify icon="solar:target-bold-duotone" width={24} sx={{ color: 'error.main' }} />
            <Typography variant="h6">{s.toImprove}</Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              component={RouterLink}
              href={paths.me}
              endIcon={<Iconify icon="solar:arrow-right-linear" />}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {s.seeAnalysis}
              </Box>
            </Button>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            }}
          >
            {focus.map((row) => {
              const topic = topics.find((x) => x.slug === row.topicSlug);
              return (
                <Card
                  key={row.lessonKey}
                  sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}
                >
                  <Box sx={{ color: topic?.color, display: 'flex' }}>
                    <SmartIcon icon={topic?.icon} size={28} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {t(row.title)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.recentAccuracy}% · {row.correct}/{row.answered}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="soft"
                    component={RouterLink}
                    href={paths.quiz(row.topicSlug, row.lessonKey)}
                  >
                    {s.practice}
                  </Button>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      <Box component={m.div} variants={varFade('inUp')} sx={{ mb: 4 }}>
        <CardActionArea
          component={RouterLink}
          href={paths.jeopardy}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: 'common.white',
            background: 'linear-gradient(120deg, #0A16C9 0%, #2333FF 60%, #3D4BFF 100%)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 14px)',
              gap: '3px',
              flexShrink: 0,
            }}
            aria-hidden
          >
            {Array.from({ length: 9 }, (_, i) => (
              <Box
                key={i}
                sx={{
                  width: 14,
                  height: 10,
                  borderRadius: 0.25,
                  bgcolor: i === 4 ? '#FFCC00' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" sx={{ color: '#FFCC00' }}>
              {s.jeopardy}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {s.jeopardyTeaser}
            </Typography>
          </Box>
          <Iconify icon="solar:arrow-right-linear" width={24} />
        </CardActionArea>
      </Box>

      <Stack
        id="categories"
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        spacing={2}
        sx={{ mb: 3, scrollMarginTop: 88 }}
      >
        <Typography variant="h4" sx={{ flex: 1 }}>
          {s.categories}
        </Typography>
        {topics.length > 3 && (
          <TextField
            size="small"
            placeholder={s.searchTopics}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { sm: 280 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      </Stack>

      {topicsLoading && !topics.length && <LoadingState />}
      {topicsError && !topics.length && <ErrorState onRetry={retry} />}
      {needle && !shown.length && (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          {s.noMatch}
        </Typography>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        }}
      >
        {shown.map((topic) => (
          <Box component={m.div} key={topic.slug} variants={varFade('inUp')}>
            <TopicCard topic={topic} />
          </Box>
        ))}
      </Box>
    </MotionContainer>
  );
}

// ----------------------------------------------------------------------

function TopicCard({ topic }) {
  const { s, t } = useLang();
  const cosmic = topic.effect === 'stars';

  return (
    <Card
      sx={{
        height: 1,
        display: 'flex',
        flexDirection: 'column',
        border: `2px solid ${varAlpha(hexToChannel(topic.color), 0.24)}`,
        transition: 'transform 160ms, box-shadow 160ms',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.vars.customShadows.z20,
        },
      }}
    >
      <CardActionArea
        component={RouterLink}
        href={paths.topic(topic.slug)}
        sx={{ flexGrow: 1, p: { xs: 3, md: 4 } }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            mb: 3,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: topic.color,
            bgcolor: varAlpha(hexToChannel(topic.color), 0.12),
            ...(cosmic && { ...cosmicSx(topic.color), width: 1, height: 96, borderRadius: 2 }),
          }}
        >
          {cosmic && <Starfield density={1.6} />}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              filter: cosmic ? `drop-shadow(0 0 14px ${topic.color})` : undefined,
            }}
          >
            <SmartIcon icon={topic.icon} size={44} />
          </Box>
        </Box>

        <Typography variant="h4" sx={{ mb: 1 }}>
          {t(topic.title)}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: topic.color, mb: 1.5 }}>
          {t(topic.tagline)}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t(topic.description)}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            icon={<Iconify icon="solar:book-2-bold" />}
            label={`${topic.lessonCount} ${s.lessons}`}
          />
          <Chip
            icon={<Iconify icon="solar:question-circle-bold" />}
            label={`${topic.questionCount} ${s.questions}`}
          />
          {topic.plays > 0 && (
            <Chip
              icon={<Iconify icon="solar:users-group-rounded-bold" />}
              label={`${topic.plays} ${s.plays}`}
            />
          )}
        </Stack>
      </CardActionArea>

      <Box sx={{ px: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
        <Button
          fullWidth
          size="large"
          variant="contained"
          color="primary"
          component={RouterLink}
          href={paths.topic(topic.slug)}
          endIcon={<Iconify icon="solar:arrow-right-linear" />}
          sx={{
            bgcolor: topic.color,
            '&:hover': { bgcolor: topic.color, filter: 'brightness(0.92)' },
          }}
        >
          {s.start}
        </Button>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

/** "#7C4DFF" → "124 77 255" (the channel format varAlpha expects). */
export const hexToChannel = (hex = '#000000') => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/./g, '$&$&') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(' ');
};

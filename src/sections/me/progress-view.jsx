'use client';

import { useEffect } from 'react';
import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useAuth } from 'src/auth';
import { useLang } from 'src/locales';
import { useTopics, useAnalysis } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';
import { SmartIcon, ErrorState, LoadingState } from 'src/components/state-views';

import { hexToChannel } from '../home/home-view';

// ----------------------------------------------------------------------

const LEVEL_COLOR = { weak: 'error', ok: 'warning', strong: 'success', new: 'default' };
const LEVEL_ICON = {
  weak: 'solar:danger-triangle-bold',
  ok: 'solar:graph-up-bold',
  strong: 'solar:medal-ribbons-star-bold',
  new: 'solar:hourglass-bold',
};

const formatTime = (ms) => {
  const min = Math.round(ms / 60000);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
};

export function ProgressView() {
  const { s } = useLang();
  const router = useRouter();
  const { user, checking } = useAuth();
  const { analysis, analysisError, retry } = useAnalysis(!!user);
  const { topics } = useTopics();

  useEffect(() => {
    if (!checking && !user) router.replace(paths.login(paths.me));
  }, [checking, user, router]);

  if (checking || !user) return <LoadingState />;
  if (analysisError) return <ErrorState onRetry={retry} />;
  if (!analysis) return <LoadingState />;

  const topicOf = (slug) =>
    topics.find((x) => x.slug === slug) ?? analysis.byTopic.find((x) => x.slug === slug);
  const { totals } = analysis;

  return (
    <Stack spacing={4}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={user.avatar || undefined}
          imgProps={{ referrerPolicy: 'no-referrer' }}
          sx={{
            width: 64,
            height: 64,
            fontSize: 28,
            bgcolor: 'primary.main',
            color: 'common.white',
          }}
        >
          {user.name?.[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h3">{s.progressTitle}</Typography>
          <Typography color="text.secondary">{s.progressSubtitle}</Typography>
        </Box>
      </Stack>

      {totals.attempts === 0 ? (
        <Card sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Iconify
            icon="solar:chart-2-bold-duotone"
            width={72}
            sx={{ color: 'primary.main', mb: 2 }}
          />
          <Typography variant="h5" sx={{ mb: 1 }}>
            {s.noProgressTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {s.noProgressBody}
          </Typography>
          <Button variant="contained" size="large" component={RouterLink} href={paths.home}>
            {s.browseTopics}
          </Button>
        </Card>
      ) : (
        <>
          <StatTiles totals={totals} />
          <ImproveSection analysis={analysis} topicOf={topicOf} />
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
            }}
          >
            <TrendCard trend={analysis.trend} />
            <DifficultyCard rows={analysis.byDifficulty} />
          </Box>
          <CategoryCard rows={analysis.byTopic} />
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                md: analysis.strengths.length && analysis.untried.length ? '1fr 1fr' : '1fr',
              },
              '&:empty': { display: 'none' },
            }}
          >
            <LessonChips
              title={s.strengths}
              icon="solar:medal-ribbons-star-bold-duotone"
              rows={analysis.strengths}
              topicOf={topicOf}
              showAcc
            />
            <LessonChips
              title={s.tryNext}
              icon="solar:compass-bold-duotone"
              rows={analysis.untried}
              topicOf={topicOf}
            />
          </Box>
          <MissedCard rows={analysis.missed} topicOf={topicOf} />
          <RecentCard rows={analysis.recent} topicOf={topicOf} />
        </>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function StatTiles({ totals }) {
  const { s } = useLang();
  const tiles = [
    {
      label: s.quizzesTaken,
      value: totals.attempts,
      icon: 'solar:play-circle-bold-duotone',
      color: 'primary',
    },
    {
      label: s.answered,
      value: totals.answered,
      icon: 'solar:checklist-minimalistic-bold-duotone',
      color: 'info',
    },
    {
      label: s.accuracy,
      value: `${totals.accuracy}%`,
      icon: 'solar:target-bold-duotone',
      color: 'success',
    },
    { label: s.streak, value: totals.streak, icon: 'solar:fire-bold-duotone', color: 'warning' },
    {
      label: s.studyTime,
      value: formatTime(totals.timeMs),
      icon: 'solar:clock-circle-bold-duotone',
      color: 'secondary',
    },
  ];
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
      }}
    >
      {tiles.map((tile, i) => (
        <Card
          key={tile.label}
          component={m.div}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          sx={{ p: 2.5 }}
        >
          <Iconify icon={tile.icon} width={32} sx={{ color: `${tile.color}.main`, mb: 1 }} />
          <Typography variant="h4">{tile.value}</Typography>
          <Typography variant="body2" color="text.secondary">
            {tile.label}
          </Typography>
        </Card>
      ))}
    </Box>
  );
}

function SectionTitle({ icon, title, hint }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Iconify icon={icon} width={26} sx={{ color: 'primary.main' }} />
        <Typography variant="h5">{title}</Typography>
      </Stack>
      {hint && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

function ImproveSection({ analysis, topicOf }) {
  const { s, t } = useLang();
  return (
    <Box>
      <SectionTitle icon="solar:target-bold-duotone" title={s.toImprove} hint={s.toImproveHint} />
      {analysis.improve.length === 0 ? (
        <Card sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Iconify icon="solar:cup-star-bold-duotone" width={40} sx={{ color: 'success.main' }} />
          <Typography>{s.nothingToImprove}</Typography>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          }}
        >
          {analysis.improve.map((row, i) => {
            const topic = topicOf(row.topicSlug);
            const color = topic?.color ?? '#00A76F';
            return (
              <Card
                key={row.lessonKey}
                component={m.div}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                sx={{
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${color}`,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <SmartIcon icon={topic?.icon} size={18} color={color} />
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {t(topic?.title)}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <LevelChip level={row.level} />
                </Stack>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  {t(row.title)}
                </Typography>
                <AccuracyBar value={row.recentAccuracy} color={color} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                  {s.recentAcc} {row.recentAccuracy}% · {s.accuracy.toLowerCase()} {row.accuracy}% ·{' '}
                  {row.correct}/{row.answered}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    component={RouterLink}
                    href={paths.lesson(row.topicSlug, row.lessonKey)}
                    startIcon={<Iconify icon="solar:book-2-bold" />}
                  >
                    {s.readLesson}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    component={RouterLink}
                    href={paths.quiz(row.topicSlug, row.lessonKey)}
                    startIcon={<Iconify icon="solar:restart-bold" />}
                    sx={{
                      bgcolor: color,
                      '&:hover': { bgcolor: color, filter: 'brightness(0.92)' },
                    }}
                  >
                    {s.practice}
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function LevelChip({ level }) {
  const { s } = useLang();
  return (
    <Chip
      size="small"
      variant="soft"
      color={LEVEL_COLOR[level]}
      icon={<Iconify icon={LEVEL_ICON[level]} width={14} />}
      label={s.level[level]}
    />
  );
}

function AccuracyBar({ value, color }) {
  return (
    <LinearProgress
      variant="determinate"
      value={value}
      sx={{
        height: 8,
        borderRadius: 1,
        bgcolor: varAlpha(hexToChannel(color), 0.16),
        '& .MuiLinearProgress-bar': { borderRadius: 1, bgcolor: color },
      }}
    />
  );
}

function TrendCard({ trend }) {
  const { s, lang } = useLang();
  const options = useChart({
    chart: { sparkline: { enabled: false }, zoom: { enabled: false } },
    stroke: { width: 2, curve: 'smooth' },
    markers: { size: 4, strokeWidth: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.32, opacityTo: 0 } },
    xaxis: {
      categories: trend.map((p) =>
        new Date(p.at).toLocaleDateString(lang === 'mn' ? 'mn-MN' : 'en-US', {
          month: 'short',
          day: 'numeric',
        })
      ),
      labels: { hideOverlappingLabels: true },
    },
    yaxis: { min: 0, max: 100, tickAmount: 4, labels: { formatter: (v) => `${Math.round(v)}%` } },
    tooltip: { y: { formatter: (v) => `${v}%` } },
  });
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle icon="solar:graph-new-up-bold-duotone" title={s.trend} />
      <Chart
        type="area"
        series={[{ name: s.accuracy, data: trend.map((p) => p.percent) }]}
        options={options}
        sx={{ height: 260 }}
      />
    </Card>
  );
}

function DifficultyCard({ rows }) {
  const { s } = useLang();
  const colors = ['#22C55E', '#FFAB00', '#FF5630'];
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle icon="solar:ranking-bold-duotone" title={s.byDifficulty} />
      <Stack spacing={2.5}>
        {rows.map((row, i) => (
          <Box key={row.difficulty}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Typography variant="subtitle2">
                {'●'.repeat(row.difficulty)}
                {'○'.repeat(3 - row.difficulty)} {s.difficulty[i]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {row.answered ? `${row.accuracy}% · ${row.answered}` : '—'}
              </Typography>
            </Stack>
            <AccuracyBar value={row.answered ? row.accuracy : 0} color={colors[i]} />
          </Box>
        ))}
      </Stack>
    </Card>
  );
}

function CategoryCard({ rows }) {
  const { s, t } = useLang();
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle icon="solar:widget-5-bold-duotone" title={s.byCategory} />
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {rows.map((row) => (
          <Stack key={row.slug} direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                color: row.color,
                bgcolor: varAlpha(hexToChannel(row.color), 0.12),
              }}
            >
              <SmartIcon icon={row.icon} size={28} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Typography
                  variant="subtitle2"
                  noWrap
                  component={RouterLink}
                  href={paths.topic(row.slug)}
                  sx={{ color: 'text.primary', textDecoration: 'none' }}
                >
                  {t(row.title)}
                </Typography>
                <Typography variant="subtitle2">{row.accuracy}%</Typography>
              </Stack>
              <AccuracyBar value={row.accuracy} color={row.color} />
              <Typography variant="caption" color="text.secondary">
                {s.lessonsTried(row.lessonsTried, row.lessonsTotal)} · {row.correct}/{row.answered}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>
    </Card>
  );
}

function LessonChips({ title, icon, rows, topicOf, showAcc }) {
  const { t } = useLang();
  if (!rows.length) return null;
  return (
    <Card sx={{ p: 3 }}>
      <SectionTitle icon={icon} title={title} />
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
        {rows.map((row) => {
          const topic = topicOf(row.topicSlug);
          return (
            <Chip
              key={row.lessonKey}
              clickable
              component={RouterLink}
              href={paths.lesson(row.topicSlug, row.lessonKey)}
              icon={<SmartIcon icon={topic?.icon} size={16} color={topic?.color} />}
              label={showAcc ? `${t(row.title)} · ${row.recentAccuracy}%` : t(row.title)}
              variant="outlined"
            />
          );
        })}
      </Stack>
    </Card>
  );
}

function MissedCard({ rows, topicOf }) {
  const { s, t } = useLang();
  if (!rows.length) return null;
  return (
    <Box>
      <SectionTitle
        icon="solar:refresh-circle-bold-duotone"
        title={s.reviewMistakes}
        hint={s.reviewMistakesHint}
      />
      <Card>
        {rows.map((row) => (
          <Accordion
            key={row.id}
            disableGutters
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              borderBottom: (th) => `1px dashed ${th.vars.palette.divider}`,
            }}
          >
            <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <SmartIcon
                  icon={topicOf(row.topicSlug)?.icon}
                  size={20}
                  color={topicOf(row.topicSlug)?.color}
                />
                <Typography variant="subtitle2">{t(row.prompt)}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Typography sx={{ color: 'success.main', fontWeight: 700, mb: 0.5 }}>
                ✓ {t(row.answer)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t(row.explanation)}
              </Typography>
              <Button
                size="small"
                component={RouterLink}
                href={paths.lesson(row.topicSlug, row.lessonKey)}
                startIcon={<Iconify icon="solar:book-2-bold" />}
              >
                {s.readLesson}
              </Button>
            </AccordionDetails>
          </Accordion>
        ))}
      </Card>
    </Box>
  );
}

function RecentCard({ rows, topicOf }) {
  const { s, t, lang } = useLang();
  return (
    <Box>
      <SectionTitle icon="solar:history-bold-duotone" title={s.recentQuizzes} />
      <Card>
        {rows.map((row) => {
          const topic = topicOf(row.topicSlug);
          const good =
            row.percent >= 80 ? 'success.main' : row.percent >= 50 ? 'warning.main' : 'error.main';
          return (
            <Stack
              key={row.id}
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{
                px: 2.5,
                py: 1.75,
                borderBottom: (th) => `1px dashed ${th.vars.palette.divider}`,
                '&:last-of-type': { borderBottom: 'none' },
              }}
            >
              <SmartIcon icon={topic?.icon} size={24} color={topic?.color} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {row.lessonTitle
                    ? t(row.lessonTitle)
                    : `${t(row.topicTitle)} · ${s.quickQuizShort}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(row.at).toLocaleString(lang === 'mn' ? 'mn-MN' : 'en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Typography>
              </Box>
              <Typography variant="subtitle2" color="text.secondary">
                {row.score}/{row.total}
              </Typography>
              <Typography variant="h6" sx={{ color: good, minWidth: 56, textAlign: 'right' }}>
                {row.percent}%
              </Typography>
            </Stack>
          );
        })}
      </Card>
    </Box>
  );
}

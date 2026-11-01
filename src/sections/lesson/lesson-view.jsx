'use client';

import { useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
import { paths, lessonSlug } from 'src/routes/paths';

import { useLang } from 'src/locales';
import { useTopic } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { BackButton, ErrorState, LoadingState } from 'src/components/state-views';

import { hexToChannel } from '../home/home-view';
import { MapVisual } from '../visuals/map/map-visual';
import { cosmicSx, Starfield } from '../visuals/starfield';
import { VISUAL_ICONS, VisualRenderer } from '../visuals/visual-renderer';

// ----------------------------------------------------------------------

/** How many things the visual shows — "9 items" under its header. */
const visualCount = (v) =>
  v?.items?.length ??
  v?.people?.length ??
  v?.nodes?.length ??
  v?.bodies?.length ??
  v?.signs?.length ??
  0;

/**
 * `lessonName` is the URL part after the topic. A lesson moved to another
 * category keeps its key ("pubquiz.x" shown under /art/x), so match on the name
 * and prefer the key that carries this topic's prefix.
 */
export function LessonView({ slug, lessonName }) {
  const { s, t } = useLang();
  const router = useRouter();
  const { topic, lessons, topicLoading, topicError, retry } = useTopic(slug);

  const exact = lessons.findIndex((l) => l.key === `${slug}.${lessonName}`);
  const index = exact >= 0 ? exact : lessons.findIndex((l) => lessonSlug(l.key) === lessonName);
  const lessonKey = lessons[index]?.key;
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 ? lessons[index + 1] : null;

  // ← / → step through the lessons (ignored while typing).
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName))
        return;
      if (e.key === 'ArrowLeft' && prev) router.push(paths.lesson(slug, prev.key));
      if (e.key === 'ArrowRight' && next) router.push(paths.lesson(slug, next.key));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, router, slug]);

  // A new lesson starts at the top, not where the last one was scrolled to.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [lessonKey]);

  if (topicLoading && !topic) return <LoadingState />;
  if (topicError || !topic) return <ErrorState onRetry={retry} />;

  const lesson = lessons[index];
  if (!lesson) return <ErrorState message={s.notFound} />;
  const channel = hexToChannel(topic.color);
  const cosmic = topic.effect === 'stars';
  const count = visualCount(lesson.visual);
  // Admin-made lessons may have no cards yet.
  const hasVisual = lesson.visual && (lesson.visual.kind !== 'cards' || count > 0);

  const header = (
    <>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <Typography variant="overline" sx={{ color: topic.color, lineHeight: 1 }}>
          {s.lessonOf(index + 1, lessons.length)}
        </Typography>
        {lesson.questionCount > 0 && (
          <Typography
            variant="caption"
            sx={{ color: cosmic ? 'rgba(255,255,255,0.7)' : 'text.disabled' }}
          >
            · {lesson.questionCount} {s.questions}
          </Typography>
        )}
      </Stack>
      <Typography variant="h3" sx={{ mb: 2, fontSize: { xs: 28, md: 40 } }}>
        {t(lesson.title)}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontSize: { xs: 16, md: 18 }, lineHeight: 1.75, maxWidth: 760, mb: cosmic ? 0 : 4 }}
      >
        {t(lesson.body)}
      </Typography>
    </>
  );

  return (
    <>
      <BackButton href={paths.topic(slug)} label={t(topic.title)} />

      <LessonSteps lessons={lessons} index={index} slug={slug} color={topic.color} />

      {cosmic ? (
        <Card sx={{ ...cosmicSx(topic.color), p: { xs: 3, md: 5 }, mb: 4 }}>
          <Starfield density={1.2} />
          <Box sx={{ position: 'relative' }}>{header}</Box>
        </Card>
      ) : (
        header
      )}

      {hasVisual && (
        <Card sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
          {count > 1 && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
              <Iconify
                icon={VISUAL_ICONS[lesson.visual.kind] ?? 'solar:widget-bold-duotone'}
                width={22}
                sx={{ color: topic.color }}
              />
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                {s.visualTitle[lesson.visual.kind] ?? s.overview}
              </Typography>
              <Chip
                size="small"
                label={s.itemCount(count)}
                sx={{ fontWeight: 700, color: topic.color, bgcolor: varAlpha(channel, 0.12) }}
              />
            </Stack>
          )}
          <VisualRenderer visual={lesson.visual} color={topic.color} />
        </Card>
      )}

      {/* Geography lessons that list places also show them on a map. */}
      {lesson.map && lesson.visual?.kind !== 'map' && (
        <Card sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
            <Iconify icon={VISUAL_ICONS.map} width={22} sx={{ color: topic.color }} />
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              {s.visualTitle.map}
            </Typography>
            <Chip
              size="small"
              label={s.itemCount(lesson.map.items.length)}
              sx={{ fontWeight: 700, color: topic.color, bgcolor: varAlpha(channel, 0.12) }}
            />
          </Stack>
          <MapVisual visual={lesson.map} color={topic.color} />
        </Card>
      )}

      {lesson.funFacts?.length > 0 && (
        <Card
          sx={{ p: { xs: 2.5, md: 3 }, mb: 4, bgcolor: varAlpha(channel, 0.08), boxShadow: 'none' }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify
              icon="solar:lightbulb-bolt-bold-duotone"
              width={28}
              sx={{ color: topic.color }}
            />
            <Typography variant="h6">{s.didYouKnow}</Typography>
          </Stack>
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                md: lesson.funFacts.length > 3 ? '1fr 1fr' : '1fr',
              },
            }}
          >
            {lesson.funFacts.map((fact, i) => (
              <Stack component="li" key={i} direction="row" spacing={1.5}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    mt: 1,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: topic.color,
                  }}
                />
                <Typography>{t(fact)}</Typography>
              </Stack>
            ))}
          </Box>
        </Card>
      )}

      <LessonNav slug={slug} lesson={lesson} prev={prev} next={next} color={topic.color} />
    </>
  );
}

// ----------------------------------------------------------------------

/** One segment per lesson; tap to jump. Long lists collapse to a bar. */
function LessonSteps({ lessons, index, slug, color }) {
  const { t } = useLang();
  const segmented = lessons.length <= 24;

  return (
    <Box sx={{ display: 'flex', gap: 0.5, mb: 3 }}>
      {segmented ? (
        lessons.map((l, i) => (
          <Tooltip key={l.key} title={`${i + 1}. ${t(l.title)}`} arrow>
            <Box
              component={RouterLink}
              href={paths.lesson(slug, l.key)}
              aria-label={`${i + 1}. ${t(l.title)}`}
              aria-current={i === index ? 'step' : undefined}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                transition: 'background-color 0.2s, transform 0.2s',
                bgcolor: i <= index ? color : (theme) => theme.vars.palette.action.selected,
                opacity: i < index ? 0.45 : 1,
                '&:hover': { transform: 'scaleY(1.6)' },
              }}
            />
          </Tooltip>
        ))
      ) : (
        <Box
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            bgcolor: 'action.selected',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{ width: `${((index + 1) / lessons.length) * 100}%`, height: 1, bgcolor: color }}
          />
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

/** Sticky footer: previous lesson · test yourself · next lesson. */
function LessonNav({ slug, lesson, prev, next, color }) {
  const { s, t } = useLang();

  const stepButton = (target, dir) => {
    const label = dir === 'prev' ? s.prevLesson : s.nextLesson;
    const icon = dir === 'prev' ? 'solar:arrow-left-linear' : 'solar:arrow-right-linear';
    if (!target) return <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />;
    return (
      <Button
        component={RouterLink}
        href={paths.lesson(slug, target.key)}
        color="inherit"
        variant="outlined"
        aria-label={`${label}: ${t(target.title)}`}
        sx={{
          flex: { xs: '0 0 auto', md: 1 },
          minWidth: { xs: 52, md: 0 },
          px: { xs: 0, md: 2 },
          py: 1.25,
          justifyContent: { md: dir === 'prev' ? 'flex-start' : 'flex-end' },
          textAlign: dir === 'prev' ? 'left' : 'right',
          gap: 1.5,
          flexDirection: dir === 'prev' ? 'row' : 'row-reverse',
        }}
      >
        <Iconify icon={icon} width={22} sx={{ flexShrink: 0 }} />
        <Box sx={{ minWidth: 0, display: { xs: 'none', md: 'block' } }}>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {label}
          </Typography>
          <Typography variant="subtitle2" noWrap>
            {t(target.title)}
          </Typography>
        </Box>
      </Button>
    );
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        mx: { xs: -2, sm: -3 },
        px: { xs: 2, sm: 3 },
        py: 1.5,
        mb: { xs: -3, md: -5 },
        borderTop: (theme) => `1px solid ${theme.vars.palette.divider}`,
        backdropFilter: 'blur(10px)',
        bgcolor: (theme) => `rgba(${theme.vars.palette.background.defaultChannel} / 0.86)`,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="stretch">
        {stepButton(prev, 'prev')}
        <Button
          size="large"
          variant="contained"
          component={RouterLink}
          href={paths.quiz(slug, lesson.key)}
          startIcon={<Iconify icon="solar:play-bold" />}
          sx={{
            flex: { xs: 1, md: '0 0 auto' },
            px: 4,
            fontSize: 16,
            whiteSpace: 'nowrap',
            bgcolor: color,
            color: 'common.white',
            '&:hover': { bgcolor: color, filter: 'brightness(0.92)' },
          }}
        >
          {s.testYourself}
          {lesson.questionCount > 0 && ` (${lesson.questionCount})`}
        </Button>
        {stepButton(next, 'next')}
      </Stack>
    </Box>
  );
}

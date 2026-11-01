'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useLang } from 'src/locales';
import { useTopic } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { SmartIcon, BackButton, ErrorState, LoadingState } from 'src/components/state-views';

import { hexToChannel } from '../home/home-view';
import { VISUAL_ICONS } from '../visuals/visual-renderer';
import { cosmicSx, Starfield } from '../visuals/starfield';

// ----------------------------------------------------------------------

export function TopicView({ slug }) {
  const { s, t } = useLang();
  const { topic, lessons, topicLoading, topicError, retry } = useTopic(slug);

  if (topicLoading && !topic) return <LoadingState />;
  if (topicError || !topic) return <ErrorState onRetry={retry} />;

  const channel = hexToChannel(topic.color);
  const familyLesson = lessons.find((l) => l.visual?.kind === 'family');
  const cosmic = topic.effect === 'stars';
  const muted = cosmic ? 'rgba(255,255,255,0.75)' : 'text.secondary';

  return (
    <>
      <BackButton href={paths.home} label={s.home} />

      <Card
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          background: `linear-gradient(135deg, ${varAlpha(channel, 0.16)}, ${varAlpha(channel, 0.04)})`,
          ...(cosmic && cosmicSx(topic.color)),
          '& > *:not(canvas)': { position: 'relative' },
        }}
      >
        {cosmic && <Starfield density={1.4} />}
        <Box
          sx={{
            color: topic.color,
            display: 'flex',
            filter: cosmic ? `drop-shadow(0 0 18px ${topic.color})` : undefined,
          }}
        >
          <SmartIcon icon={topic.icon} size={72} />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>
            {t(topic.title)}
          </Typography>
          <Typography sx={{ maxWidth: 640, color: muted }}>{t(topic.description)}</Typography>
        </Box>
        <Stack spacing={0.75} alignItems={{ xs: 'stretch', md: 'center' }}>
          <Button
            size="large"
            variant="contained"
            color="primary"
            component={RouterLink}
            href={paths.quiz(slug)}
            startIcon={<Iconify icon="solar:play-bold" />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: 17,
              bgcolor: topic.color,
              '&:hover': { bgcolor: topic.color, filter: 'brightness(0.92)' },
            }}
          >
            {s.quickQuiz}
          </Button>
          <Typography variant="caption" textAlign="center" sx={{ color: muted }}>
            {s.quickQuizHint}
          </Typography>
          {familyLesson && (
            <Button
              size="large"
              variant="outlined"
              component={RouterLink}
              href={paths.lesson(slug, familyLesson.key)}
              startIcon={<Iconify icon="solar:users-group-two-rounded-bold-duotone" />}
              sx={{ mt: 1, borderColor: topic.color, color: topic.color }}
            >
              {s.familyTree}
            </Button>
          )}
        </Stack>
      </Card>

      <Typography variant="h5" sx={{ mb: 0.5 }}>
        {s.lessonList}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {s.learnFirst}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        }}
      >
        {lessons.map((lesson, index) => (
          <Card key={lesson.key} sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardActionArea
              component={RouterLink}
              href={paths.lesson(slug, lesson.key)}
              sx={{ p: 3, flexGrow: 1 }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    color: topic.color,
                    bgcolor: varAlpha(channel, 0.14),
                  }}
                >
                  {index + 1}
                </Box>
                <Iconify
                  icon={VISUAL_ICONS[lesson.visual?.kind]}
                  width={22}
                  sx={{ color: 'text.disabled', ml: 'auto !important' }}
                />
              </Stack>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {t(lesson.title)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(lesson.summary)}
              </Typography>
            </CardActionArea>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3, pb: 2.5 }}>
              <Chip
                size="small"
                variant="outlined"
                label={`${lesson.questionCount} ${s.questions}`}
              />
              <Button
                size="small"
                component={RouterLink}
                href={paths.quiz(slug, lesson.key)}
                startIcon={<Iconify icon="solar:play-circle-bold" />}
                sx={{ ml: 'auto !important', color: topic.color }}
              >
                {s.testYourself}
              </Button>
            </Stack>
          </Card>
        ))}
      </Box>
    </>
  );
}

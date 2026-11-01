'use client';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTopic } from 'src/actions/quiz';

import { ErrorState } from 'src/components/state-views';

import { QuizReader } from './quiz-reader';

// ----------------------------------------------------------------------

/** /[topic]/quiz?lesson= — loads the topic's lessons, then opens the full-screen reader. */
export function QuizScreen({ slug, lessonKey }) {
  const router = useRouter();
  const { topic, lessons, topicError, retry } = useTopic(slug);

  // ✕ / Esc: back to the lesson that was open (it may have changed by swiping), or the topic.
  const close = useCallback(
    (current) => router.push(current ? paths.lesson(slug, current) : paths.topic(slug)),
    [router, slug]
  );

  if (topicError) return <ErrorState onRetry={retry} />;
  if (!topic) {
    return (
      <Box
        sx={{
          inset: 0,
          zIndex: 1300,
          position: 'fixed',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'common.black',
        }}
      >
        <CircularProgress sx={{ color: 'common.white' }} />
      </Box>
    );
  }

  return (
    <QuizReader slug={slug} topic={topic} lessons={lessons} lessonKey={lessonKey} onClose={close} />
  );
}

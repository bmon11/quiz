'use client';

import { m, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';

import { preloadDeck } from 'src/actions/quiz';

import { QuizStory } from './quiz-story';

// ----------------------------------------------------------------------
// Full-screen quiz reader, the same pattern as sedev's TopicReader: the
// lessons of a topic are read one at a time as swipeable quiz stories. A bar
// per lesson at the top; swipe up / down (↑ ↓, or swiping past a story's last /
// first slide) opens the next / previous lesson's quiz; ✕ or Esc closes.
// The quick quiz (no lesson) is a single story with nothing above or below.

/** The next lesson rises from below, the previous one drops from above. */
const slide = {
  enter: (direction) => ({ y: direction > 0 ? '100%' : '-100%' }),
  center: { y: 0 },
  exit: (direction) => ({ y: direction > 0 ? '-30%' : '30%', opacity: 0 }),
};

/**
 * `lessons`: the topic's lessons (order), `lessonKey`: the one to open (null = quick quiz).
 */
export function QuizReader({ slug, topic, lessons, lessonKey, onClose }) {
  // Fixed once the reader opens: swiping changes `index`, never the list.
  const decks = useMemo(
    () => (lessonKey ? lessons.map((l) => l.key) : [null]),
    [lessonKey, lessons]
  );
  const [index, setIndex] = useState(() => Math.max(0, decks.indexOf(lessonKey)));
  const [direction, setDirection] = useState(1);
  const current = decks[index];

  const goTo = useCallback(
    (target) => {
      if (target < 0 || target >= decks.length || target === index) return;
      setDirection(target > index ? 1 : -1);
      setIndex(target);
      // Keep the URL on the open lesson without remounting the page.
      window.history.replaceState(null, '', paths.quiz(slug, decks[target]));
    },
    [decks, index, slug]
  );

  // The lessons either side are fetched ahead, so the next quiz opens with its questions.
  useEffect(() => {
    [decks[index + 1], decks[index - 1]].forEach((key) => key && preloadDeck(slug, key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, index]);

  // Page behind stays still; Esc closes, ↑ ↓ change lesson.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.target.closest?.('input, textarea')) return;
      if (event.key === 'Escape') onClose(current);
      else if (event.key === 'ArrowDown') goTo(index + 1);
      else if (event.key === 'ArrowUp') goTo(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, goTo, index, current]);

  return (
    <Box
      component={m.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      sx={{
        inset: 0,
        zIndex: 1300,
        position: 'fixed',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        bgcolor: 'common.black',
      }}
    >
      {decks.length > 1 && (
        <Box
          sx={{
            px: 1.5,
            gap: 0.5,
            zIndex: 3,
            top: 'calc(6px + env(safe-area-inset-top))',
            left: '50%',
            width: 1,
            maxWidth: { xs: 1, md: 'calc(100dvh * 9 / 16)' },
            display: 'flex',
            position: 'absolute',
            pointerEvents: 'none',
            transform: 'translateX(-50%)',
          }}
        >
          {decks.map((key, i) => (
            <Box
              key={key}
              sx={{ flex: 1, height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.32)' }}
            >
              <Box
                sx={{ height: 1, borderRadius: 2, bgcolor: 'common.white' }}
                style={{ width: i <= index ? '100%' : 0 }}
              />
            </Box>
          ))}
        </Box>
      )}

      <AnimatePresence initial={false} custom={direction}>
        <Box
          key={current ?? 'quick'}
          component={m.div}
          custom={direction}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          sx={{ inset: 0, position: 'absolute', bgcolor: 'common.black' }}
        >
          <QuizStory
            slug={slug}
            topic={topic}
            lessonKey={current}
            lessonTitle={lessons.find((l) => l.key === current)?.title}
            onClose={() => onClose(current)}
            onEdge={(step) => goTo(index + step)}
          />
        </Box>
      </AnimatePresence>
    </Box>
  );
}

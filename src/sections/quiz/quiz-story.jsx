'use client';

import { m, AnimatePresence, useAnimationControls } from 'framer-motion';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useLang } from 'src/locales';
import { useDeck, submitAnswer, submitAttempt } from 'src/actions/quiz';

import { useTap } from 'src/components/use-tap';
import { Iconify } from 'src/components/iconify';
import { SmartIcon } from 'src/components/state-views';

import { ResultSlide } from './result-slide';
import { QuestionSlide } from './question-slide';

// ----------------------------------------------------------------------
// One lesson's quiz as a full-screen story, switched like sedev's reader
// (KeyPointCards `screen` mode): a bar per slide at the top, tap the right side
// or swipe left for the next slide, the left side or swipe right for the
// previous one, swipe up / down for the next / previous lesson. Nothing moves
// by itself. One quiz rule on top: you can't move past a question you haven't
// answered — the card nudges and says so. The last slide is the result.

/** A press shorter than this is a tap (move); longer is ignored. */
const TAP_MS = 250;
/** Drag distance that counts as a swipe. */
const SWIPE_PX = 50;

/** Darkens the header and the bottom like sedev's full-bleed slides. */
const SHADE =
  'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)';

export function QuizStory({ slug, topic, lessonKey, lessonTitle, onClose, onEdge }) {
  const { s, t } = useLang();
  const { deck, deckError, reloadDeck } = useDeck(slug, lessonKey);
  const color = deck?.topic?.color ?? topic?.color ?? '#5B54E8';

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({}); // questionId → { choice, correct, answer, explanation, correctRate }
  const [pending, setPending] = useState(null); // questionId being checked
  const [nudge, setNudge] = useState(0); // bumps to shake the card + show "answer first"
  const [hint, setHint] = useState(false);
  const [scrollable, setScrollable] = useState(false);
  const shake = useAnimationControls();
  const resizeObserver = useRef(null);
  const [result, setResult] = useState(null);
  const startedAt = useRef(Date.now());
  const press = useRef(null);
  const edgeRef = useRef(onEdge);
  edgeRef.current = onEdge;

  const questions = useMemo(() => deck?.questions ?? [], [deck]);
  const count = questions.length + 1; // + result slide
  const onResult = questions.length > 0 && index === questions.length;
  const question = questions[index];
  const answeredAll = questions.length > 0 && questions.every((q) => answers[q.id]);

  const goTo = useCallback(
    (target) => {
      if (target < 0) {
        edgeRef.current?.(-1);
        return;
      }
      if (target >= count) {
        edgeRef.current?.(1);
        return;
      }
      // Forward only over answered questions.
      const blocker = questions.slice(0, target).find((q) => !answers[q.id]);
      if (target > index && blocker) {
        setNudge((n) => n + 1);
        return;
      }
      setDirection(target > index ? 1 : -1);
      setIndex(target);
    },
    [count, questions, answers, index]
  );

  const choose = useCallback(
    async (choice) => {
      if (!question || answers[question.id] || pending) return;
      setPending(question.id);
      try {
        const reply = await submitAnswer(question.id, choice);
        setAnswers((prev) => ({ ...prev, [question.id]: { choice, ...reply } }));
      } catch {
        setNudge((n) => n + 1);
      } finally {
        setPending(null);
      }
    },
    [question, answers, pending]
  );

  // A blocked move shakes the card and shows "answer first" for a moment.
  useEffect(() => {
    if (!nudge) return undefined;
    shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.35 } });
    setHint(true);
    const timer = setTimeout(() => setHint(false), 1600);
    return () => clearTimeout(timer);
  }, [nudge, shake]);

  // Only a slide taller than the card scrolls (and then owns vertical drags);
  // otherwise up / down stays a swipe to the next / previous lesson.
  const measureRef = useCallback((node) => {
    resizeObserver.current?.disconnect();
    if (!node) return;
    const box = node.parentElement;
    const check = () => setScrollable(node.offsetHeight > box.clientHeight + 2);
    resizeObserver.current = new ResizeObserver(check);
    resizeObserver.current.observe(node);
    resizeObserver.current.observe(box);
    check();
  }, []);
  useEffect(() => () => resizeObserver.current?.disconnect(), []);

  // The attempt is saved once, the first time the result slide opens.
  useEffect(() => {
    if (!onResult || !answeredAll || result) return;
    const list = questions.map((q) => ({ questionId: q.id, choice: answers[q.id].choice }));
    const score = questions.filter((q) => answers[q.id].correct).length;
    submitAttempt({
      topicSlug: slug,
      lessonKey,
      durationMs: Date.now() - startedAt.current,
      answers: list,
    })
      .then(setResult)
      .catch(() =>
        setResult({
          score,
          total: questions.length,
          percent: Math.round((score / questions.length) * 100),
          betterThan: null,
        })
      );
  }, [onResult, answeredAll, result, questions, answers, slug, lessonKey]);

  const restart = async () => {
    await reloadDeck();
    setAnswers({});
    setResult(null);
    setDirection(-1);
    setIndex(0);
    startedAt.current = Date.now();
  };

  // ← → move between slides, 1–4 answer, Enter goes on once answered.
  useEffect(() => {
    const onKey = (event) => {
      // Typing, or a dialog on top (e.g. «report a problem»), keeps the keys.
      if (event.target.closest?.('input, textarea, .MuiModal-root')) return;
      if (event.key === 'ArrowRight') goTo(index + 1);
      else if (event.key === 'ArrowLeft') goTo(index - 1);
      else if (event.key === 'Enter' && (!question || answers[question.id])) goTo(index + 1);
      else if (question && '1234'.includes(event.key)) {
        const n = Number(event.key) - 1;
        if (n < question.choices.length) choose(n);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, index, question, answers, choose]);

  // Read in the capture phase, so a swipe that starts or ends on a button (the
  // answers sit low, where a thumb swiping down lands) still counts. A short tap
  // on a button belongs to the button and never moves the story.
  const onPointerDown = (event) => {
    // A dialog over the story is portalled, but React still bubbles its events here.
    if (event.target.closest?.('.MuiModal-root')) {
      press.current = null;
      return;
    }
    const control = !!event.target.closest?.('button, a, [role="radio"]');
    press.current = { x: event.clientX, y: event.clientY, at: Date.now(), control };
  };

  const onPointerUp = (event) => {
    const start = press.current;
    press.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dy) > SWIPE_PX && Math.abs(dy) > Math.abs(dx)) {
      // A long slide scrolls inside the card; then a vertical drag is that scroll.
      if (!scrollable) edgeRef.current?.(dy < 0 ? 1 : -1);
    } else if (Math.abs(dx) > SWIPE_PX) goTo(index + (dx < 0 ? 1 : -1));
    else if (!start.control && Date.now() - start.at < TAP_MS && Math.abs(dy) < 10) {
      const { left, width } = event.currentTarget.getBoundingClientRect();
      goTo(index + (event.clientX - left < width / 3 ? -1 : 1));
    }
  };

  const closeTap = useTap(onClose);

  // Known before the deck arrives, so the header never flashes "Quick quiz" for a lesson.
  const title = lessonKey ? t(deck?.lesson?.title ?? lessonTitle) : s.quickQuizTitle;

  return (
    <Box
      sx={{
        height: 1,
        display: 'flex',
        overflow: 'hidden',
        touchAction: 'none',
        justifyContent: 'center',
      }}
    >
      <Box
        component={m.section}
        aria-label={title}
        aria-roledescription="carousel"
        onPointerDownCapture={onPointerDown}
        onPointerUpCapture={onPointerUp}
        onPointerCancel={() => {
          press.current = null;
        }}
        animate={shake}
        sx={{
          display: 'flex',
          cursor: 'pointer',
          overflow: 'hidden',
          userSelect: 'none',
          position: 'relative',
          flexDirection: 'column',
          color: 'common.white',
          touchAction: 'none',
          height: 1,
          width: { xs: 1, md: 'auto' },
          maxWidth: 1,
          aspectRatio: { md: '9 / 16' },
          WebkitTapHighlightColor: 'transparent',
          // Full-bleed: the topic colour glowing on near-black instead of sedev's photos.
          background: `radial-gradient(120% 70% at 20% 0%, ${color}cc 0%, ${color}33 45%, transparent 75%), radial-gradient(90% 60% at 100% 100%, ${color}55 0%, transparent 70%), #0b0f14`,
        }}
      >
        <Box sx={{ inset: 0, position: 'absolute', background: SHADE, pointerEvents: 'none' }} />

        {/* Header: chip, place, ✕, title — above the slide bars, white on the slide. */}
        <Box sx={{ zIndex: 2, position: 'relative', pt: 'calc(18px + env(safe-area-inset-top))' }}>
          <Box sx={{ px: 1.5, gap: 1, display: 'flex', alignItems: 'center' }}>
            <Box
              component="span"
              sx={{
                px: 1.25,
                py: 0.5,
                gap: 0.75,
                minWidth: 0,
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 1,
                typography: 'caption',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                bgcolor: color,
              }}
            >
              <SmartIcon icon={deck?.topic?.icon ?? topic?.icon} size={16} />
              {t(deck?.topic?.title ?? topic?.title)}
            </Box>
            {deck?.lesson && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {(slug === 'tournament' ? s.gameOf : s.lessonOf)(
                  deck.lesson.order,
                  deck.lesson.total
                )}
              </Typography>
            )}
            <Box sx={{ flex: 1 }} />
            <IconButton aria-label={s.close} {...closeTap} sx={{ color: 'common.white' }}>
              <Iconify icon="mingcute:close-line" width={24} />
            </IconButton>
          </Box>
          <Typography
            component="h1"
            sx={{
              px: 2,
              mt: 1,
              fontWeight: 700,
              lineHeight: 1.25,
              fontSize: { xs: '1.15rem', md: '1.3rem' },
              textShadow: '0 1px 8px rgba(0,0,0,0.4)',
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* One bar per slide; answered ones show right / wrong. */}
        {questions.length > 0 && (
          <Box sx={{ px: 2, pt: 1.5, pb: 0.5, zIndex: 2 }}>
            <Box sx={{ gap: 0.5, display: 'flex' }}>
              {[...questions, null].map((q, i) => {
                const a = q && answers[q.id];
                const bg = a
                  ? a.correct
                    ? '#22C55E'
                    : '#FF5630'
                  : i <= index
                    ? 'common.white'
                    : 'transparent';
                return (
                  <Box
                    key={q?.id ?? 'result'}
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: 'rgba(255,255,255,0.28)',
                    }}
                  >
                    <Box sx={{ height: 1, bgcolor: bg, transition: 'background-color 200ms' }} />
                  </Box>
                );
              })}
            </Box>
            <Typography variant="overline" sx={{ display: 'block', mt: 0.75, color: 'grey.300' }}>
              {onResult ? s.results : `${s.question} ${index + 1} ${s.of} ${questions.length}`}
            </Typography>
          </Box>
        )}

        {/* ‹ › for a mouse (laptop); phones tap or swipe. */}
        {[
          {
            step: -1,
            label: s.prevSlide,
            icon: 'eva:arrow-ios-back-fill',
            side: 'left',
            show: index > 0,
          },
          {
            step: 1,
            label: s.nextSlide,
            icon: 'eva:arrow-ios-forward-fill',
            side: 'right',
            show: index < count - 1,
          },
        ].map(
          (arrow) =>
            arrow.show && (
              <IconButton
                key={arrow.side}
                aria-label={arrow.label}
                onClick={() => goTo(index + arrow.step)}

                sx={{
                  top: '50%',
                  zIndex: 3,
                  position: 'absolute',
                  [arrow.side]: 8,
                  display: 'none',
                  color: 'common.white',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  backdropFilter: 'blur(6px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                  '@media (hover: hover) and (pointer: fine)': { display: 'inline-flex' },
                }}
              >
                <Iconify icon={arrow.icon} width={20} />
              </IconButton>
            )
        )}

        {/* "Answer first" — shown briefly after a blocked swipe. */}
        <AnimatePresence>
          {hint && question && !answers[question.id] && (
            <Box
              key="hint"
              component={m.div}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              sx={{
                zIndex: 4,
                position: 'absolute',
                top: '34%',
                left: '50%',
                transform: 'translateX(-50%)',
                px: 2,
                py: 1,
                borderRadius: 5,
                typography: 'subtitle2',
                whiteSpace: 'nowrap',
                color: '#1C252E',
                bgcolor: '#FFD666',
                pointerEvents: 'none',
              }}
            >
              👆 {s.answerFirst}
            </Box>
          )}
        </AnimatePresence>

        {!deck && !deckError && (
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', zIndex: 2 }}>
            <CircularProgress sx={{ color: 'common.white' }} />
          </Box>
        )}
        {deckError && (
          <Box
            sx={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              zIndex: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Box>
              <Typography sx={{ mb: 2 }}>{s.loadError}</Typography>
              <IconButton
                onClick={() => reloadDeck()}
                sx={{ color: 'common.white', border: '1px solid' }}
              >
                <Iconify icon="solar:restart-bold" />
              </IconButton>
            </Box>
          </Box>
        )}

        {deck && (
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <Box
              key={onResult ? 'result' : question?.id}
              component={m.div}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              sx={{
                flex: 1,
                minHeight: 0,
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                touchAction: scrollable ? 'pan-y' : 'none',
                overscrollBehavior: 'contain',
                scrollbarWidth: 'none',
              }}
            >
              <Box
                ref={measureRef}
                sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column' }}
              >
                {onResult ? (
                  <ResultSlide
                    result={result}
                    slug={slug}
                    lessonKey={lessonKey}
                    color={color}
                    next={deck.next}
                    durationMs={Date.now() - startedAt.current}
                    onRestart={restart}
                    onNext={() => edgeRef.current?.(1)}
                    onClose={onClose}
                  />
                ) : (
                  question && (
                    <QuestionSlide
                      question={question}
                      reply={answers[question.id]}
                      checking={pending === question.id}
                      family={deck.family}
                      color={color}
                      isLast={index === questions.length - 1}
                      onChoose={choose}
                      onNext={() => goTo(index + 1)}
                    />
                  )
                )}
              </Box>
            </Box>
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
}

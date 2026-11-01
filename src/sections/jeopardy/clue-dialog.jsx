'use client';

import { m } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useLang } from 'src/locales';
import { checkJeopardy } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';

import { ReportDialog } from '../quiz/report-dialog';
import { QuestionMap } from '../visuals/map/question-map';
import { JEOPARDY_BLUE, JEOPARDY_GOLD } from './jeopardy-board';

// ----------------------------------------------------------------------

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const GREEN = '#22C55E';
const RED = '#FF5630';

/**
 * One clue. Phases: wager (Daily Double only) → buzz (who answers; skipped
 * when solo) → answer → done. A wrong answer costs the clue's value and, with
 * other players left, goes back to buzz without revealing the right choice.
 */
export function ClueDialog({ column, clue, dailyDouble, players, control, onDone }) {
  const { s, t } = useLang();
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const solo = players.length === 1;
  const question = clue.question;

  const [phase, setPhase] = useState(dailyDouble ? 'wager' : solo ? 'answer' : 'buzz');
  const [answering, setAnswering] = useState(dailyDouble || solo ? (solo ? 0 : control) : null);
  const [wager, setWager] = useState(clue.value);
  const [tried, setTried] = useState([]);
  const [wrong, setWrong] = useState([]);
  const [deltas, setDeltas] = useState(() => players.map(() => 0));
  const [reveal, setReveal] = useState(null); // { answer, explanation, correct }
  const [winner, setWinner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);

  const value = dailyDouble ? wager : clue.value;
  const maxWager = Math.max(players[answering ?? control]?.score ?? 0, 1000);
  const left = players.map((_, i) => i).filter((i) => !tried.includes(i));

  const showAnswer = useCallback(async () => {
    setBusy(true);
    try {
      setReveal(await checkJeopardy({ questionId: question.id }));
      setPhase('done');
    } finally {
      setBusy(false);
    }
  }, [question.id]);

  const pick = useCallback(
    async (choice) => {
      if (phase !== 'answer' || busy || wrong.includes(choice)) return;
      setBusy(true);
      try {
        const res = await checkJeopardy({
          questionId: question.id,
          choice,
          first: !tried.length && !wrong.length,
        });
        const sign = res.correct ? 1 : -1;
        setDeltas((d) => d.map((x, i) => (i === answering ? x + sign * value : x)));
        if (res.correct) {
          setWinner(answering);
          setReveal(res);
          setPhase('done');
          return;
        }
        const nextTried = [...tried, answering];
        const nextWrong = [...wrong, choice];
        setTried(nextTried);
        setWrong(nextWrong);
        const others = players.length - nextTried.length;
        const choicesLeft = question.choices.length - nextWrong.length;
        if (dailyDouble || solo || others === 0 || choicesLeft <= 1) {
          setReveal(await checkJeopardy({ questionId: question.id }));
          setPhase('done');
        } else {
          setAnswering(null);
          setPhase('buzz');
        }
      } finally {
        setBusy(false);
      }
    },
    [phase, busy, wrong, tried, answering, value, question, players.length, dailyDouble, solo]
  );

  const close = useCallback(
    () => onDone({ deltas, control: winner ?? undefined }),
    [onDone, deltas, winner]
  );

  // 1–4 answer, Enter goes back to the board once done.
  useEffect(() => {
    const onKey = (event) => {
      if (reporting || event.target.closest?.('input, textarea')) return;
      if (phase === 'answer' && '123456'.includes(event.key)) {
        const n = Number(event.key) - 1;
        if (n < question.choices.length) pick(n);
      } else if (phase === 'done' && event.key === 'Enter') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, pick, close, question.choices.length, reporting]);

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            color: 'common.white',
            background: `radial-gradient(120% 100% at 50% 0%, #2333FF 0%, ${JEOPARDY_BLUE} 60%, #040A8C 100%)`,
          },
        },
      }}
    >
      <Box
        sx={{
          p: { xs: 2.5, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          minHeight: { md: 520 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Typography
            sx={{
              flex: 1,
              fontWeight: 800,
              textTransform: 'uppercase',
              opacity: 0.85,
              fontSize: 14,
            }}
            noWrap
          >
            {t(column.title)}
          </Typography>
          <Typography
            sx={{
              color: JEOPARDY_GOLD,
              fontWeight: 900,
              fontSize: 26,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {dailyDouble ? s.dailyDouble : clue.value}
          </Typography>
        </Stack>

        {phase === 'wager' ? (
          <Stack
            component={m.div}
            initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            alignItems="center"
            spacing={2.5}
            sx={{ flex: 1, justifyContent: 'center', textAlign: 'center', py: 4 }}
          >
            <Typography
              sx={{
                color: JEOPARDY_GOLD,
                fontWeight: 900,
                fontSize: { xs: 40, md: 64 },
                textShadow: '0 4px 0 rgba(0,0,0,0.5)',
                lineHeight: 1,
              }}
            >
              {s.dailyDouble}!
            </Typography>
            <Typography>{s.wagerPrompt(players[control].name, maxWager)}</Typography>
            <TextField
              type="number"
              value={wager}
              onChange={(e) =>
                setWager(Math.max(0, Math.min(maxWager, Number(e.target.value) || 0)))
              }
              slotProps={{ htmlInput: { min: 5, max: maxWager, step: 100 } }}
              sx={{
                width: 180,
                '& input': {
                  color: 'common.white',
                  fontSize: 28,
                  fontWeight: 800,
                  textAlign: 'center',
                },
                '& fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
              }}
            />
            <Stack direction="row" spacing={1}>
              {[clue.value, Math.round(maxWager / 2 / 100) * 100 || 100, maxWager].map((v, i) => (
                <Button
                  key={i}
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => setWager(v)}
                >
                  {i === 2 ? s.allIn : v}
                </Button>
              ))}
            </Stack>
            <Button
              size="large"
              variant="contained"
              disabled={wager < 5}
              onClick={() => setPhase('answer')}
              sx={{ bgcolor: JEOPARDY_GOLD, color: '#1C252E', '&:hover': { bgcolor: '#FFD633' } }}
            >
              {s.showClue}
            </Button>
          </Stack>
        ) : (
          <>
            <Typography
              component="h2"
              sx={{
                fontWeight: 800,
                lineHeight: 1.3,
                fontSize: { xs: '1.45rem', md: '2rem' },
                textAlign: 'center',
                textShadow: '0 2px 0 rgba(0,0,0,0.4)',
                my: { xs: 2, md: 4 },
              }}
            >
              {t(question.prompt)}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <QuestionMap
                map={reveal?.map ?? question.map}
                answer={reveal ? (reveal.map?.answer ?? []) : undefined}
                color={JEOPARDY_GOLD}
                maxHeight={question.map?.locate && !reveal ? 340 : 240}
              />
            </Box>

            <Box sx={{ flex: 1 }} />

            {phase === 'buzz' && (
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography sx={{ mb: 1.25, opacity: 0.9 }}>
                  {tried.length ? s.stealPrompt : s.buzzPrompt}
                </Typography>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  useFlexGap
                  spacing={1}
                  justifyContent="center"
                >
                  {left.map((i) => (
                    <Button
                      key={i}
                      size="large"
                      variant="contained"
                      onClick={() => {
                        setAnswering(i);
                        setPhase('answer');
                      }}
                      sx={{
                        bgcolor: JEOPARDY_GOLD,
                        color: '#1C252E',
                        '&:hover': { bgcolor: '#FFD633' },
                      }}
                    >
                      {players[i].name}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}
            {phase === 'answer' && !solo && (
              <Typography
                sx={{ mb: 1.25, textAlign: 'center', color: JEOPARDY_GOLD, fontWeight: 700 }}
              >
                {s.nowAnswering(players[answering].name, value)}
              </Typography>
            )}

            <Box
              sx={{
                display: 'grid',
                gap: 1.25,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                opacity: phase === 'buzz' ? 0.55 : 1,
              }}
            >
              {question.choices.map((choice, i) => {
                const state =
                  reveal && i === reveal.answer ? 'right' : wrong.includes(i) ? 'wrong' : 'idle';
                return (
                  <ButtonBase
                    key={i}
                    disabled={phase !== 'answer' || busy || state === 'wrong'}
                    onClick={() => pick(i)}
                    sx={{
                      minHeight: 58,
                      px: 1.5,
                      py: 1.25,
                      gap: 1.5,
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      borderRadius: 2,
                      color: 'common.white',
                      border: `2px solid ${state === 'right' ? GREEN : state === 'wrong' ? RED : 'rgba(255,255,255,0.4)'}`,
                      bgcolor:
                        state === 'right'
                          ? 'rgba(34,197,94,0.3)'
                          : state === 'wrong'
                            ? 'rgba(255,86,48,0.2)'
                            : 'rgba(255,255,255,0.08)',
                      textDecoration: state === 'wrong' ? 'line-through' : 'none',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                      '&.Mui-focusVisible': { outline: '3px solid #fff' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: 1,
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        bgcolor: 'rgba(255,255,255,0.18)',
                      }}
                    >
                      {state === 'right' ? (
                        <Iconify icon="eva:checkmark-fill" />
                      ) : state === 'wrong' ? (
                        <Iconify icon="eva:close-fill" />
                      ) : busy && phase === 'answer' ? (
                        <Iconify icon="svg-spinners:3-dots-fade" />
                      ) : (
                        LETTERS[i]
                      )}
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{t(choice)}</Typography>
                  </ButtonBase>
                );
              })}
            </Box>

            {phase === 'done' && reveal && (
              <Box
                component={m.div}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{ mt: 2.5 }}
              >
                <Typography variant="h6" sx={{ color: winner !== null ? GREEN : '#FFD666' }}>
                  {winner !== null
                    ? solo
                      ? `${s.correct} +${value}`
                      : s.playerGotIt(players[winner].name, value)
                    : solo && deltas[0] < 0
                      ? `${s.wrong} ${deltas[0]}`
                      : s.nobodyGotIt}
                </Typography>
                {t(reveal.explanation) && (
                  <Typography sx={{ mt: 0.5, color: 'grey.100' }}>
                    {t(reveal.explanation)}
                  </Typography>
                )}
                {deltas.some((d) => d < 0) && (
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 0.75, color: '#FF8A80' }}
                  >
                    {deltas
                      .map((d, i) => (d < 0 ? `${players[i].name} ${d}` : null))
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                )}
              </Box>
            )}

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2.5 }}>
              {phase === 'done' ? (
                <>
                  <Button
                    size="small"
                    onClick={() => setReporting(true)}
                    startIcon={<Iconify icon="solar:flag-linear" width={16} />}
                    sx={{ color: 'grey.300', whiteSpace: 'nowrap' }}
                  >
                    {s.reportProblem}
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    size="large"
                    variant="contained"
                    onClick={close}
                    endIcon={<Iconify icon="solar:widget-4-bold" />}
                    sx={{
                      whiteSpace: 'nowrap',
                      bgcolor: JEOPARDY_GOLD,
                      color: '#1C252E',
                      '&:hover': { bgcolor: '#FFD633' },
                    }}
                  >
                    {s.backToBoard}
                  </Button>
                </>
              ) : (
                <>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    color="inherit"
                    disabled={busy}
                    onClick={showAnswer}
                    sx={{ opacity: 0.85 }}
                  >
                    {solo || dailyDouble ? s.skipShowAnswer : s.nobodyKnows}
                  </Button>
                </>
              )}
            </Stack>
          </>
        )}
      </Box>
      <ReportDialog open={reporting} question={question} onClose={() => setReporting(false)} />
    </Dialog>
  );
}

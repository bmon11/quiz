'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { useLang } from 'src/locales';
import { useTopics, fetchJeopardyBoard } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { SmartIcon } from 'src/components/state-views';

import { ClueDialog } from './clue-dialog';
import { Scoreboard, JeopardyBoard, JEOPARDY_BLUE, JEOPARDY_GOLD } from './jeopardy-board';

// ----------------------------------------------------------------------
// Jeopardy: one screen (a laptop or TV) the players share. Solo plays against
// the board; with 2+ players the host taps who buzzed in, that player answers,
// and a miss lets the others steal. The game lives in the browser and is kept
// in localStorage, so a refresh mid-game can be resumed.

const SAVE_KEY = 'trivia-jeopardy';
const MAX_PLAYERS = 6;

const load = () => {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const save = (game) => {
  try {
    if (game) window.localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    else window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // private mode — no resume, the game still plays
  }
};

export function JeopardyView() {
  const { s } = useLang();
  const [game, setGame] = useState(null);
  const [saved, setSaved] = useState(null);
  const [open, setOpen] = useState(null); // { col, row }

  useEffect(() => {
    const previous = load();
    if (previous?.board && previous.used?.length < previous.board.columns.length * 5)
      setSaved(previous);
  }, []);
  useEffect(() => {
    if (game) save(game);
  }, [game]);

  const start = (setup, board) => {
    setSaved(null);
    setGame({
      setup,
      board,
      players: setup.players.map((name) => ({ name, score: 0 })),
      control: 0,
      used: [],
    });
  };

  const finishClue = useCallback(
    ({ deltas, control }) => {
      setGame((g) => ({
        ...g,
        players: g.players.map((p, i) => ({ ...p, score: p.score + (deltas[i] ?? 0) })),
        control: control ?? g.control,
        used: [...g.used, `${open.col}-${open.row}`],
      }));
      setOpen(null);
    },
    [open]
  );

  if (!game) {
    return (
      <Setup
        saved={saved}
        onResume={() => {
          setGame(saved);
          setSaved(null);
        }}
        onStart={start}
      />
    );
  }

  const total = game.board.columns.reduce((n, c) => n + c.clues.length, 0);
  const over = game.used.length >= total;

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ flex: 1 }}>
          {s.jeopardy}
        </Typography>
        {!over && (
          <Button
            color="inherit"
            startIcon={<Iconify icon="solar:flag-2-bold-duotone" />}
            onClick={() => setGame((g) => ({ ...g, used: allCells(g.board) }))}
          >
            {s.endGame}
          </Button>
        )}
      </Stack>

      <Scoreboard players={game.players} control={game.players.length > 1 ? game.control : -1} />

      {over ? (
        <FinalScores
          players={game.players}
          onAgain={async () => {
            const board = await fetchJeopardyBoard(game.setup);
            start(game.setup, board);
          }}
          onNew={() => {
            save(null);
            setGame(null);
          }}
        />
      ) : (
        <JeopardyBoard
          board={game.board}
          used={game.used}
          onPick={(col, row) => setOpen({ col, row })}
        />
      )}

      {open && (
        <ClueDialog
          key={`${open.col}-${open.row}`}
          column={game.board.columns[open.col]}
          clue={game.board.columns[open.col].clues[open.row]}
          dailyDouble={
            game.board.dailyDouble?.col === open.col && game.board.dailyDouble?.row === open.row
          }
          players={game.players}
          control={game.control}
          onDone={finishClue}
        />
      )}
    </>
  );
}

const allCells = (board) =>
  board.columns.flatMap((c, col) => c.clues.map((_, row) => `${col}-${row}`));

// ----------------------------------------------------------------------

function Setup({ saved, onResume, onStart }) {
  const { s, t } = useLang();
  const { topics } = useTopics();
  // Empty = «Player N» in the current language, filled in when the game starts.
  const [players, setPlayers] = useState(['']);
  const [picked, setPicked] = useState([]);
  const [columns, setColumns] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (slug) =>
    setPicked((list) => (list.includes(slug) ? list.filter((x) => x !== slug) : [...list, slug]));

  const go = async () => {
    setBusy(true);
    setError('');
    const setup = {
      players: players.map((p, i) => p.trim() || s.playerN(i + 1)),
      topics: picked,
      columns,
    };
    try {
      onStart(setup, await fetchJeopardyBoard(setup));
    } catch (err) {
      setError(err?.message || String(err));
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, md: 5 },
          borderRadius: 3,
          color: 'common.white',
          textAlign: 'center',
          background: `radial-gradient(120% 120% at 50% 0%, #2A3BFF 0%, ${JEOPARDY_BLUE} 55%, #02057A 100%)`,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: JEOPARDY_GOLD,
            letterSpacing: 1,
            textShadow: '0 3px 0 rgba(0,0,0,0.45)',
            fontSize: { xs: 34, md: 52 },
          }}
        >
          {s.jeopardy}
        </Typography>
        <Typography sx={{ mt: 1, opacity: 0.9, maxWidth: 560, mx: 'auto' }}>
          {s.jeopardyIntro}
        </Typography>
      </Box>

      {saved && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={onResume}>
              {s.resume}
            </Button>
          }
        >
          {s.resumeGame(saved.players.map((p) => p.name).join(', '))}
        </Alert>
      )}

      <Card sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          {s.playersTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {s.playersHint}
        </Typography>
        <Stack spacing={1.25}>
          {players.map((name, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <TextField
                fullWidth
                size="small"
                value={name}
                placeholder={s.playerN(i + 1)}
                onChange={(e) =>
                  setPlayers((list) =>
                    list.map((p, j) => (j === i ? e.target.value.slice(0, 30) : p))
                  )
                }
              />
              {players.length > 1 && (
                <IconButton
                  aria-label={s.delete}
                  onClick={() => setPlayers((list) => list.filter((_, j) => j !== i))}
                >
                  <Iconify icon="mingcute:close-line" />
                </IconButton>
              )}
            </Stack>
          ))}
        </Stack>
        {players.length < MAX_PLAYERS && (
          <Button
            sx={{ mt: 1.5 }}
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setPlayers((list) => [...list, ''])}
          >
            {s.addPlayer}
          </Button>
        )}
      </Card>

      <Card sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{s.categories}</Typography>
            <Typography variant="body2" color="text.secondary">
              {picked.length ? s.pickedCategories(picked.length) : s.allCategoriesMix}
            </Typography>
          </Box>
          <TextField
            select
            size="small"
            label={s.boardColumns}
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            sx={{ width: 120 }}
          >
            {[3, 4, 5, 6].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
          {topics.map((topic) => {
            const on = picked.includes(topic.slug);
            return (
              <Chip
                key={topic.slug}
                clickable
                onClick={() => toggle(topic.slug)}
                variant={on ? 'filled' : 'outlined'}
                icon={
                  <Box sx={{ display: 'flex', ml: 0.75, color: on ? 'inherit' : topic.color }}>
                    <SmartIcon icon={topic.icon} size={18} />
                  </Box>
                }
                label={t(topic.title)}
                sx={on ? { bgcolor: topic.color, color: 'common.white' } : undefined}
              />
            );
          })}
        </Stack>
      </Card>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <LoadingButton
        fullWidth
        size="large"
        variant="contained"
        loading={busy}
        onClick={go}
        startIcon={<Iconify icon="solar:play-bold" />}
        sx={{
          py: 1.75,
          fontSize: 18,
          bgcolor: JEOPARDY_BLUE,
          '&:hover': { bgcolor: JEOPARDY_BLUE, filter: 'brightness(1.15)' },
        }}
      >
        {s.startGame}
      </LoadingButton>
    </Box>
  );
}

// ----------------------------------------------------------------------

function FinalScores({ players, onAgain, onNew }) {
  const { s } = useLang();
  const [busy, setBusy] = useState(false);
  const ranked = players.map((p, i) => ({ ...p, i })).sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score;
  const winners = ranked.filter((p) => p.score === top);

  return (
    <Card sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', mt: 2 }}>
      <Box sx={{ fontSize: 56, lineHeight: 1 }} aria-hidden>
        🏆
      </Box>
      <Typography variant="h3" sx={{ mt: 1.5, mb: 0.5 }}>
        {players.length === 1
          ? s.soloFinal(top)
          : winners.length > 1
            ? s.tie
            : s.winnerIs(winners[0].name)}
      </Typography>
      <Stack spacing={1} sx={{ maxWidth: 420, mx: 'auto', my: 3 }}>
        {ranked.map((p, place) => (
          <Stack
            key={p.i}
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              px: 2,
              py: 1.25,
              borderRadius: 1.5,
              bgcolor: place === 0 ? 'rgba(255,204,0,0.16)' : 'background.neutral',
            }}
          >
            <Typography variant="subtitle1" sx={{ width: 24 }}>
              {place + 1}
            </Typography>
            <Typography variant="subtitle1" sx={{ flex: 1, textAlign: 'left' }} noWrap>
              {p.name}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: p.score < 0 ? 'error.main' : 'text.primary',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {p.score.toLocaleString()}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
        <LoadingButton
          size="large"
          variant="contained"
          loading={busy}
          startIcon={<Iconify icon="solar:restart-bold" />}
          onClick={async () => {
            setBusy(true);
            try {
              await onAgain();
            } catch {
              // offline — stay on the scores, the button can be tried again
            } finally {
              setBusy(false);
            }
          }}
        >
          {s.newBoardSamePlayers}
        </LoadingButton>
        <Button size="large" variant="outlined" color="inherit" onClick={onNew}>
          {s.newGame}
        </Button>
      </Stack>
    </Card>
  );
}

'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useLang } from 'src/locales';
import { adminApi } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { SmartIcon } from 'src/components/state-views';

import { BiField, emptyL, hasText } from './fields';

// ----------------------------------------------------------------------

const toSlug = (text) =>
  (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

function useSubmit(onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onDone();
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

function Shell({ open, title, onClose, onSubmit, busy, error, children, maxWidth = 'md' }) {
  const { s } = useLang();
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth} scroll="paper">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        style={{ display: 'contents' }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ py: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {children}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={onClose}>
            {s.cancel}
          </Button>
          <LoadingButton type="submit" variant="contained" loading={busy}>
            {s.save}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ── category ─────────────────────────────────────────────────────────

const ICON_PRESETS = [
  'solar:star-bold-duotone',
  'solar:music-notes-bold-duotone',
  'solar:football-bold-duotone',
  'solar:book-bookmark-bold-duotone',
  'solar:atom-bold-duotone',
  'solar:global-bold-duotone',
  'solar:palette-bold-duotone',
  'solar:cpu-bolt-bold-duotone',
  'solar:chef-hat-heart-bold-duotone',
  'solar:history-2-bold-duotone',
];

export function TopicDialog({ open, topic, onClose, onSaved }) {
  const { s } = useLang();
  const editing = !!topic;
  const blank = {
    slug: '',
    title: emptyL(),
    tagline: emptyL(),
    description: emptyL(),
    color: '#00A76F',
    icon: ICON_PRESETS[0],
  };
  const [form, setForm] = useState(blank);
  const [slugTouched, setSlugTouched] = useState(false);
  const { busy, error, setError, run } = useSubmit(onSaved);

  useEffect(() => {
    if (!open) return;
    setForm(topic ? { ...blank, ...topic } : blank);
    setSlugTouched(!!topic);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, topic]);

  const set = (key) => (value) =>
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === 'title' && !slugTouched && { slug: toSlug(value.en) }),
    }));

  const submit = () =>
    run(() => {
      const body = {
        title: form.title,
        tagline: form.tagline,
        description: form.description,
        color: form.color,
        icon: form.icon,
      };
      return editing
        ? adminApi.updateTopic(topic.slug, body)
        : adminApi.createTopic({ ...body, slug: form.slug });
    });

  return (
    <Shell
      open={open}
      title={editing ? s.edit : s.newCategory}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
    >
      <Typography variant="caption" color="text.secondary">
        {s.oneLanguageOk}
      </Typography>
      <BiField
        value={form.title}
        onChange={set('title')}
        labels={[s.titleEn, s.titleMn]}
        required
      />
      <TextField
        label={s.slug}
        value={form.slug}
        disabled={editing}
        required
        onChange={(e) => {
          setSlugTouched(true);
          setForm((f) => ({ ...f, slug: e.target.value }));
        }}
        slotProps={{ htmlInput: { pattern: '[a-z0-9]+(-[a-z0-9]+)*' } }}
      />
      <BiField value={form.tagline} onChange={set('tagline')} labels={[s.taglineEn, s.taglineMn]} />
      <BiField
        value={form.description}
        onChange={set('description')}
        labels={[s.descriptionEn, s.descriptionMn]}
        multiline
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label={s.color}
          type="color"
          value={form.color}
          onChange={(e) => set('color')(e.target.value)}
          sx={{ width: { sm: 120 } }}
        />
        <TextField
          label={s.icon}
          value={form.icon}
          onChange={(e) => set('icon')(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Box sx={{ color: form.color, display: 'flex' }}>
          <SmartIcon icon={form.icon} size={40} />
        </Box>
      </Stack>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
        {ICON_PRESETS.map((icon) => (
          <IconButton
            key={icon}
            onClick={() => set('icon')(icon)}
            sx={{
              color: form.icon === icon ? form.color : 'text.secondary',
              border: '1px solid',
              borderColor: form.icon === icon ? form.color : 'divider',
            }}
          >
            <Iconify icon={icon} width={22} />
          </IconButton>
        ))}
      </Stack>
    </Shell>
  );
}

// ── lesson ───────────────────────────────────────────────────────────

const cardFromLesson = (c) => ({
  icon: c.icon ?? '',
  title: c.title ?? emptyL(),
  facts: {
    en: (c.facts ?? []).map((f) => f.en).join('\n'),
    mn: (c.facts ?? []).map((f) => f.mn).join('\n'),
  },
});

export function LessonDialog({ open, topicSlug, lesson, onClose, onSaved }) {
  const { s } = useLang();
  const editing = !!lesson;
  const blank = { name: '', title: emptyL(), summary: emptyL(), body: emptyL(), cards: [] };
  const [form, setForm] = useState(blank);
  const [nameTouched, setNameTouched] = useState(false);
  const { busy, error, setError, run } = useSubmit(onSaved);

  useEffect(() => {
    if (!open) return;
    setForm(
      lesson
        ? {
            name: lesson.key.split('.').slice(1).join('.'),
            title: lesson.title,
            summary: lesson.summary ?? emptyL(),
            body: lesson.body ?? emptyL(),
            cards: (lesson.visual?.items ?? []).map(cardFromLesson),
          }
        : blank
    );
    setNameTouched(!!lesson);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lesson]);

  const set = (key) => (value) =>
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === 'title' && !nameTouched && { name: toSlug(value.en) }),
    }));
  const setCard = (i, patch) =>
    setForm((f) => ({ ...f, cards: f.cards.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const submit = () =>
    run(() => {
      const lines = (text) => (text || '').split('\n').map((x) => x.trim());
      const cards = form.cards
        .filter((c) => hasText(c.title))
        .map((c) => {
          const en = lines(c.facts.en);
          const mn = lines(c.facts.mn);
          const n = Math.max(en.length, mn.length);
          const facts = Array.from({ length: n }, (_, i) => ({
            en: en[i] ?? '',
            mn: mn[i] ?? '',
          })).filter(hasText);
          return { icon: c.icon, title: c.title, facts };
        });
      const body = { title: form.title, summary: form.summary, body: form.body, cards };
      return editing
        ? adminApi.updateLesson(lesson.key, body)
        : adminApi.createLesson({ ...body, topicSlug, name: form.name });
    });

  return (
    <Shell
      open={open}
      title={editing ? s.edit : s.newLesson}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
    >
      <Typography variant="caption" color="text.secondary">
        {s.oneLanguageOk}
      </Typography>
      <BiField
        value={form.title}
        onChange={set('title')}
        labels={[s.titleEn, s.titleMn]}
        required
      />
      <TextField
        label={s.slug}
        value={form.name}
        disabled={editing}
        required
        onChange={(e) => {
          setNameTouched(true);
          setForm((f) => ({ ...f, name: e.target.value }));
        }}
        slotProps={{ htmlInput: { pattern: '[a-z0-9]+(-[a-z0-9]+)*' } }}
      />
      <BiField value={form.summary} onChange={set('summary')} labels={[s.summaryEn, s.summaryMn]} />
      <BiField
        value={form.body}
        onChange={set('body')}
        labels={[s.bodyEn, s.bodyMn]}
        multiline
        minRows={3}
      />
      <Divider />
      <Stack direction="row" alignItems="center">
        <Typography variant="subtitle1" sx={{ flex: 1 }}>
          {s.cards}
        </Typography>
        <Button
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() =>
            setForm((f) => ({
              ...f,
              cards: [...f.cards, { icon: '⭐', title: emptyL(), facts: emptyL() }],
            }))
          }
        >
          {s.addCard}
        </Button>
      </Stack>
      {form.cards.map((card, i) => (
        <Card key={i} variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label={s.icon}
                value={card.icon}
                onChange={(e) => setCard(i, { icon: e.target.value })}
                sx={{ width: 160 }}
              />
              <Box sx={{ flex: 1 }} />
              <IconButton
                color="error"
                onClick={() => setForm((f) => ({ ...f, cards: f.cards.filter((_, j) => j !== i) }))}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Stack>
            <BiField
              value={card.title}
              onChange={(v) => setCard(i, { title: v })}
              labels={[s.titleEn, s.titleMn]}
            />
            <BiField
              value={card.facts}
              onChange={(v) => setCard(i, { facts: v })}
              labels={[`${s.cardFacts} (EN)`, `${s.cardFacts} (МН)`]}
              multiline
            />
          </Stack>
        </Card>
      ))}
    </Shell>
  );
}

// ── question ─────────────────────────────────────────────────────────

const blankQuestion = () => ({
  difficulty: 1,
  prompt: emptyL(),
  choices: [emptyL(), emptyL(), emptyL(), emptyL()],
  answer: 0,
  explanation: emptyL(),
});

export function QuestionDialog({ open, question, lessons, defaultLesson, onClose, onSaved }) {
  const { s, t } = useLang();
  const editing = !!question;
  const [form, setForm] = useState(blankQuestion);
  const [lessonKey, setLessonKey] = useState('');
  const { busy, error, setError, run } = useSubmit(onSaved);

  useEffect(() => {
    if (!open) return;
    setForm(question ? { ...blankQuestion(), ...question } : blankQuestion());
    setLessonKey(question?.lessonKey ?? defaultLesson ?? '');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, question]);

  const submit = () =>
    run(() => {
      if (!lessonKey) throw new Error(s.pickLesson);
      const body = {
        lessonKey,
        difficulty: form.difficulty,
        prompt: form.prompt,
        choices: form.choices,
        answer: form.answer,
        explanation: form.explanation,
      };
      return editing ? adminApi.updateQuestion(question.id, body) : adminApi.createQuestion(body);
    });

  return (
    <Shell
      open={open}
      title={editing ? s.edit : s.newQuestion}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          select
          label={s.lesson}
          value={lessonKey}
          onChange={(e) => setLessonKey(e.target.value)}
          required
          sx={{ flex: 1 }}
        >
          {lessons.map((l) => (
            <MenuItem key={l.key} value={l.key}>
              {t(l.title)}
            </MenuItem>
          ))}
        </TextField>
        <Box>
          <Typography variant="caption" color="text.secondary" component="div">
            {s.difficultyLabel}
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={form.difficulty}
            onChange={(_e, v) => v && setForm((f) => ({ ...f, difficulty: v }))}
          >
            {s.difficulty.map((label, i) => (
              <ToggleButton key={label} value={i + 1} sx={{ px: 1.5 }}>
                {label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {s.oneLanguageOk}
      </Typography>
      <BiField
        value={form.prompt}
        onChange={(v) => setForm((f) => ({ ...f, prompt: v }))}
        labels={[s.promptEn, s.promptMn]}
        multiline
        required
      />
      {form.choices.map((choice, i) => (
        <Stack key={i} direction="row" spacing={1.5} alignItems="center">
          <IconButton
            onClick={() => setForm((f) => ({ ...f, answer: i }))}
            aria-label={s.correctChoice}
            sx={{ color: form.answer === i ? 'success.main' : 'text.disabled' }}
          >
            <Iconify
              icon={form.answer === i ? 'solar:check-circle-bold' : 'solar:record-linear'}
              width={28}
            />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <BiField
              value={choice}
              onChange={(v) =>
                setForm((f) => ({ ...f, choices: f.choices.map((c, j) => (j === i ? v : c)) }))
              }
              labels={[`${s.choiceN(i + 1)} (EN)`, `${s.choiceN(i + 1)} (МН)`]}
              required
            />
          </Box>
        </Stack>
      ))}
      <BiField
        value={form.explanation}
        onChange={(v) => setForm((f) => ({ ...f, explanation: v }))}
        labels={[s.explanationEn, s.explanationMn]}
        multiline
      />
    </Shell>
  );
}

// ── JSON import ──────────────────────────────────────────────────────

export function ImportDialog({ open, lessonKey, lessonTitle, onClose, onSaved }) {
  const { s } = useLang();
  const [text, setText] = useState('');
  const { busy, error, setError, run } = useSubmit(() => {
    setText('');
    onSaved();
  });

  useEffect(() => {
    if (open) setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = () =>
    run(async () => {
      if (!lessonKey) throw new Error(s.pickLesson);
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(s.invalidJson);
      }
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      const res = await adminApi.bulkQuestions({
        lessonKey,
        questions: (questions ?? []).map((q) => ({
          difficulty: q.difficulty ?? 1,
          prompt: q.prompt,
          choices: q.choices,
          answer: q.answer,
          explanation: q.explanation ?? { en: '', mn: '' },
        })),
      });
      window.alert(s.imported(res.inserted));
    });

  return (
    <Shell
      open={open}
      title={`${s.importJson}${lessonTitle ? ` → ${lessonTitle}` : ''}`}
      onClose={onClose}
      onSubmit={submit}
      busy={busy}
      error={error}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}
      >
        {s.importHint}
      </Typography>
      <TextField
        multiline
        minRows={12}
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
      />
    </Shell>
  );
}

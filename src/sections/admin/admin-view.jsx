'use client';

import { useState, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useAuth } from 'src/auth';
import { useLang } from 'src/locales';
import { adminApi, useAdminTopics, useAdminQuestions } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { SmartIcon, ErrorState, LoadingState } from 'src/components/state-views';

import { hexToChannel } from '../home/home-view';
import { TopicDialog, ImportDialog, LessonDialog, QuestionDialog } from './content-dialogs';

// ----------------------------------------------------------------------

export function AdminView() {
  const { s } = useLang();
  const router = useRouter();
  const { user, checking, isAdmin } = useAuth();
  const { adminTopics, adminTopicsError, reload } = useAdminTopics(isAdmin);
  const [tab, setTab] = useState('content');
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState({ topic: '', lesson: '' });

  useEffect(() => {
    if (!checking && !user) router.replace(paths.login(paths.admin));
  }, [checking, user, router]);

  if (checking || !user) return <LoadingState />;
  if (!isAdmin) return <ErrorState message={s.forbidden} />;
  if (adminTopicsError) return <ErrorState onRetry={reload} />;

  const openQuestions = (topic, lesson = '') => {
    setFilter({ topic, lesson });
    setTab('questions');
  };

  return (
    <>
      <Typography variant="h3" sx={{ mb: 0.5 }}>
        {s.adminTitle}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        {s.adminSubtitle}
      </Typography>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab
          value="content"
          label={s.categories}
          icon={<Iconify icon="solar:widget-5-bold-duotone" />}
          iconPosition="start"
        />
        <Tab
          value="questions"
          label={s.questionsTab}
          icon={<Iconify icon="solar:question-square-bold-duotone" />}
          iconPosition="start"
        />
      </Tabs>

      {tab === 'content' ? (
        <ContentPanel
          topics={adminTopics}
          reload={reload}
          notify={setToast}
          onOpenQuestions={openQuestions}
        />
      ) : (
        <QuestionsPanel
          topics={adminTopics}
          filter={filter}
          setFilter={setFilter}
          reloadTopics={reload}
          notify={setToast}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

// ----------------------------------------------------------------------

function ContentPanel({ topics, reload, notify, onOpenQuestions }) {
  const { s, t } = useLang();
  const [topicDialog, setTopicDialog] = useState({ open: false, topic: null });
  const [lessonDialog, setLessonDialog] = useState({ open: false, topicSlug: '', lesson: null });

  const remove = async (fn) => {
    if (!window.confirm(s.confirmDelete)) return;
    try {
      await fn();
      notify(s.deleted);
      reload();
    } catch (err) {
      notify(err?.message || String(err));
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setTopicDialog({ open: true, topic: null })}
        >
          {s.newCategory}
        </Button>
      </Stack>

      <Stack spacing={2.5}>
        {topics.map((topic) => {
          const custom = topic.origin === 'admin';
          const total = topic.lessons.reduce((n, l) => n + l.questionCount, 0);
          return (
            <Card key={topic.slug} sx={{ overflow: 'hidden' }}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  p: 2.5,
                  bgcolor: varAlpha(hexToChannel(topic.color), 0.08),
                  borderLeft: `4px solid ${topic.color}`,
                }}
              >
                <Box sx={{ color: topic.color, display: 'flex' }}>
                  <SmartIcon icon={topic.icon} size={36} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" noWrap>
                      {t(topic.title)}
                    </Typography>
                    <Chip
                      size="small"
                      variant="soft"
                      color={custom ? 'info' : 'default'}
                      label={custom ? s.custom : s.builtIn}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    /{topic.slug} · {topic.lessons.length} {s.lessons} · {s.totalQuestions(total)}
                  </Typography>
                </Box>
                <Button size="small" onClick={() => onOpenQuestions(topic.slug)}>
                  {s.questionsTab}
                </Button>
                {custom && (
                  <>
                    <Tooltip title={s.edit}>
                      <IconButton onClick={() => setTopicDialog({ open: true, topic })}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={s.delete}>
                      <IconButton
                        color="error"
                        onClick={() => remove(() => adminApi.deleteTopic(topic.slug))}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>

              <Box>
                {topic.lessons.map((lesson) => {
                  const own = lesson.origin === 'admin';
                  return (
                    <Stack
                      key={lesson.key}
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{
                        px: 2.5,
                        py: 1.25,
                        borderTop: (th) => `1px dashed ${th.vars.palette.divider}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                        {t(lesson.title)}
                      </Typography>
                      {own && (
                        <Chip size="small" variant="outlined" color="info" label={s.custom} />
                      )}
                      <Chip
                        size="small"
                        clickable
                        label={s.totalQuestions(lesson.questionCount)}
                        onClick={() => onOpenQuestions(topic.slug, lesson.key)}
                      />
                      <IconButton
                        size="small"
                        component={RouterLink}
                        href={paths.lesson(topic.slug, lesson.key)}
                      >
                        <Iconify icon="solar:eye-bold" width={18} />
                      </IconButton>
                      {own && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setLessonDialog({ open: true, topicSlug: topic.slug, lesson })
                            }
                          >
                            <Iconify icon="solar:pen-bold" width={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => remove(() => adminApi.deleteLesson(lesson.key))}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  );
                })}
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderTop: (th) => `1px dashed ${th.vars.palette.divider}`,
                  }}
                >
                  <Button
                    size="small"
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() =>
                      setLessonDialog({ open: true, topicSlug: topic.slug, lesson: null })
                    }
                  >
                    {s.newLesson}
                  </Button>
                </Box>
              </Box>
            </Card>
          );
        })}
      </Stack>

      <TopicDialog
        open={topicDialog.open}
        topic={topicDialog.topic}
        onClose={() => setTopicDialog({ open: false, topic: null })}
        onSaved={() => {
          setTopicDialog({ open: false, topic: null });
          notify(s.saved);
          reload();
        }}
      />
      <LessonDialog
        open={lessonDialog.open}
        topicSlug={lessonDialog.topicSlug}
        lesson={lessonDialog.lesson}
        onClose={() => setLessonDialog((d) => ({ ...d, open: false }))}
        onSaved={() => {
          setLessonDialog((d) => ({ ...d, open: false }));
          notify(s.saved);
          reload();
        }}
      />
    </>
  );
}

// ----------------------------------------------------------------------

function QuestionsPanel({ topics, filter, setFilter, reloadTopics, notify }) {
  const { s, t } = useLang();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState({ open: false, question: null });
  const [importOpen, setImportOpen] = useState(false);

  // Search waits for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => setPage(1), [filter.topic, filter.lesson, query]);

  const params = {
    topic: filter.topic || undefined,
    lesson: filter.lesson || undefined,
    q: query || undefined,
    page,
    limit: 20,
  };
  const { list, listError, reload } = useAdminQuestions(params, true);

  const topic = topics.find((x) => x.slug === filter.topic);
  const lessons = topic ? topic.lessons : topics.flatMap((x) => x.lessons);
  const lessonTitle = (key) => t(lessons.find((l) => l.key === key)?.title);

  const refresh = () => {
    reload();
    reloadTopics();
  };

  const remove = async (id) => {
    if (!window.confirm(s.confirmDelete)) return;
    try {
      await adminApi.deleteQuestion(id);
      notify(s.deleted);
      refresh();
    } catch (err) {
      notify(err?.message || String(err));
    }
  };

  return (
    <>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          select
          label={s.category}
          value={filter.topic}
          onChange={(e) => setFilter({ topic: e.target.value, lesson: '' })}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">—</MenuItem>
          {topics.map((x) => (
            <MenuItem key={x.slug} value={x.slug}>
              {t(x.title)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={s.lesson}
          value={filter.lesson}
          onChange={(e) => setFilter((f) => ({ ...f, lesson: e.target.value }))}
          sx={{ minWidth: 240 }}
          disabled={!topic}
        >
          <MenuItem value="">—</MenuItem>
          {(topic?.lessons ?? []).map((l) => (
            <MenuItem key={l.key} value={l.key}>
              {t(l.title)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          placeholder={s.searchQuestions}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
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
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ flex: 1 }}>
          {list ? s.totalQuestions(list.total) : ''}
        </Typography>
        <Tooltip title={filter.lesson ? '' : s.pickLesson}>
          <span>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:import-bold" />}
              disabled={!filter.lesson}
              onClick={() => setImportOpen(true)}
            >
              {s.importJson}
            </Button>
          </span>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setDialog({ open: true, question: null })}
        >
          {s.newQuestion}
        </Button>
      </Stack>

      {listError && <ErrorState onRetry={reload} />}
      {!list && !listError && <LoadingState />}

      <Stack spacing={1.5}>
        {list?.questions.map((q) => (
          <Card key={q.id} sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                  <Chip
                    size="small"
                    variant="soft"
                    label={lessonTitle(q.lessonKey) || q.lessonKey}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={s.difficulty[(q.difficulty ?? 1) - 1]}
                  />
                  <Chip
                    size="small"
                    variant="soft"
                    color={q.origin === 'admin' ? 'info' : 'default'}
                    label={q.origin === 'admin' ? s.custom : s.builtIn}
                  />
                  {q.stats?.attempts > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${Math.round((q.stats.correct / q.stats.attempts) * 100)}% · ${q.stats.attempts}`}
                    />
                  )}
                </Stack>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t(q.prompt)}
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 0.75,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  }}
                >
                  {q.choices.map((c, i) => (
                    <Typography
                      key={i}
                      variant="body2"
                      sx={{
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 1,
                        ...(i === q.answer
                          ? {
                              color: 'success.dark',
                              bgcolor: 'rgba(var(--palette-success-mainChannel) / 0.12)',
                              fontWeight: 700,
                            }
                          : { color: 'text.secondary' }),
                      }}
                    >
                      {i === q.answer ? '✓ ' : ''}
                      {t(c)}
                    </Typography>
                  ))}
                </Box>
              </Box>
              <IconButton onClick={() => setDialog({ open: true, question: q })}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
              <IconButton color="error" onClick={() => remove(q.id)}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Stack>
          </Card>
        ))}
      </Stack>

      {list && list.total > 20 && (
        <Pagination
          count={Math.ceil(list.total / 20)}
          page={page}
          onChange={(_e, p) => setPage(p)}
          sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
        />
      )}

      <QuestionDialog
        open={dialog.open}
        question={dialog.question}
        lessons={lessons}
        defaultLesson={filter.lesson}
        onClose={() => setDialog({ open: false, question: null })}
        onSaved={() => {
          setDialog({ open: false, question: null });
          notify(s.saved);
          refresh();
        }}
      />
      <ImportDialog
        open={importOpen}
        lessonKey={filter.lesson}
        lessonTitle={lessonTitle(filter.lesson)}
        onClose={() => setImportOpen(false)}
        onSaved={() => {
          setImportOpen(false);
          refresh();
        }}
      />
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { fToNow } from 'src/utils/format-time';

import { useLang } from 'src/locales';
import { adminApi, useAdminReports } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { ErrorState, LoadingState } from 'src/components/state-views';

import { QuestionDialog } from './content-dialogs';

// ----------------------------------------------------------------------

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const PAGE = 15;

/** The choice most reporters say is right, when it is not the stored answer. */
const topSuggestion = (question) => {
  const votes = new Map();
  question.reports.forEach((r) => {
    if (r.suggested !== null && r.suggested !== undefined && r.suggested !== question.answer) {
      votes.set(r.suggested, (votes.get(r.suggested) ?? 0) + 1);
    }
  });
  const [best] = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  return best ? { choice: best[0], votes: best[1] } : null;
};

export function ReportsPanel({ topics, notify, onChanged }) {
  const { s, t } = useLang();
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  useEffect(() => setPage(1), [status]);

  const { reports, reportsError, reload } = useAdminReports({ status, page, limit: PAGE }, true);
  const lessons = topics.flatMap((x) => x.lessons);

  const resolve = async (question, body) => {
    setBusy(question.id);
    try {
      await adminApi.resolveReport(question.id, body);
      notify(body.status === 'fixed' ? s.markedFixed : s.dismissed);
      reload();
      onChanged();
    } catch (err) {
      notify(err?.message || String(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={status}
          onChange={(_e, v) => v && setStatus(v)}
        >
          <ToggleButton value="open">{s.reportsOpen}</ToggleButton>
          <ToggleButton value="closed">{s.reportsClosed}</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="subtitle2" color="text.secondary">
          {reports ? s.totalQuestions(reports.total) : ''}
        </Typography>
      </Stack>

      {reportsError && <ErrorState onRetry={reload} />}
      {!reports && !reportsError && <LoadingState />}
      {reports && !reports.questions.length && (
        <Stack alignItems="center" spacing={1.5} sx={{ py: 10, color: 'text.secondary' }}>
          <Iconify
            icon="solar:check-circle-bold-duotone"
            width={56}
            sx={{ color: 'success.main' }}
          />
          <Typography>{status === 'open' ? s.noReports : s.noClosedReports}</Typography>
        </Stack>
      )}

      <Stack spacing={2}>
        {reports?.questions.map((q) => {
          const suggestion = status === 'open' ? topSuggestion(q) : null;
          return (
            <Card key={q.id} sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                <Chip size="small" variant="soft" label={t(q.lessonTitle) || q.lessonKey} />
                {status === 'open' && (
                  <Chip
                    size="small"
                    color="error"
                    variant="soft"
                    icon={<Iconify icon="solar:flag-bold" width={14} />}
                    label={s.reportCount(q.openReports)}
                  />
                )}
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
                  mb: 1.5,
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
                        : suggestion?.choice === i
                          ? {
                              color: 'warning.dark',
                              bgcolor: 'rgba(var(--palette-warning-mainChannel) / 0.14)',
                              fontWeight: 600,
                            }
                          : { color: 'text.secondary' }),
                    }}
                  >
                    {LETTERS[i]}. {i === q.answer ? '✓ ' : ''}
                    {t(c)}
                  </Typography>
                ))}
              </Box>
              {t(q.explanation) && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  💡 {t(q.explanation)}
                </Typography>
              )}

              <Divider sx={{ borderStyle: 'dashed', mb: 1.5 }} />
              <Stack spacing={1.25} sx={{ mb: 2 }}>
                {q.reports.map((r) => (
                  <Stack key={r.id} direction="row" spacing={1.25} alignItems="flex-start">
                    <Iconify
                      icon="solar:chat-square-like-bold-duotone"
                      width={20}
                      sx={{ color: 'text.disabled', mt: 0.25, flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Typography variant="subtitle2">{s.reportReasons[r.reason]}</Typography>
                        {r.suggested !== null && r.suggested !== undefined && (
                          <Chip
                            size="small"
                            variant="outlined"
                            color="warning"
                            label={`${s.theySuggest}: ${LETTERS[r.suggested]}. ${t(q.choices[r.suggested])}`}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {r.name || s.anonymous} · {fToNow(r.createdAt)}
                          {r.status !== 'open' &&
                            ` · ${r.status === 'fixed' ? s.markedFixed : s.dismissed}${r.resolvedBy ? ` (${r.resolvedBy})` : ''}`}
                        </Typography>
                      </Stack>
                      {r.note && (
                        <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: 'pre-wrap' }}>
                          “{r.note}”
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                ))}
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="solar:pen-bold" />}
                  onClick={() => setEditing(q)}
                >
                  {s.editQuestion}
                </Button>
                {status === 'open' && (
                  <>
                    {suggestion && (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        disabled={busy === q.id}
                        startIcon={<Iconify icon="solar:check-read-linear" />}
                        onClick={() => resolve(q, { status: 'fixed', answer: suggestion.choice })}
                      >
                        {s.acceptSuggestion(LETTERS[suggestion.choice])}
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      disabled={busy === q.id}
                      startIcon={<Iconify icon="eva:checkmark-fill" />}
                      onClick={() => resolve(q, { status: 'fixed' })}
                    >
                      {s.markFixed}
                    </Button>
                    <Button
                      size="small"
                      color="inherit"
                      disabled={busy === q.id}
                      onClick={() => resolve(q, { status: 'dismissed' })}
                    >
                      {s.dismiss}
                    </Button>
                  </>
                )}
              </Stack>
            </Card>
          );
        })}
      </Stack>

      {reports && reports.total > PAGE && (
        <Pagination
          count={Math.ceil(reports.total / PAGE)}
          page={page}
          onChange={(_e, p) => setPage(p)}
          sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
        />
      )}

      <QuestionDialog
        open={!!editing}
        question={editing}
        lessons={lessons}
        defaultLesson={editing?.lessonKey}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          notify(s.saved);
          reload();
        }}
      />
    </>
  );
}

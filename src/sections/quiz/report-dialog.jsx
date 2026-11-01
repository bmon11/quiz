'use client';

import { useState, useEffect } from 'react';

import Radio from '@mui/material/Radio';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useLang } from 'src/locales';
import { reportQuestion } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const REASONS = ['wrong_answer', 'typo', 'unclear', 'outdated', 'other'];

/** «This question is wrong» — reaches the editors' Reports tab. */
export function ReportDialog({ open, question, onClose }) {
  const { s, t, lang } = useLang();
  const [reason, setReason] = useState('wrong_answer');
  const [suggested, setSuggested] = useState('');
  const [note, setNote] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('wrong_answer');
    setSuggested('');
    setNote('');
    setState('idle');
    setError('');
  }, [open, question?.id]);

  const send = async () => {
    setState('sending');
    try {
      await reportQuestion({
        questionId: question.id,
        reason,
        suggested: reason === 'wrong_answer' && suggested !== '' ? Number(suggested) : null,
        note: note.trim(),
        lang,
      });
      setState('sent');
    } catch (err) {
      setError(err?.message || String(err));
      setState('error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Iconify icon="solar:flag-bold-duotone" sx={{ color: 'error.main' }} />
        {s.reportTitle}
      </DialogTitle>

      {state === 'sent' ? (
        <>
          <DialogContent>
            <Stack alignItems="center" spacing={1.5} sx={{ py: 2, textAlign: 'center' }}>
              <Iconify icon="solar:heart-bold-duotone" width={48} sx={{ color: 'error.main' }} />
              <Typography variant="h6">{s.reportThanks}</Typography>
              <Typography variant="body2" color="text.secondary">
                {s.reportThanksBody}
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={onClose}>
              {s.close}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent>
            {question && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t(question.prompt)}
              </Typography>
            )}
            <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => (
                <FormControlLabel
                  key={r}
                  value={r}
                  control={<Radio size="small" />}
                  label={s.reportReasons[r]}
                />
              ))}
            </RadioGroup>
            {reason === 'wrong_answer' && question && (
              <TextField
                select
                fullWidth
                size="small"
                label={s.rightAnswerIs}
                value={suggested}
                onChange={(e) => setSuggested(e.target.value)}
                sx={{ mt: 2 }}
              >
                <MenuItem value="">{s.notSure}</MenuItem>
                {question.choices.map((c, i) => (
                  <MenuItem key={i} value={String(i)}>
                    {LETTERS[i]}. {t(c)}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label={s.reportNote}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              sx={{ mt: 2 }}
            />
            {state === 'error' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button color="inherit" onClick={onClose}>
              {s.cancel}
            </Button>
            <LoadingButton
              variant="contained"
              color="error"
              loading={state === 'sending'}
              onClick={send}
            >
              {s.sendReport}
            </LoadingButton>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

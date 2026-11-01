'use client';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

export const emptyL = () => ({ en: '', mn: '' });

/** One bilingual value as two fields side by side (stacked on phones). */
export function BiField({ value, onChange, labels, multiline, required, minRows = 2 }) {
  const set = (lang) => (e) => onChange({ ...value, [lang]: e.target.value });
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
      <TextField
        label={labels[1]}
        value={value?.mn ?? ''}
        onChange={set('mn')}
        multiline={multiline}
        minRows={multiline ? minRows : undefined}
        required={required && !value?.en}
      />
      <TextField
        label={labels[0]}
        value={value?.en ?? ''}
        onChange={set('en')}
        multiline={multiline}
        minRows={multiline ? minRows : undefined}
        required={required && !value?.mn}
      />
    </Box>
  );
}

export const hasText = (v) => !!(v?.en?.trim() || v?.mn?.trim());

'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function LoadingState() {
  const { s } = useLang();
  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 12 }} role="status">
      <CircularProgress />
      <Typography color="text.secondary">{s.loading}</Typography>
    </Stack>
  );
}

export function ErrorState({ onRetry, message }) {
  const { s } = useLang();
  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 12, textAlign: 'center' }} role="alert">
      <Box sx={{ color: 'warning.main' }}>
        <Iconify icon="solar:cloud-cross-bold-duotone" width={64} />
      </Box>
      <Typography variant="h6">{message ?? s.loadError}</Typography>
      {onRetry && (
        <Button size="large" variant="contained" onClick={() => onRetry()}>
          {s.retry}
        </Button>
      )}
    </Stack>
  );
}

/** Big, obvious back link — first thing on every inner page. */
export function BackButton({ href, label }) {
  const { s } = useLang();
  return (
    <Button
      href={href}
      color="inherit"
      startIcon={<Iconify icon="solar:arrow-left-linear" />}
      sx={{ mb: 2, ml: -1 }}
    >
      {label ?? s.back}
    </Button>
  );
}

/** Renders an iconify name, or the string itself when it's an emoji. */
export function SmartIcon({ icon, size = 32, color }) {
  if (!icon) return null;
  if (icon.includes(':')) return <Iconify icon={icon} width={size} sx={{ color }} />;
  return (
    <Box component="span" aria-hidden sx={{ fontSize: size * 0.9, lineHeight: 1 }}>
      {icon}
    </Box>
  );
}

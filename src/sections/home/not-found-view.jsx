'use client';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function NotFoundView() {
  const { s } = useLang();
  return (
    <Stack alignItems="center" spacing={3} sx={{ py: 12, textAlign: 'center' }}>
      <Iconify
        icon="solar:map-arrow-square-bold-duotone"
        width={80}
        sx={{ color: 'primary.main' }}
      />
      <Typography variant="h4">{s.notFound}</Typography>
      <Button
        size="large"
        variant="contained"
        color="primary"
        component={RouterLink}
        href={paths.home}
      >
        {s.home}
      </Button>
    </Stack>
  );
}

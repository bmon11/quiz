'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useAuth } from 'src/auth';
import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { AccountMenu } from './account-menu';

// ----------------------------------------------------------------------

export function MainLayout({ children }) {
  const { lang, setLang, s } = useLang();
  const { user } = useAuth();
  const { mode, systemMode, setMode } = useColorScheme();
  const isDark = (mode === 'system' ? systemMode : mode) === 'dark';
  const pathname = usePathname();
  const navLink = (href, label, icon) => (
    <Button
      component={RouterLink}
      href={href}
      color="inherit"
      startIcon={<Iconify icon={icon} />}
      sx={{
        display: { xs: 'none', md: 'inline-flex' },
        color: pathname.startsWith(href) ? 'primary.main' : 'text.secondary',
      }}
    >
      {label}
    </Button>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
          backdropFilter: 'blur(10px)',
          bgcolor: (theme) => `rgba(${theme.vars.palette.background.defaultChannel} / 0.82)`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: { xs: 1, sm: 1.5 }, minHeight: { xs: 64 } }}>
            <Stack
              component={RouterLink}
              href={paths.home}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ color: 'text.primary', textDecoration: 'none', mr: 'auto' }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'common.white',
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.vars.palette.primary.light}, ${theme.vars.palette.primary.dark})`,
                }}
              >
                <Iconify icon="solar:lightbulb-bolt-bold" width={24} />
              </Box>
              <Typography
                variant="h5"
                component="span"
                sx={{ display: { xs: 'none', sm: 'inline' }, letterSpacing: -0.5 }}
              >
                Trivia
                <Box component="span" sx={{ color: 'primary.main' }}>
                  -wiki
                </Box>
              </Typography>
            </Stack>

            {user && navLink(paths.me, s.myProgress, 'solar:chart-square-bold-duotone')}
            {user?.role === 'admin' &&
              navLink(paths.admin, s.admin, 'solar:pen-new-square-bold-duotone')}

            <ToggleButtonGroup
              exclusive
              size="small"
              value={lang}
              aria-label={s.language}
              onChange={(_e, next) => next && setLang(next)}
            >
              <ToggleButton value="mn" sx={{ px: 1.5, fontWeight: 700 }}>
                МН
              </ToggleButton>
              <ToggleButton value="en" sx={{ px: 1.5, fontWeight: 700 }}>
                EN
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title={isDark ? s.lightMode : s.darkMode}>
              <IconButton
                aria-label={isDark ? s.lightMode : s.darkMode}
                onClick={() => setMode(isDark ? 'light' : 'dark')}
              >
                <Iconify
                  icon={isDark ? 'solar:sun-bold-duotone' : 'solar:moon-bold-duotone'}
                  width={26}
                />
              </IconButton>
            </Tooltip>

            <AccountMenu />
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flex: '1 1 auto', py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  );
}

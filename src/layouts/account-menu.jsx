'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, usePathname } from 'src/routes/hooks';

import { useAuth } from 'src/auth';
import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AccountMenu() {
  const { s } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const { user, checking, isAdmin, logout } = useAuth();
  const [anchor, setAnchor] = useState(null);

  if (checking) return <Box sx={{ width: 40 }} />;

  if (!user) {
    return (
      <Button
        variant="contained"
        color="inherit"
        component={RouterLink}
        href={paths.login(pathname !== paths.login() ? pathname : undefined)}
        startIcon={<Iconify icon="solar:login-3-bold-duotone" />}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {s.signIn}
      </Button>
    );
  }

  const go = (href) => {
    setAnchor(null);
    router.push(href);
  };

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ p: 0.5 }}
        aria-label={user.name}
      >
        <Avatar
          src={user.avatar || undefined}
          alt={user.name}
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            color: 'common.white',
            fontWeight: 700,
          }}
          imgProps={{ referrerPolicy: 'no-referrer' }}
        >
          {user.name?.[0]?.toUpperCase()}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 240, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.email}
          </Typography>
        </Box>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem onClick={() => go(paths.me)}>
          <ListItemIcon>
            <Iconify icon="solar:chart-square-bold-duotone" />
          </ListItemIcon>
          {s.myProgress}
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={() => go(paths.admin)}>
            <ListItemIcon>
              <Iconify icon="solar:pen-new-square-bold-duotone" />
            </ListItemIcon>
            {s.admin}
          </MenuItem>
        )}
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem
          onClick={() => {
            setAnchor(null);
            logout();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Iconify icon="solar:logout-2-bold-duotone" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          {s.signOut}
        </MenuItem>
      </Menu>
    </>
  );
}

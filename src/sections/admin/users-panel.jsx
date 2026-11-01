'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import InputAdornment from '@mui/material/InputAdornment';

import { fDate, fToNow } from 'src/utils/format-time';

import { useLang } from 'src/locales';
import { ROLES, useAuth } from 'src/auth';
import { adminApi, useAdminUsers } from 'src/actions/quiz';

import { Iconify } from 'src/components/iconify';
import { ErrorState, LoadingState } from 'src/components/state-views';

// ----------------------------------------------------------------------

const PAGE = 25;
const ROLE_COLOR = { user: 'default', contributor: 'info', editor: 'warning', admin: 'error' };

export function UsersPanel({ notify }) {
  const { s } = useLang();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => setPage(1), [query, role]);

  const { users, usersError, reload } = useAdminUsers(
    { q: query || undefined, role: role || undefined, page, limit: PAGE },
    true
  );

  const changeRole = async (person, next) => {
    if (next === person.role) return;
    setSaving(person.id);
    try {
      await adminApi.setUserRole(person.id, next);
      notify(`${person.name}: ${s.roles[next]}`);
      reload();
    } catch (err) {
      notify(err?.message || String(err));
    } finally {
      setSaving('');
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <Chip
          label={`${s.allRoles} · ${users ? Object.values(users.roles).reduce((a, b) => a + b, 0) : '…'}`}
          variant={role ? 'outlined' : 'filled'}
          onClick={() => setRole('')}
        />
        {ROLES.map((r) => (
          <Chip
            key={r}
            color={ROLE_COLOR[r]}
            variant={role === r ? 'filled' : 'outlined'}
            label={`${s.roles[r]} · ${users?.roles?.[r] ?? '…'}`}
            onClick={() => setRole(role === r ? '' : r)}
          />
        ))}
      </Stack>

      <TextField
        fullWidth
        placeholder={s.searchUsers}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2.5 }}
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

      {usersError && <ErrorState onRetry={reload} />}
      {!users && !usersError && <LoadingState />}
      {users && !users.users.length && (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          {s.noMatch}
        </Typography>
      )}

      <Stack spacing={1.25}>
        {users?.users.map((u) => {
          const locked = u.roleFromEnv || u.id === me?.id;
          return (
            <Card key={u.id} sx={{ p: 2 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ sm: 'center' }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ flex: 1, minWidth: 0 }}
                >
                  <Avatar
                    src={u.avatar || undefined}
                    alt={u.name}
                    imgProps={{ referrerPolicy: 'no-referrer' }}
                    sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 700 }}
                  >
                    {u.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="subtitle2" noWrap>
                        {u.name}
                      </Typography>
                      {u.signIn.includes('google') && (
                        <Tooltip title="Google">
                          <Iconify icon="logos:google-icon" width={14} />
                        </Tooltip>
                      )}
                      {u.signIn.includes('password') && (
                        <Tooltip title={s.password}>
                          <Iconify
                            icon="solar:key-bold"
                            width={14}
                            sx={{ color: 'text.disabled' }}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {u.email}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {s.joined} {fDate(u.createdAt)}
                      {u.lastSeenAt && ` · ${s.lastSeen} ${fToNow(u.lastSeenAt)}`}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2.5} sx={{ textAlign: 'center' }}>
                  <Stat value={u.quizzes} label={s.quizzesTaken} />
                  <Stat
                    value={u.avgPercent === null ? '—' : `${u.avgPercent}%`}
                    label={s.accuracy}
                  />
                  <Stat value={u.questionsAdded} label={s.added} />
                </Stack>

                <Tooltip
                  title={u.roleFromEnv ? s.roleFromEnv : u.id === me?.id ? s.cannotChangeOwn : ''}
                >
                  <TextField
                    select
                    size="small"
                    value={u.role}
                    disabled={locked || saving === u.id}
                    onChange={(e) => changeRole(u, e.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        <Chip
                          size="small"
                          color={ROLE_COLOR[r]}
                          variant="soft"
                          label={s.roles[r]}
                        />
                      </MenuItem>
                    ))}
                  </TextField>
                </Tooltip>
              </Stack>
            </Card>
          );
        })}
      </Stack>

      {users && users.total > PAGE && (
        <Pagination
          count={Math.ceil(users.total / PAGE)}
          page={page}
          onChange={(_e, p) => setPage(p)}
          sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
        />
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {ROLES.map((r) => `${s.roles[r]} — ${s.roleHints[r]}`).join(' · ')}
      </Typography>
    </>
  );
}

function Stat({ value, label }) {
  return (
    <Box sx={{ minWidth: 56 }}>
      <Typography variant="subtitle1">{value}</Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

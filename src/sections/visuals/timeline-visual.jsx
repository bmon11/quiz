'use client';

import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import useMediaQuery from '@mui/material/useMediaQuery';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from '@mui/lab/TimelineOppositeContent';

import { useLang } from 'src/locales';

// ----------------------------------------------------------------------

export function TimelineVisual({ visual, color }) {
  const { t } = useLang();
  const wide = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const items = visual.items ?? [];

  return (
    <Timeline
      position={wide ? 'alternate' : 'right'}
      sx={
        wide
          ? undefined
          : { p: 0, [`& .${timelineOppositeContentClasses.root}`]: { flex: 0, p: 0 } }
      }
    >
      {items.map((item, i) => (
        <TimelineItem key={i}>
          <TimelineOppositeContent sx={{ display: wide ? 'block' : 'none', pt: 1.75 }}>
            <Typography variant="subtitle2" sx={{ color }}>
              {t(item.when)}
            </Typography>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot
              sx={{
                bgcolor: color,
                width: 28,
                height: 28,
                justifyContent: 'center',
                alignItems: 'center',
                color: 'common.white',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {i + 1}
            </TimelineDot>
            {i < items.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent sx={{ pb: 3 }}>
            {!wide && (
              <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
                {t(item.when)}
              </Typography>
            )}
            <Typography variant="h6">{t(item.title)}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t(item.body)}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}

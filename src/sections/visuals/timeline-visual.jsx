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

import { ListMore, ListSearch, useListTools } from './list-tools';

const eventText = (item) => [item.when, item.title, item.body].flatMap((l) => [l.en, l.mn]).join(' ');

// ----------------------------------------------------------------------

export function TimelineVisual({ visual, color }) {
  const { t } = useLang();
  const wide = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const items = visual.items ?? [];
  const tools = useListTools(items, eventText, { page: 20 });
  const last = tools.visible.length - 1;

  return (
    <>
    <ListSearch tools={tools} />
    <Timeline
      position={wide ? 'alternate' : 'right'}
      sx={
        wide
          ? undefined
          : { p: 0, [`& .${timelineOppositeContentClasses.root}`]: { flex: 0, p: 0 } }
      }
    >
      {tools.visible.map(({ item, index: i }, row) => (
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
            {row < last && <TimelineConnector />}
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
    <ListMore tools={tools} />
    </>
  );
}

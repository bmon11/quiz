'use client';

import { geoPath, geoMercator, geoNaturalEarth1 } from 'd3-geo';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useLang } from 'src/locales';

import { Iconify } from 'src/components/iconify';

import { useGeo, MAP_CREDITS } from './use-geo';

// ----------------------------------------------------------------------

const W = 800;
const MAX_ZOOM = 16;
const PROJECTIONS = { mongolia: geoMercator, world: geoNaturalEarth1 };

/** Re-centres `projection` on the screen point (cx, cy) at a new scale. */
const rescale = (projection, scale, cx, cy) => {
  const geo = projection.invert([cx, cy]);
  projection.scale(scale);
  const [px, py] = projection(geo);
  const [tx, ty] = projection.translate();
  projection.translate([tx + cx - px, ty + cy - py]);
};

/**
 * An SVG vector map. `regions` colours some places ({ id: { fill, stroke? } });
 * the rest are plain land. `focus` (world map) frames those places with their
 * neighbours around them. With `zoomable`, +/− buttons zoom and dragging pans;
 * `zoomTo` brings one region into view. `labels`: 'regions' (coloured ones),
 * 'all', or an array of ids. Tiny highlighted places get a ring so they show.
 */
export function GeoMap({
  name,
  regions = {},
  focus,
  zoomable = false,
  zoomTo,
  selected,
  onSelect,
  labels = 'regions',
  dark = false,
  maxHeight,
  credit = true,
  ariaLabel,
}) {
  const { lang } = useLang();
  const { features, geoError } = useGeo(name);
  const boxRef = useRef(null);
  const [width, setWidth] = useState(W);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef(null);
  const focusKey = (focus ?? []).join(',');

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => setWidth(node.clientWidth || W));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!features) return null;
    const all = { type: 'FeatureCollection', features };
    const projection = PROJECTIONS[name]();
    let H;
    if (name === 'mongolia') {
      projection.fitWidth(W - 16, all);
      const [[, y0], [, y1]] = geoPath(projection).bounds(all);
      H = Math.ceil(y1 - y0 + 16);
      projection.fitExtent(
        [
          [8, 8],
          [W - 8, H - 8],
        ],
        all
      );
    } else {
      const ids = new Set(focus ?? []);
      const framed = features.filter((f) => ids.has(f.properties.id));
      H = Math.round(W * (framed.length ? 0.6 : 0.5));
      projection.fitExtent(
        [
          [4, 4],
          [W - 4, H - 4],
        ],
        all
      );
      if (framed.length) {
        // Fit the places, then step back so their neighbours show too.
        const base = projection.scale();
        projection.fitExtent(
          [
            [60, 60],
            [W - 60, H - 60],
          ],
          { type: 'FeatureCollection', features: framed }
        );
        const fitted = projection.scale();
        rescale(projection, Math.min(Math.max(fitted * 0.45, base), base * 12), W / 2, H / 2);
      }
    }
    const path = geoPath(projection);
    const shapes = features.map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      mn: f.properties.mn,
      d: path(f),
      c: path.centroid(f),
      b: path.bounds(f),
      area: path.area(f),
    }));
    return { H, shapes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features, name, focusKey]);

  // A new map / framing starts unzoomed.
  useEffect(() => setView({ k: 1, x: 0, y: 0 }), [name, focusKey]);

  const H = layout?.H ?? W / 2;
  const toScreen = width / W; // viewBox unit → CSS px

  const zoom = useCallback(
    (factor, cx = W / 2, cy = H / 2) =>
      setView((v) => {
        const k = Math.min(Math.max(v.k * factor, 1), MAX_ZOOM);
        if (k === 1) return { k: 1, x: 0, y: 0 };
        return { k, x: cx - ((cx - v.x) * k) / v.k, y: cy - ((cy - v.y) * k) / v.k };
      }),
    [H]
  );

  // Bring a small region into view (a tap in the list below, say).
  useEffect(() => {
    if (!zoomable || !zoomTo || !layout) return;
    const shape = layout.shapes.find((sh) => sh.id === zoomTo);
    if (!shape) return;
    const [[x0, y0], [x1, y1]] = shape.b;
    const want = Math.min(W / Math.max((x1 - x0) * 5, 1), H / Math.max((y1 - y0) * 5, 1));
    setView((v) => {
      const k = Math.min(Math.max(want, v.k, 1), MAX_ZOOM);
      if (k === 1) return { k: 1, x: 0, y: 0 };
      const [cx, cy] = shape.c;
      return { k, x: W / 2 - cx * k, y: H / 2 - cy * k };
    });
  }, [zoomTo, zoomable, layout, H]);

  const onPointerDown = (e) => {
    if (!zoomable || view.k === 1) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / toScreen;
    const dy = (e.clientY - d.y) / toScreen;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const onPointerUp = () => {
    // Keep `moved` until the click that follows, so a pan doesn't select.
    setTimeout(() => {
      drag.current = null;
    }, 0);
  };

  const land = dark ? 'rgba(255,255,255,0.16)' : 'var(--palette-grey-300)';
  const border = dark ? 'rgba(0,0,0,0.45)' : 'var(--palette-background-paper)';
  const ink = dark ? '#fff' : 'var(--palette-text-primary)';
  const halo = dark ? 'rgba(0,0,0,0.7)' : 'var(--palette-background-paper)';

  const labelled = (id) =>
    labels === 'all' ? true : Array.isArray(labels) ? labels.includes(id) : !!regions[id];
  const px = 1 / (toScreen * view.k); // one CSS pixel in drawing units
  const fontPx = 11.5;

  const shapes = layout?.shapes ?? [];
  // Coloured and selected regions draw last so their borders sit on top.
  const ordered = [...shapes].sort(
    (a, b) => (a.id === selected) - (b.id === selected) || !!regions[a.id] - !!regions[b.id]
  );

  return (
    <Box ref={boxRef} sx={{ position: 'relative', width: 1 }}>
      {!layout && (
        <Box sx={{ aspectRatio: '2 / 1', display: 'grid', placeItems: 'center', maxHeight }}>
          {geoError ? (
            <Iconify icon="solar:map-arrow-square-bold-duotone" width={40} sx={{ opacity: 0.4 }} />
          ) : (
            <CircularProgress size={28} sx={{ color: dark ? 'grey.400' : undefined }} />
          )}
        </Box>
      )}
      {layout && (
        <Box
          component="svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={ariaLabel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          sx={{
            display: 'block',
            width: 1,
            height: 'auto',
            maxHeight,
            touchAction: zoomable && view.k > 1 ? 'none' : 'auto',
            cursor: zoomable && view.k > 1 ? 'grab' : 'default',
            userSelect: 'none',
          }}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {ordered.map((sh) => {
              const r = regions[sh.id];
              const pickable = !!onSelect && !!r;
              return (
                <path
                  key={sh.id}
                  d={sh.d}
                  fill={r?.fill ?? land}
                  stroke={sh.id === selected ? ink : (r?.stroke ?? border)}
                  strokeWidth={sh.id === selected ? 2.5 : r?.stroke ? 1.5 : 0.75}
                  vectorEffect="non-scaling-stroke"
                  style={{ cursor: pickable ? 'pointer' : 'inherit', transition: 'fill 200ms' }}
                  onClick={
                    pickable
                      ? () => {
                          if (!drag.current?.moved) onSelect(sh.id);
                        }
                      : undefined
                  }
                >
                  <title>{lang === 'mn' ? sh.mn || sh.name : sh.name}</title>
                </path>
              );
            })}
            {/* Rings for highlighted places too small to see. */}
            {shapes
              .filter((sh) => regions[sh.id] && sh.area / (px * px) < 80)
              .map((sh) => (
                <circle
                  key={`ring-${sh.id}`}
                  cx={sh.c[0]}
                  cy={sh.c[1]}
                  r={9 * px}
                  fill="none"
                  stroke={regions[sh.id].ring ?? regions[sh.id].fill}
                  strokeWidth={2.5 * px}
                  pointerEvents="none"
                />
              ))}
            {shapes
              .filter((sh) => labelled(sh.id) && Number.isFinite(sh.c[0]))
              .map((sh) => {
                const text = lang === 'mn' ? sh.mn || sh.name : sh.name;
                // Only where the name fits (roughly) inside its region on screen.
                const wide = (sh.b[1][0] - sh.b[0][0]) / px;
                // Named on purpose (an array) or selected: always shown.
                const fits =
                  Array.isArray(labels) || sh.id === selected || wide > text.length * fontPx * 0.5;
                if (!fits) return null;
                return (
                  <text
                    key={`label-${sh.id}`}
                    x={sh.c[0]}
                    y={sh.c[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={fontPx * px}
                    fontWeight={700}
                    fill={ink}
                    stroke={halo}
                    strokeWidth={3 * px}
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {text}
                  </text>
                );
              })}
          </g>
        </Box>
      )}

      {zoomable && layout && (
        <Stack
          spacing={0.5}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            p: 0.25,
            borderRadius: 1,
            bgcolor: dark ? 'rgba(0,0,0,0.4)' : 'background.paper',
            boxShadow: dark ? 'none' : 1,
          }}
        >
          {[
            ['eva:plus-fill', () => zoom(1.6), 'Zoom in'],
            ['eva:minus-fill', () => zoom(1 / 1.6), 'Zoom out'],
            ['solar:restart-linear', () => setView({ k: 1, x: 0, y: 0 }), 'Reset'],
          ].map(([icon, fn, label]) => (
            <Tooltip key={icon} title={label} placement="left">
              <IconButton size="small" onClick={fn} aria-label={label} sx={{ color: ink }}>
                <Iconify icon={icon} width={18} />
              </IconButton>
            </Tooltip>
          ))}
        </Stack>
      )}

      {credit && layout && (
        <Box
          component="span"
          sx={{
            display: 'block',
            mt: 0.5,
            fontSize: 10,
            textAlign: dark ? 'left' : 'right',
            color: dark ? 'grey.500' : 'text.disabled',
          }}
        >
          {MAP_CREDITS[name]}
        </Box>
      )}
    </Box>
  );
}

'use client';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Captions from 'yet-another-react-lightbox/plugins/captions';

import { useLang } from 'src/locales';

// ----------------------------------------------------------------------

/** Wikimedia file page — the credit line every Commons picture needs. */
export const photoCredit = (photo) =>
  `https://en.wikipedia.org/wiki/File:${encodeURIComponent(photo.file)}`;

/**
 * Full-screen viewer for a lesson's pictures: pinch, wheel or double-tap to
 * zoom, drag to pan, swipe or arrow keys between pictures.
 * `items`: [{ photo, title, subtitle }], `index`: the open one (-1 = closed).
 */
export function PhotoLightbox({ items, index, onClose }) {
  const { t } = useLang();

  const slides = items.map(({ photo, title, subtitle }) => ({
    src: photo.full,
    width: photo.width,
    height: photo.height,
    alt: t(title),
    title: t(title),
    description: [subtitle && t(subtitle), `Wikimedia Commons · ${decodeURIComponent(photo.file).replace(/_/g, ' ')}`]
      .filter(Boolean)
      .join('\n'),
  }));

  return (
    <Lightbox
      open={index >= 0}
      index={Math.max(0, index)}
      close={onClose}
      slides={slides}
      plugins={[Zoom, Captions, Counter]}
      zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true, doubleClickMaxStops: 3 }}
      captions={{ descriptionTextAlign: 'center', descriptionMaxLines: 3 }}
      carousel={{ finite: items.length <= 1, preload: 1 }}
      controller={{ closeOnBackdropClick: true }}
      styles={{ container: { backgroundColor: 'rgba(0, 0, 0, 0.92)' } }}
    />
  );
}

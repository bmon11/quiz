'use client';

import { useRef } from 'react';

// ----------------------------------------------------------------------

/** A click this soon after a handled touch is the same tap: ignored. */
const SAME_TAP_MS = 800;

/**
 * Props that run `handler` when the finger lifts instead of on `click`. iOS Safari drops the click
 * of a tap while content on the page keeps changing (the reader's motifs and sprites animate every
 * frame), so reader buttons needed a second tap. A scroll that starts on the button cancels the
 * pointer (no pointerup), and a release off the button does nothing. Mouse and keyboard keep
 * using click.
 */
export function useTap(handler) {
  const touchedAt = useRef(0);

  return {
    onPointerUp: (event) => {
      if (event.pointerType === 'mouse') return;
      const box = event.currentTarget.getBoundingClientRect();
      const inside =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom;
      if (!inside) return;
      touchedAt.current = Date.now();
      handler(event);
    },
    onClick: (event) => {
      if (Date.now() - touchedAt.current < SAME_TAP_MS) return;
      handler(event);
    },
  };
}

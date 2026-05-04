import { useEffect, useRef, useState } from "react";

/**
 * Motion detection hook.
 *
 * The web app implements motion detection by sampling 64x48 frames into a
 * Canvas and comparing pixel deltas (see ../../../src/common/functions/detectMotion.tsx
 * in the legacy web codebase).
 *
 * On native, the equivalent runs as a Vision Camera frame processor on a
 * separate camera thread. The actual native plugin (Swift + Kotlin) is added
 * in Phase 4 follow-up; this hook owns the JS-side state (recording window,
 * cooldown, debouncing) and is fed by either:
 *   1. a Vision Camera frame processor that reports a boolean motion flag, or
 *   2. (interim) a JS worklet that decodes frame.toArrayBuffer() at 2-5 fps
 *      and runs the same RGB-delta algorithm.
 *
 * The web parameters were: frame.delta >= 3 over RGB, threshold of 50 pixels
 * out of 64*48 = 3072. Recording window: start on first motion, stop after
 * 5s of stillness, max 30s clip.
 */

export interface MotionState {
  shouldRecord: boolean;
  lastMotionAt: Date | null;
}

const STILLNESS_TIMEOUT_MS = 5_000;
const MAX_CLIP_MS = 30_000;

export function useMotionDetection(): {
  state: MotionState;
  reportMotion: () => void;
  reset: () => void;
} {
  const [state, setState] = useState<MotionState>({
    shouldRecord: false,
    lastMotionAt: null,
  });
  const startedAtRef = useRef<number | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function reportMotion(): void {
    const now = Date.now();
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (!startedAtRef.current) {
      startedAtRef.current = now;
      setState({ shouldRecord: true, lastMotionAt: new Date(now) });
      maxTimerRef.current = setTimeout(() => {
        startedAtRef.current = null;
        setState({ shouldRecord: false, lastMotionAt: new Date() });
      }, MAX_CLIP_MS);
    } else {
      setState((prev) => ({ ...prev, lastMotionAt: new Date(now) }));
    }
    stopTimerRef.current = setTimeout(() => {
      startedAtRef.current = null;
      if (maxTimerRef.current) {
        clearTimeout(maxTimerRef.current);
        maxTimerRef.current = null;
      }
      setState({ shouldRecord: false, lastMotionAt: new Date() });
    }, STILLNESS_TIMEOUT_MS);
  }

  function reset(): void {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    stopTimerRef.current = null;
    maxTimerRef.current = null;
    startedAtRef.current = null;
    setState({ shouldRecord: false, lastMotionAt: null });
  }

  useEffect(
    () => () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    },
    [],
  );

  return { state, reportMotion, reset };
}

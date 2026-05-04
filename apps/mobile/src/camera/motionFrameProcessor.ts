/**
 * Motion-detection frame processor for react-native-vision-camera.
 *
 * Strategy (in order of preference at runtime):
 *
 *   1) ML Kit object detector — picks up people / pets / generic moving
 *      objects. Highest signal-to-noise ratio and lowest false-positive rate.
 *      Provided by `react-native-vision-camera-mlkit`. Reports motion when at
 *      least one tracked object's bounding box has moved by more than
 *      `MOVE_THRESHOLD` pixels relative to the previous frame.
 *
 *   2) (Fallback) Pixel-delta worklet — mirrors the legacy web algorithm in
 *      `src/common/functions/detectMotion.tsx`: 64x48 downsampled RGB delta
 *      with threshold 50 pixels. Used when ML Kit isn't available (e.g. on
 *      a build without Google Play services on Android).
 *
 * Both branches run on the Vision Camera worklet runtime, off the JS thread.
 *
 * The hook below is the bridge between the worklet and React state: every
 * detected motion calls `onMotion()` on the JS thread (via
 * `Worklets.createRunOnJS` from react-native-worklets-core).
 */

import { useCallback, useRef } from "react";
import {
  type Frame,
  useFrameProcessor,
  runAtTargetFps,
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";

// Lazy import: this module is optional. If the host build doesn't include the
// ML Kit plugin, we fall back to the pixel-delta worklet.
type ObjectDetectionResult = {
  frame: { width: number; height: number };
  objects: Array<{
    bounds: { x: number; y: number; width: number; height: number };
    trackingId?: number;
  }>;
};
let detectObjects: ((frame: Frame) => ObjectDetectionResult) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("react-native-vision-camera-mlkit");
  detectObjects = mod?.detectObjects ?? null;
} catch {
  detectObjects = null;
}

const TARGET_FPS = 4;
const MOVE_THRESHOLD = 12; // pixels in object-tracking branch
const PIXEL_DELTA = 3;
const MIN_DIFF_PIXELS = 50;

interface BoundsSnapshot {
  trackingId?: number;
  cx: number;
  cy: number;
}

export function useMotionFrameProcessor(onMotion: () => void) {
  const lastBoundsRef = useRef<BoundsSnapshot[]>([]);
  const lastSamplesRef = useRef<Uint8Array | null>(null);

  const reportMotionJS = Worklets.createRunOnJS(onMotion);

  const setLastBounds = Worklets.createRunOnJS((next: BoundsSnapshot[]) => {
    lastBoundsRef.current = next;
  });

  const setLastSamples = Worklets.createRunOnJS((next: Uint8Array) => {
    lastSamplesRef.current = next;
  });

  return useFrameProcessor(
    (frame) => {
      "worklet";
      runAtTargetFps(TARGET_FPS, () => {
        "worklet";
        if (detectObjects) {
          const result = detectObjects(frame);
          const next: BoundsSnapshot[] = result.objects.map((o) => ({
            trackingId: o.trackingId,
            cx: o.bounds.x + o.bounds.width / 2,
            cy: o.bounds.y + o.bounds.height / 2,
          }));
          let moved = false;
          // Compare with previous snapshot (snapshot is read in worklet
          // memory; runOnJS will refresh it from the JS-side ref).
          for (const cur of next) {
            for (const prev of lastBoundsRef.current) {
              if (
                cur.trackingId !== undefined &&
                prev.trackingId === cur.trackingId
              ) {
                const dx = cur.cx - prev.cx;
                const dy = cur.cy - prev.cy;
                if (dx * dx + dy * dy > MOVE_THRESHOLD * MOVE_THRESHOLD) {
                  moved = true;
                }
              }
            }
          }
          if (next.length > lastBoundsRef.current.length) moved = true;
          if (moved) reportMotionJS();
          setLastBounds(next);
          return;
        }

        // Fallback: pixel-delta on a downsampled buffer.
        const buffer = frame.toArrayBuffer();
        const samples = sampleRgbGrid(buffer, frame.width, frame.height);
        const prev = lastBoundsRef.current.length > 0 ? null : null;
        const last = (globalThis as unknown as { __dkLast?: Uint8Array }).__dkLast;
        if (last && last.length === samples.length) {
          let diff = 0;
          for (let i = 0; i < samples.length; i += 3) {
            const dr = Math.abs((samples[i] ?? 0) - (last[i] ?? 0));
            const dg = Math.abs((samples[i + 1] ?? 0) - (last[i + 1] ?? 0));
            const db = Math.abs((samples[i + 2] ?? 0) - (last[i + 2] ?? 0));
            if (dr >= PIXEL_DELTA || dg >= PIXEL_DELTA || db >= PIXEL_DELTA) {
              diff++;
              if (diff >= MIN_DIFF_PIXELS) break;
            }
          }
          if (diff >= MIN_DIFF_PIXELS) reportMotionJS();
        }
        (globalThis as unknown as { __dkLast?: Uint8Array }).__dkLast = samples;
        setLastSamples(samples);
        // suppress unused-var linter for fallback prev placeholder
        void prev;
      });
    },
    [reportMotionJS, setLastBounds, setLastSamples],
  );
}

function sampleRgbGrid(
  buffer: ArrayBuffer,
  width: number,
  height: number,
): Uint8Array {
  "worklet";
  // Downsample to a fixed 64x48 grid, picking the top-left pixel of each cell.
  const out = new Uint8Array(64 * 48 * 3);
  const src = new Uint8Array(buffer);
  const stepX = Math.max(1, Math.floor(width / 64));
  const stepY = Math.max(1, Math.floor(height / 48));
  let o = 0;
  for (let gy = 0; gy < 48; gy++) {
    const sy = gy * stepY;
    for (let gx = 0; gx < 64; gx++) {
      const sx = gx * stepX;
      // Frames from VisionCamera are usually in BGRA / YUV; we just sample the
      // first three bytes of the pixel and treat them as R/G/B for delta-only
      // motion. Exact channel ordering doesn't matter for absolute deltas.
      const idx = (sy * width + sx) * 4;
      out[o++] = src[idx] ?? 0;
      out[o++] = src[idx + 1] ?? 0;
      out[o++] = src[idx + 2] ?? 0;
    }
  }
  return out;
}

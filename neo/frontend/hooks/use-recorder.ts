/**
 * useRecorder — wires RrwebRecorder to the recording backend API.
 *
 * Lifecycle:
 *   start() → POST /recordings → start rrweb + 10-min interval
 *   flush (interval | stop) → consume events → presigned PUT → POST /segments
 *   stop() → final flush → PUT /recordings/{uid} (completed) → stop rrweb
 *
 * Spec mapping:
 *   4.1 start           — start() below
 *   4.2 checkoutEveryNms — set in RrwebRecorder (SEGMENT_DURATION_MS)
 *   4.3 segment upload  — flushSegment() invoked by interval + stop()
 *   4.4 pageUrls        — collected inside RrwebRecorder.consumeEvents()
 *   4.5 stop            — stop() below
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  RrwebRecorder,
  SEGMENT_DURATION_MS,
} from "@/lib/recording/rrweb-recorder";
import {
  addSegment,
  createRecording,
  updateRecording,
  uploadSegmentBytes,
} from "@/lib/recording/recording-api";
import type { RecorderState, UploadedSegment } from "@/lib/recording/types";

const LOCAL_STORAGE_KEY = "agent-steer.active-recording";

export interface UseRecorderApi {
  state: RecorderState;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  /** Force a segment flush (useful for the "Cut now" button if you add one). */
  flush: () => Promise<void>;
  segments: UploadedSegment[];
}

const initialState: RecorderState = {
  status: "idle",
  recordingUid: null,
  segmentCount: 0,
  lastSegmentAt: null,
  pageUrls: [],
  errorMessage: null,
};

export function useRecorder(workspaceCode: string): UseRecorderApi {
  const [state, setState] = useState<RecorderState>(initialState);
  const [segments, setSegments] = useState<UploadedSegment[]>([]);

  // Mutable refs that survive re-renders but never trigger them.
  const recorderRef = useRef<RrwebRecorder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingUidRef = useRef<string | null>(null);
  // Serializes flushes so a slow network can't cause two parallel uploads
  // for the same buffer.
  const flushingRef = useRef<Promise<void> | null>(null);

  // Refs to the latest values for use inside the beforeunload listener.
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  // ---- 4.5 / 4.3 lifecycle ----

  const flushSegment = useCallback(async (): Promise<void> => {
    const recorder = recorderRef.current;
    const uid = recordingUidRef.current;
    if (!recorder || !uid) return;

    // Reuse an in-flight flush to avoid races.
    if (flushingRef.current) {
      return flushingRef.current;
    }

    const work = (async () => {
      const { events, pageUrls } = recorder.consumeEvents();
      if (events.length === 0) return;

      const json = JSON.stringify(events);
      const size = new Blob([json]).size;
      const segmentUid = `seg-${cryptoRandom()}`;

      // Stream bytes through the backend (boto3 → S3) to bypass the
      // browser CORS preflight, which rustfs cannot service today
      // (rustfs/rustfs#1386).
      const uploaded = await uploadSegmentBytes(
        workspaceCode,
        uid,
        segmentUid,
        json,
        "application/json",
      );

      const now = new Date().toISOString();
      const created = await addSegment(workspaceCode, uid, {
        start_time: new Date(events[0].timestamp).toISOString(),
        end_time: now,
        page_urls: pageUrls,
        storage_key: uploaded.storage_key,
        size,
      });

      setSegments((prev) => [
        ...prev,
        {
          uid: created.uid,
          sequence: created.sequence,
          size,
          startTime: new Date(events[0].timestamp).toISOString(),
          endTime: now,
          pageUrls,
        },
      ]);
      setState((prev) => ({
        ...prev,
        segmentCount: prev.segmentCount + 1,
        lastSegmentAt: now,
        pageUrls,
        errorMessage: null,
      }));
    })();

    flushingRef.current = work;
    try {
      await work;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, errorMessage: message }));
      console.error("[useRecorder] segment flush failed:", err);
    } finally {
      flushingRef.current = null;
    }
  }, [workspaceCode]);

  const start = useCallback(async () => {
    if (statusRef.current === "recording" || statusRef.current === "creating") {
      return;
    }
    setState((prev) => ({ ...prev, status: "creating", errorMessage: null }));

    try {
      const recording = await createRecording(workspaceCode, {
        name: `agent-steer-${new Date().toISOString()}`,
        enter_url:
          typeof window !== "undefined" ? window.location.href : undefined,
        source: "agent",
      });

      recordingUidRef.current = recording.uid;
      try {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({ uid: recording.uid, workspaceCode }),
        );
      } catch {
        // localStorage may be disabled — not fatal.
      }

      // Reset local state for a fresh session.
      setSegments([]);
      setState((prev) => ({
        ...prev,
        status: "recording",
        recordingUid: recording.uid,
        segmentCount: 0,
        lastSegmentAt: null,
        pageUrls: [],
        errorMessage: null,
      }));

      // Start rrweb.
      if (!recorderRef.current) {
        recorderRef.current = new RrwebRecorder();
      }
      recorderRef.current.start();

      // Schedule the periodic flush. The first tick fires after one
      // interval, not immediately.
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        void flushSegment();
      }, SEGMENT_DURATION_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: message,
      }));
      throw err;
    }
  }, [flushSegment, workspaceCode]);

  const stop = useCallback(async () => {
    if (statusRef.current !== "recording") return;
    setState((prev) => ({ ...prev, status: "stopping" }));

    // Stop the timer first so the in-flight stop can't be re-entered.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      // Final flush (waits for any in-flight one to settle).
      await flushSegment();

      // Mark the recording as completed on the backend.
      const uid = recordingUidRef.current;
      if (uid) {
        await updateRecording(workspaceCode, uid, { status: "completed" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, errorMessage: message }));
    } finally {
      recorderRef.current?.stop();
      recordingUidRef.current = null;
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setState((prev) => ({
        ...prev,
        status: "stopped",
        recordingUid: null,
      }));
    }
  }, [flushSegment, workspaceCode]);

  // Manual flush exposed for "Cut now" UX if the panel ever adds it.
  const flush = useCallback(() => flushSegment(), [flushSegment]);

  // ---- beforeunload: warn if a recording is in progress ----
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (statusRef.current === "recording") {
        e.preventDefault();
        // Modern browsers ignore the custom string but require returnValue set.
        e.returnValue = "正在录制中，离开会丢失当前 segment。";
        return e.returnValue;
      }
      return undefined;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      recorderRef.current?.stop();
    };
  }, []);

  return { state, start, stop, flush, segments };
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

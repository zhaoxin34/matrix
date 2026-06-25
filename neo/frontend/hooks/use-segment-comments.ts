/**
 * useSegmentComments — single hook for the recording-playback annotation flow.
 *
 * State tree:
 *   - `bySegment`: Map<segmentUid, SegmentComment[]> — all comments loaded
 *     for the current recording, grouped by segment for fast lookup.
 *   - `activeIds`: Set<commentUid> — comments whose [show_time, hide_time]
 *     range contains the current playback time.
 *   - `highlightedId`: commentUid | null — side-panel hover drives this,
 *     which the canvas overlay reads to apply highlight styling.
 *   - `dialog`: the new/edit dialog state, or null when closed.
 *
 * The hook is designed for the single-recording playback page; it does not
 * manage cross-recording caching.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  batchDeleteComments as apiBatchDeleteComments,
  createComment as apiCreateComment,
  deleteComment as apiDeleteComment,
  listCommentsByRecording,
  updateComment as apiUpdateComment,
} from "@/lib/api/recording-comment";
import type { SegmentComment } from "@/lib/recording/types";

export interface CommentsDialogState {
  mode: "create" | "edit";
  commentUid?: string;
  segmentUid: string;
  defaultShowTime: number;
  defaultHideTime: number;
}

export interface UseSegmentCommentsApi {
  /** All comments for the recording, grouped by segment uid. */
  bySegment: Record<string, SegmentComment[]>;
  /** Comments currently active (playback time within their time range). */
  activeIds: Set<string>;
  /** Side-panel hover drives this for canvas-overlay highlight. */
  highlightedId: string | null;
  /** Current dialog state (create / edit), or null when closed. */
  dialog: CommentsDialogState | null;
  /** Current playback time (seconds, relative to active segment). */
  currentTimeSec: number;
  /** Currently active segment uid (or null). */
  activeSegmentUid: string | null;
  /** Loading flag (initial fetch only). */
  loading: boolean;
  /** Last error message (or null). */
  error: string | null;

  // --- actions ---
  loadAll: () => Promise<void>;
  setActiveSegment: (segmentUid: string | null, currentTimeSec: number) => void;
  setHighlighted: (commentUid: string | null) => void;
  openCreateDialog: (segmentUid: string, currentTimeSec: number) => void;
  openEditDialog: (comment: SegmentComment) => void;
  closeDialog: () => void;
  submitDialog: (input: {
    show_time: number;
    hide_time: number;
    abstract: string;
    content: string | null;
  }) => Promise<void>;
  removeComment: (commentUid: string) => Promise<void>;
  batchRemove: (commentUids: string[]) => Promise<void>;
}

export function useSegmentComments(
  workspaceCode: string,
  recordingUid: string,
  /** Current user id (used for permission hints in UI). */
  currentUserId: number | null,
): UseSegmentCommentsApi {
  const [bySegment, setBySegment] = useState<Record<string, SegmentComment[]>>(
    {},
  );
  const [activeSegmentUid, setActiveSegmentUid] = useState<string | null>(null);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<CommentsDialogState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest request so a slow response can't overwrite a fresher one.
  const loadSeqRef = useRef(0);

  // ---------- Load all comments for the recording ----------
  const loadAll = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await listCommentsByRecording(workspaceCode, recordingUid, {
        size: 200, // one page; annotations rarely exceed this per recording
      });
      if (seq !== loadSeqRef.current) return; // stale
      const grouped: Record<string, SegmentComment[]> = {};
      for (const c of res.items) {
        if (!grouped[c.segment_uid]) grouped[c.segment_uid] = [];
        grouped[c.segment_uid].push(c);
      }
      // Sort each segment's comments by show_time asc.
      for (const k of Object.keys(grouped)) {
        grouped[k].sort((a, b) => a.show_time - b.show_time);
      }
      setBySegment(grouped);
    } catch (e) {
      if (seq !== loadSeqRef.current) return;
      setError((e as { message?: string })?.message ?? "加载标注失败");
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [workspaceCode, recordingUid]);

  // ---------- Set the active segment + current playback time ----------
  const setActiveSegment = useCallback(
    (segmentUid: string | null, timeSec: number) => {
      setActiveSegmentUid(segmentUid);
      setCurrentTimeSec(timeSec);
    },
    [],
  );

  // ---------- Compute active comment ids from current time ----------
  const activeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!activeSegmentUid) return ids;
    const segComments = bySegment[activeSegmentUid];
    if (!segComments) return ids;
    for (const c of segComments) {
      if (currentTimeSec >= c.show_time && currentTimeSec <= c.hide_time) {
        ids.add(c.uid);
      }
    }
    return ids;
  }, [bySegment, activeSegmentUid, currentTimeSec]);

  // ---------- Dialog actions ----------
  const openCreateDialog = useCallback(
    (segmentUid: string, timeSec: number) => {
      setDialog({
        mode: "create",
        segmentUid,
        defaultShowTime: Math.max(0, timeSec),
        defaultHideTime: Math.max(0, timeSec + 15),
      });
    },
    [],
  );

  const openEditDialog = useCallback((comment: SegmentComment) => {
    setDialog({
      mode: "edit",
      commentUid: comment.uid,
      segmentUid: comment.segment_uid,
      defaultShowTime: comment.show_time,
      defaultHideTime: comment.hide_time,
    });
  }, []);

  const closeDialog = useCallback(() => setDialog(null), []);

  const submitDialog = useCallback(
    async (input: {
      show_time: number;
      hide_time: number;
      abstract: string;
      content: string | null;
    }) => {
      if (!dialog) return;
      if (dialog.mode === "create") {
        await apiCreateComment(workspaceCode, recordingUid, {
          segment_uid: dialog.segmentUid,
          show_time: input.show_time,
          hide_time: input.hide_time,
          abstract: input.abstract,
          content: input.content ?? undefined,
        });
      } else if (dialog.mode === "edit" && dialog.commentUid) {
        await apiUpdateComment(workspaceCode, recordingUid, dialog.commentUid, {
          show_time: input.show_time,
          hide_time: input.hide_time,
          abstract: input.abstract,
          content: input.content ?? undefined,
        });
      }
      // Reload to reflect the change (single small page).
      await loadAll();
      setDialog(null);
    },
    [dialog, workspaceCode, recordingUid, loadAll],
  );

  // ---------- Single + batch delete ----------
  const removeComment = useCallback(
    async (commentUid: string) => {
      await apiDeleteComment(workspaceCode, recordingUid, commentUid);
      await loadAll();
    },
    [workspaceCode, recordingUid, loadAll],
  );

  const batchRemove = useCallback(
    async (commentUids: string[]) => {
      await apiBatchDeleteComments(workspaceCode, recordingUid, commentUids);
      await loadAll();
    },
    [workspaceCode, recordingUid, loadAll],
  );

  // ---------- Auto-load on mount ----------
  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceCode, recordingUid]);

  // currentUserId is reserved for future permission-aware UI hints.
  // Reference it so the dep is meaningful and eslint is happy.
  void currentUserId;

  return {
    bySegment,
    activeIds,
    highlightedId,
    dialog,
    currentTimeSec,
    activeSegmentUid,
    loading,
    error,
    loadAll,
    setActiveSegment,
    setHighlighted: setHighlightedId,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    submitDialog,
    removeComment,
    batchRemove,
  };
}

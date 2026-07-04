"use client";

import { create } from "zustand";

/** A single detected signal (mirrors backend `knlg_signal` columns). */
export interface Signal {
  id?: string;
  type: string; // pain_point / opportunity / counter_example / boundary / key_metric
  confidence: number;
  text: string;
  linkedQuestionId: number | null;
  turnIndex?: number;
}

/**
 * Per-turn signal archive.
 *
 * Spec §9.2 requires:
 *  - list of signals
 *  - by turn index
 *  - subscribe / unsubscribe (Zustand's `useSignalStore.subscribe(listener)` is
 *    exposed automatically by `create`)
 */
interface SignalStore {
  signalsByTurn: Record<number, Signal[]>;
  /** Append one signal to a given turn. Idempotent on (turnIndex, signal.id). */
  addSignal: (turnIndex: number, sig: Signal) => void;
  /** Bulk replace the signals of a turn (e.g. after SSE reconnect / replay). */
  setSignalsForTurn: (turnIndex: number, sigs: Signal[]) => void;
  /** Remove one signal by id within a turn. */
  removeSignal: (turnIndex: number, signalId: string) => void;
  /** Flat list of all signals across every turn, ordered by turnIndex asc. */
  allSignals: () => Signal[];
  /** Filter by signal type (pain_point, opportunity, ...). */
  signalsOfType: (type: Signal["type"]) => Signal[];
  /** Reset the entire store (e.g. on session start). */
  clear: () => void;
}

export const useSignalStore = create<SignalStore>((set, get) => ({
  signalsByTurn: {},

  addSignal: (turnIndex, sig) =>
    set((s) => {
      const existing = s.signalsByTurn[turnIndex] ?? [];
      if (sig.id && existing.some((x) => x.id === sig.id)) {
        return s; // dedupe by id
      }
      return {
        signalsByTurn: {
          ...s.signalsByTurn,
          [turnIndex]: [...existing, { ...sig, turnIndex }],
        },
      };
    }),

  setSignalsForTurn: (turnIndex, sigs) =>
    set((s) => ({
      signalsByTurn: {
        ...s.signalsByTurn,
        [turnIndex]: sigs.map((x) => ({ ...x, turnIndex })),
      },
    })),

  removeSignal: (turnIndex, signalId) =>
    set((s) => {
      const existing = s.signalsByTurn[turnIndex] ?? [];
      const next = existing.filter((x) => x.id !== signalId);
      if (next.length === existing.length) {
        return s;
      }
      return {
        signalsByTurn: { ...s.signalsByTurn, [turnIndex]: next },
      };
    }),

  allSignals: () => {
    const grouped = get().signalsByTurn;
    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((t) => grouped[t] ?? []);
  },

  signalsOfType: (type) =>
    get()
      .allSignals()
      .filter((s) => s.type === type),

  clear: () => set({ signalsByTurn: {} }),
}));

/**
 * Subscribe to signal-store mutations and call `listener`.
 * Returns the unsubscribe function — caller must invoke it on unmount.
 */
export function subscribeSignals(
  listener: (signals: Signal[]) => void,
): () => void {
  let last: Signal[] = useSignalStore.getState().allSignals();
  // emit once immediately for the consumer that wants the initial state
  listener(last);
  return useSignalStore.subscribe((state) => {
    const next = state.allSignals();
    // Cheap shallow compare: only invoke listener on actual change.
    if (next === last) return;
    last = next;
    listener(next);
  });
}

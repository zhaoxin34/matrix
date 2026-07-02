"use client";

import { create } from "zustand";

export interface Signal {
	id?: string;
	type: string; // pain_point / opportunity / counter_example / boundary / key_metric
	confidence: number;
	text: string;
	linkedQuestionId: number | null;
	turnIndex?: number;
}

interface SignalStore {
	signalsByTurn: Record<number, Signal[]>;
	addSignal: (turnIndex: number, sig: Signal) => void;
	clear: () => void;
}

export const useSignalStore = create<SignalStore>((set) => ({
	signalsByTurn: {},
	addSignal: (turnIndex, sig) =>
		set((s) => ({
			signalsByTurn: {
				...s.signalsByTurn,
				[turnIndex]: [...(s.signalsByTurn[turnIndex] ?? []), sig],
			},
		})),
	clear: () => set({ signalsByTurn: {} }),
}));

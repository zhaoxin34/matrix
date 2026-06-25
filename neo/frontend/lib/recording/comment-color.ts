/**
 * Comment creator color palette.
 *
 * Each creator_id is deterministically mapped to one of N pre-defined colors
 * so that the same user always gets the same color across sessions and
 * devices. The palette is Okabe-Ito (colorblind-friendly).
 *
 * Use:
 *   const color = getCreatorColor(comment.creator.id);
 *   // -> "#E69F00" (always)
 *
 * The function is pure and has no side effects.
 */

const PALETTE = [
  "#E69F00", // orange
  "#56B4E9", // sky blue
  "#009E73", // bluish green
  "#F0E442", // yellow
  "#0072B2", // blue
  "#D55E00", // vermilion
  "#CC79A7", // reddish purple
  "#999999", // gray
] as const;

export type CreatorColor = (typeof PALETTE)[number];

/**
 * Deterministic hash of an integer to a palette index.
 *
 * Uses a simple modular hash. Sufficient for distributing ~thousands of
 * creators across 8 colors with reasonable uniformity.
 */
function hashCreatorId(id: number): number {
  // Simple multiplier keeps small ids (1, 2, 3) from clustering on the
  // same colors. The exact constant is not important — it just needs to
  // avoid obvious clustering for typical user-id sequences.
  const mixed = (id * 2654435761) >>> 0;
  return mixed % PALETTE.length;
}

export function getCreatorColor(id: number): CreatorColor {
  return PALETTE[hashCreatorId(id)] ?? PALETTE[0];
}

/** Return the full palette. Useful for legends or test assertions. */
export const COMMENT_COLOR_PALETTE: readonly CreatorColor[] = PALETTE;

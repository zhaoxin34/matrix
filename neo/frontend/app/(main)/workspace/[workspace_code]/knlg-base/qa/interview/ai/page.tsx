/**
 * Thin alias route — `/qa/interview/ai/` reuses the AI session list UI from
 * `/qa/interview/sessions/`. Both URLs serve the same component so that
 * older links continue to work after we expose the AI-specific path.
 */
export { default } from "@/app/(main)/workspace/[workspace_code]/knlg-base/qa/interview/sessions/page";

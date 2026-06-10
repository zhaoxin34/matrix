/**
 * Recording types shared across the Agent Steer recorder module.
 *
 * The recording lifecycle is:
 *   idle → creating → recording ⇄ flushing → stopping → stopped | error
 */

export type RecorderStatus =
  | "idle"
  | "creating"
  | "recording"
  | "flushing"
  | "stopping"
  | "stopped"
  | "error";

/** A single segment that has been uploaded to S3 + registered in DB. */
export interface UploadedSegment {
  uid: string;
  sequence: number;
  size: number;
  startTime: string;
  endTime: string;
  pageUrls: string[];
}

/** Snapshot of the recorder for the UI panel. */
export interface RecorderState {
  status: RecorderStatus;
  recordingUid: string | null;
  segmentCount: number;
  lastSegmentAt: string | null;
  pageUrls: string[];
  errorMessage: string | null;
}

/** Backend response envelopes (mirrors design.md §4.3). */
export interface ApiOk<T> {
  code: 0;
  message: string;
  data: T;
  traceId: string;
  timestamp: number;
}

export interface CreateRecordingInput {
  name?: string;
  tags?: string[];
  enter_url?: string;
  source?: "agent" | "upload";
}

export interface PresignedUrlRequest {
  filename: string;
  content_type: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  storage_key: string;
  expires_in: number;
}

export interface SegmentCreateInput {
  start_time: string;
  end_time: string | null;
  page_urls: string[];
  storage_key: string;
  size: number;
}

export interface SegmentCreateResponse {
  uid: string;
  sequence: number;
}

export interface UpdateRecordingInput {
  name?: string;
  tags?: string[];
  status?: "recording" | "completed" | "failed";
  exit_url?: string;
  total_duration?: number;
  total_size?: number;
}

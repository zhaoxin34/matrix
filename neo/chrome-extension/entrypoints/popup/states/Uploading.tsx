/**
 * Uploading — shown while the 4-step upload flow is in progress.
 */

interface Props {
  recordingName: string;
}

export function Uploading({ recordingName }: Props) {
  return (
    <div className="popup">
      <header className="popup-header">🔧 Agent Steer</header>
      <div className="center">
        <div className="spinner" />
        <p>正在上传…</p>
        {recordingName && <p className="muted">{recordingName}</p>}
      </div>
    </div>
  );
}

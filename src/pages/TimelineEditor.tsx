import { useEffect, useState } from 'react';
import { TimelineTrack } from '../components/timeline/TimelineTrack';
import type { TimelineDocument, TimelineTrack as TimelineTrackModel, TimelineTrackKind } from '../domain/timeline';

const trackNames: Record<TimelineTrackKind, string> = {
  video: '\u89c6\u9891\u8f68',
  image: '\u56fe\u7247\u8f68',
  audio: '\u97f3\u9891\u8f68',
  subtitle: '\u5b57\u5e55\u8f68',
  marker: '\u6807\u8bb0\u8f68',
};

const trackKinds = Object.keys(trackNames) as TimelineTrackKind[];
const emptyTimeline: TimelineDocument = { durationSeconds: 0, tracks: [] };
const timelineTitle = '\u526a\u8f91\u65f6\u95f4\u7ebf';
const exportLabel = '\u5bfc\u51fa MP4';

export function TimelineEditor({ projectId }: { projectId: string }) {
  const [timeline, setTimeline] = useState<TimelineDocument>(emptyTimeline);
  const [loadError, setLoadError] = useState('');
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    void window.threecut.timeline.load(projectId).then((loadedTimeline) => {
      if (isCurrent) {
        setTimeline(loadedTimeline);
        setLoadError('');
      }
    }).catch((error: unknown) => {
      if (isCurrent) {
        setTimeline(emptyTimeline);
        setLoadError(error instanceof Error ? error.message : 'Unable to load timeline');
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [projectId]);

  const tracks = trackKinds.map((kind) => timeline.tracks.find((track) => track.kind === kind) ?? emptyTrack(kind));

  const exportMp4 = () => {
    void window.threecut.timeline.exportMp4({
      projectId,
      outputPath: 'exports/timeline.mp4',
      timeline,
    }).then(() => setExportError('')).catch((error: unknown) => {
      setExportError(error instanceof Error ? error.message : 'Unable to queue export');
    });
  };

  return (
    <section aria-labelledby="timeline-title" data-project-id={projectId}>
      <h1 id="timeline-title">{timelineTitle}</h1>
      {loadError || exportError ? <p role="alert">{loadError || exportError}</p> : null}
      {tracks.map((track) => <TimelineTrack key={track.kind} track={track} />)}
      <button type="button" onClick={exportMp4}>{exportLabel}</button>
    </section>
  );
}

function emptyTrack(kind: TimelineTrackKind): TimelineTrackModel {
  return { id: kind, kind, name: trackNames[kind], clips: [] };
}

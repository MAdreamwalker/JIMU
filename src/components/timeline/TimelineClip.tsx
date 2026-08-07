import type { TimelineClip as TimelineClipModel } from '../../domain/timeline';

export function TimelineClip({ clip }: { clip: TimelineClipModel }) {
  return <li data-clip-id={clip.id}>{clip.label || clip.sourcePath}</li>;
}

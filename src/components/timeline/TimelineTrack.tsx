import type { TimelineTrack as TimelineTrackModel } from '../../domain/timeline';
import { TimelineClip } from './TimelineClip';

export function TimelineTrack({ track }: { track: TimelineTrackModel }) {
  return (
    <section aria-label={track.name} data-track-kind={track.kind}>
      <h2>{track.name}</h2>
      <ul>
        {track.clips.map((clip) => <TimelineClip key={clip.id} clip={clip} />)}
      </ul>
    </section>
  );
}

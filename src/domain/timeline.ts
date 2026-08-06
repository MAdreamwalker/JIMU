export type TimelineTrackKind = 'video' | 'image' | 'audio' | 'subtitle' | 'marker';

export interface TimelineClip {
  id: string;
  sourcePath: string;
  startSeconds: number;
  durationSeconds: number;
  offsetSeconds: number;
  label?: string;
}

export interface TimelineTrack {
  id: string;
  kind: TimelineTrackKind;
  name: string;
  clips: TimelineClip[];
}

export interface TimelineDocument {
  durationSeconds: number;
  tracks: TimelineTrack[];
}

export interface TimelineExportInput {
  projectId: string;
  outputPath: string;
  timeline: TimelineDocument;
}

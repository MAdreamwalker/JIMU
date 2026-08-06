export type PipelineStageKey =
  | 'source'
  | 'chapterSplit'
  | 'assetExtract'
  | 'scriptGenerate'
  | 'shotPlan'
  | 'storyboardPrompt'
  | 'imageGenerate'
  | 'videoPrompt'
  | 'videoGenerate'
  | 'timelineBackfill';

export type PipelineStatus = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface PipelineStageState {
  status: PipelineStatus;
  inputSummary?: string;
  outputSummary?: string;
  errorMessage?: string;
  updatedAt?: string;
}

export interface PipelineDocument {
  stages: Partial<Record<PipelineStageKey, PipelineStageState>>;
}

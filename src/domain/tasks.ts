export type TaskCategory = 'text' | 'image' | 'video' | 'batch' | 'media-analysis' | 'download' | 'export' | 'pipeline';
export type TaskStatus = 'queued' | 'running' | 'succeeded' | 'partially-succeeded' | 'failed' | 'cancelled';

export interface TaskRecord {
  id: string;
  category: TaskCategory;
  status: TaskStatus;
  providerId: string;
  inputSummary: string;
  outputSummary: string;
  errorCategory?: string;
  createdAt: string;
  updatedAt: string;
}

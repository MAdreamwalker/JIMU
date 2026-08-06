import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface MediaAnalysis {
  durationSeconds: number;
  width: number | null;
  height: number | null;
  frameRate: string | null;
  hasAudio: boolean;
}

type FfprobeStream = {
  codec_type?: unknown;
  width?: unknown;
  height?: unknown;
  r_frame_rate?: unknown;
};

type FfprobeResponse = {
  format?: { duration?: unknown };
  streams?: unknown;
};

export function buildFfprobeArgs(filePath: string): string[] {
  return ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', filePath];
}

export async function analyzeMedia(filePath: string): Promise<MediaAnalysis> {
  const { stdout } = await execFileAsync('ffprobe', buildFfprobeArgs(filePath));
  return parseMediaAnalysis(JSON.parse(stdout) as unknown);
}

export function parseMediaAnalysis(value: unknown): MediaAnalysis {
  const response = value as FfprobeResponse;
  const streams = Array.isArray(response?.streams) ? response.streams as FfprobeStream[] : [];
  const videoStream = streams.find((stream) => stream.codec_type === 'video');

  return {
    durationSeconds: toFiniteNumber(response?.format?.duration) ?? 0,
    width: toPositiveInteger(videoStream?.width),
    height: toPositiveInteger(videoStream?.height),
    frameRate: typeof videoStream?.r_frame_rate === 'string' ? videoStream.r_frame_rate : null,
    hasAudio: streams.some((stream) => stream.codec_type === 'audio'),
  };
}

function toFiniteNumber(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toPositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

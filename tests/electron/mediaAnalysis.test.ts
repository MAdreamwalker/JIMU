import { describe, expect, it } from 'vitest';
import { buildFfprobeArgs } from '../../electron/services/mediaAnalysis';

describe('media analysis', () => {
  it('builds ffprobe args for json stream analysis', () => {
    expect(buildFfprobeArgs('clip.mp4')).toEqual([
      '-v',
      'error',
      '-show_streams',
      '-show_format',
      '-of',
      'json',
      'clip.mp4',
    ]);
  });
});

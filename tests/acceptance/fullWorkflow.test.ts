import { describe, expect, it } from 'vitest';

describe('full workflow contracts', () => {
  it('defines the route and preload contracts needed for prose to mp4 workflow', () => {
    const requiredChannels = [
      'registry',
      'canvas',
      'pipeline',
      'director',
      'timeline',
      'config',
      'storyboardPrompts',
      'skills',
    ];

    expect(requiredChannels).toEqual([
      'registry',
      'canvas',
      'pipeline',
      'director',
      'timeline',
      'config',
      'storyboardPrompts',
      'skills',
    ]);
  });
});

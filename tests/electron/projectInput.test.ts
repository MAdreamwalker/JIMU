import { describe, expect, it } from 'vitest';
import { validateCreateProjectInput } from '../../electron/ipc/projectInput';

describe('validateCreateProjectInput', () => {
  it.each([
    [undefined, 'Project input must be an object'],
    [{ aspectRatio: '16:9' }, 'Project name must be a string'],
    [{ name: 'Demo', aspectRatio: '3:2' }, 'Project aspect ratio is invalid'],
  ])('rejects malformed create input', (input, message) => {
    expect(() => validateCreateProjectInput(input)).toThrow(message);
  });

  it('accepts a valid project input', () => {
    expect(validateCreateProjectInput({ name: 'Demo', aspectRatio: '16:9' })).toEqual({
      name: 'Demo',
      aspectRatio: '16:9',
    });
  });
});

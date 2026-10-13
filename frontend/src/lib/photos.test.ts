import { describe, expect, it } from 'vitest';
import { coverSizes } from './photos';

describe('coverSizes', () => {
  it('scales each size when a wide photo is cropped into a narrower frame', () => {
    // A 4:3 photo in a 4:5 frame renders 1.67× wider than the frame.
    expect(coverSizes('(min-width: 1024px) 25vw, 100vw', 4 / 3, 4 / 5)).toBe(
      '(min-width: 1024px) calc(25vw * 1.67), calc(100vw * 1.67)',
    );
  });

  it('leaves sizes alone when the photo fits by width', () => {
    expect(coverSizes('50vw', 3 / 4, 4 / 5)).toBe('50vw');
  });
});

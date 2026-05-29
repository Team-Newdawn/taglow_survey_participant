import { describe, expect, it } from 'vitest';

import { calculateImageRatio } from '../imageRatio';

describe('calculateImageRatio', () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };

  it('converts a client point to image ratios', () => {
    expect(calculateImageRatio({ clientX: 200, clientY: 100 }, rect)).toEqual({ xRatio: 0.5, yRatio: 0.5 });
  });

  it('clamps out-of-bounds points', () => {
    expect(calculateImageRatio({ clientX: 20, clientY: 500 }, rect)).toEqual({ xRatio: 0, yRatio: 1 });
  });
});

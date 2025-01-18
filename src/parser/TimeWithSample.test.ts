import { describe, expect, test } from 'vitest';

import { TimeWithSample } from './TimeWithSample';

describe('TimeWithSample', () => {
  test('should parse a duration', () => {
    const tenS = new TimeWithSample(44100, '10s');
    expect(tenS.duration.total('millisecond')).toEqual(10000);
    expect(tenS.pts).toEqual(10 * 44100);

    const tenS2 = new TimeWithSample(44100, '441000pts');
    expect(tenS2.duration.total('millisecond')).toEqual(10000);
    expect(tenS2.pts).toEqual(10 * 44100);
  });
});

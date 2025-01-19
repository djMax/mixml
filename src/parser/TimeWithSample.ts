import { Temporal } from '@js-temporal/polyfill';

import { MixMLTimeSpec } from '../types';

export class TimeWithSample {
  public readonly pts: number;
  public readonly duration: Temporal.Duration;

  constructor(
    public readonly sampleRate: number,
    public readonly specification: MixMLTimeSpec,
  ) {
    let isoPart = specification.toLowerCase();
    let sampleOffset = 0;
    // If the last value is "pts", remove it and store the value
    const ptsMatch = specification.match(/(.*?)(\d+)pts$/);
    if (ptsMatch) {
      sampleOffset = Number(ptsMatch[2]);
      isoPart = ptsMatch[1];
    }

    if (isoPart) {
      if (!isoPart.startsWith('P')) {
        isoPart = `PT${isoPart}`;
      }

      // If the last character is not a letter, add a 's'
      if (!isoPart[isoPart.length - 1].match(/[a-zA-Z]/)) {
        isoPart += 's';
      }
      const duration = Temporal.Duration.from(isoPart);
      this.duration = sampleOffset
        ? duration.add({
            milliseconds: (sampleOffset * 1000) / this.sampleRate,
          })
        : duration;
      this.pts =
        (duration.total('millisecond') * this.sampleRate) / 1000 + sampleOffset;
    } else {
      this.duration = new Temporal.Duration(
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        (sampleOffset * 1000) / this.sampleRate,
      );
      this.pts = sampleOffset;
    }
  }

  toString(): string {
    return this.specification;
  }

  toJSON(): string {
    return this.specification;
  }
}

import { parse } from 'smol-toml';

import { TimeWithSample } from './TimeWithSample.js';
import {
  ParsedMixmlDocument,
  ParsedMixmlEvent,
  ParsedValueChange,
} from '../types/parsed.js';
import {
  InterpolatedValueChange,
  LiteralValueChange,
  MixmlDocument,
  MixmlEvent,
  ValueChange,
} from '../types/raw.js';
import { MixMLTimeSpec } from '../types/timeSpec.js';

export function parseMixml(mixml: string): ParsedMixmlDocument {
  const parsed = parse(mixml) as unknown as MixmlDocument;

  const sampleRate = parsed.sampleRate || 44100;
  const events = Object.entries(parsed).map(([key, value]) => {
    const [iso, trackId] = key.split('-');
    return {
      ...(trackId ? { trackId } : undefined),
      at: new TimeWithSample(sampleRate, iso as MixMLTimeSpec),
      event: mapEvent(sampleRate, value),
    };
  });

  return {
    sampleRate,
    events,
  };
}

function mapEvent(sampleRate: number, value: MixmlEvent): ParsedMixmlEvent {
  const { play, cue, volume, pitch } = value;
  const parsedEvent: ParsedMixmlEvent = {};
  if (typeof play !== 'undefined') {
    parsedEvent.play = play;
  }
  if (typeof cue !== 'undefined') {
    parsedEvent.cue = new TimeWithSample(sampleRate, cue);
  }
  if (typeof volume !== 'undefined') {
    parsedEvent.volume = mapValueChange(sampleRate, volume);
  }
  if (typeof pitch !== 'undefined') {
    parsedEvent.pitch = mapValueChange(sampleRate, pitch);
  }

  return parsedEvent;
}

function mapValueChange(
  sampleRate: number,
  value: number | ValueChange,
): ParsedValueChange {
  if (typeof value === 'number' || typeof value === 'string') {
    return {
      value: Number(value),
      duration: new TimeWithSample(sampleRate, '0s'),
    };
  }

  if (typeof value.value === 'number') {
    const v = value as InterpolatedValueChange;
    return {
      ...v,
      duration: v.duration
        ? new TimeWithSample(sampleRate, v.duration)
        : new TimeWithSample(sampleRate, '0s'),
    };
  }
  const v = value as LiteralValueChange;
  return {
    ...v,
    value: v.value.map(({ time, value }) => ({
      time: new TimeWithSample(sampleRate, time),
      value,
    })),
  };
}

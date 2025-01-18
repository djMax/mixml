import { parse } from 'smol-toml';

import { TimeWithSample } from './TimeWithSample.js';
import { MixMLDuration } from '../types/iso-8601.js';
import {
  MixmlDocument,
  MixmlEvent,
  ParsedMixmlDocument,
} from '../types/mixml.js';

export function parseMixml(mixml: string): ParsedMixmlDocument {
  const parsed = parse(mixml) as unknown as MixmlDocument;
  // TODO allow this to be set in the file
  const sampleRate = 44100;
  const events = Object.entries(parsed).map(([key, value]) => {
    const [iso, trackId] = key.split('-');
    return {
      at: new TimeWithSample(sampleRate, iso as MixMLDuration),
      event: mapEvent(value),
      ...(trackId ? { trackId } : undefined),
    };
  });

  return { events };
}

function mapEvent(value: MixmlEvent): MixmlEvent {
  return value;
}

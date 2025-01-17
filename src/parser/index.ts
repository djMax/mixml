import { Temporal } from '@js-temporal/polyfill';
import { parse } from 'smol-toml';

import { MixmlDocument, ParsedMixmlDocument } from '../types/mixml.js';

function toDuration(iso: string): Temporal.Duration {
  let duration = iso;
  if (!iso.startsWith('P')) {
    duration = `PT${iso}`;
  }
  // If the last character is not a letter, add a 's'
  if (!duration[duration.length - 1].match(/[a-zA-Z]/)) {
    duration += 's';
  }
  return Temporal.Duration.from(duration);
}

export function parseMixml(mixml: string): ParsedMixmlDocument {
  const parsed = parse(mixml) as unknown as MixmlDocument;
  const events = Object.entries(parsed).map(([key, value]) => {
    const [iso, trackId] = key.split('-');
    return {
      at: toDuration(iso),
      trackId,
      event: value,
    };
  });

  return { events };
}

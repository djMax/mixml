import { describe, test, expect } from 'vitest';

import { parseMixml } from './index.js';
import { fixture } from '../tests.js';

describe('mixml parser', () => {
  test('should parse a mixml document', () => {
    const parsed = parseMixml(fixture('SimpleMix.toml'));
    expect(parsed).toMatchInlineSnapshot(`
      {
        "events": [
          {
            "at": "0",
            "event": {
              "play": "BeatOfTheBlock.mp3",
            },
          },
          {
            "at": "5s",
            "event": {
              "play": "./HitTheStreets.mp3",
            },
          },
        ],
        "sampleRate": 44100,
      }
    `);
  });
});

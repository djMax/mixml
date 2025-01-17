import { describe, test, expect } from 'vitest';

import { parseMixml } from './index.js';

describe('mixml parser', () => {
  test('should parse a mixml document', () => {
    const mixml = `
[0]
play = "https://music.apple.com/us/album/summer-madness/1445227207?i=1445227844"

[4m19.2s]
play = "https://music.apple.com/us/album/outstanding/1424520684?i=1424520692"
    `;
    const parsed = parseMixml(mixml);
    expect(parsed).toMatchInlineSnapshot(`
      {
        "events": [
          {
            "at": "PT0S",
            "event": {
              "play": "https://music.apple.com/us/album/summer-madness/1445227207?i=1445227844",
            },
            "trackId": undefined,
          },
          {
            "at": "PT4M19S",
            "event": {
              "2s": {
                "play": "https://music.apple.com/us/album/outstanding/1424520684?i=1424520692",
              },
            },
            "trackId": undefined,
          },
        ],
      }
    `);
  });
});

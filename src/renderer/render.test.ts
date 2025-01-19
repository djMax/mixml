import fs from 'fs';
import os from 'os';
import path from 'path';

import { describe, expect, test } from 'vitest';

import { getFfmpegConfiguration } from './index.js';
import { parseMixml } from '../parser/index.js';
import { fixture, fixturePath } from '../tests.js';

describe('renderer', () => {
  test('should render a mixml document', async () => {
    const mixml = parseMixml(fixture('AccurateMix.toml'));
    const ffmpeg = await getFfmpegConfiguration(mixml, fixturePath());
    expect(ffmpeg).toBeDefined();

    // Output to an mp3 file in a temporary directory
    const outputPath = path.join(os.tmpdir(), 'output.mp3');
    expect(ffmpeg._getArguments()).toEqual([
      '-i',
      expect.stringMatching(/__fixtures__\/BeatOfTheBlock\.mp3$/),
      '-i',
      expect.stringMatching(/__fixtures__\/HitTheStreets\.mp3$/),
      '-ar',
      44100,
      '-filter_complex_script',
      expect.stringMatching(/mixml-filter\.txt$/),
      '-map',
      '[out]',
    ]);

    ffmpeg.output(outputPath);
    // console.log(ffmpeg._getArguments().join(' '));
    await new Promise((resolve, reject) => {
      ffmpeg.on('end', resolve);
      ffmpeg.on('error', reject);
      ffmpeg.run();
    });

    // Check if the file exists. The content can be different because of the ffmpeg version,
    // so we rely on the filter check above and that we can produce output.
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});

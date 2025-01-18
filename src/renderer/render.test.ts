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
    await new Promise((resolve, reject) => {
      ffmpeg.on('end', resolve);
      ffmpeg.on('error', reject);
      ffmpeg.run();
    });

    // Check if the file exists
    expect(fs.existsSync(outputPath)).toBe(true);
    // Make sure outputPath matches __fixtures__/accurate.mp3
    expect(fs.readFileSync(outputPath, 'binary')).toStrictEqual(
      fs.readFileSync(fixturePath('accurate.mp3'), 'binary'),
    );
  });
});

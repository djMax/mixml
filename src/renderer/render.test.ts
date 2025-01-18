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
    expect(ffmpeg._getArguments()).toMatchInlineSnapshot(`
      [
        "-i",
        "/Users/memetral/dev/personal/mixml/__fixtures__/BeatOfTheBlock.mp3",
        "-i",
        "/Users/memetral/dev/personal/mixml/__fixtures__/HitTheStreets.mp3",
        "-filter_complex",
        "[0:a]aselect='gte(n\\,0)'[pt0_s0];[pt0_s0]atempo=1.1[pt0_seg0];[pt0_seg0]concat=n=1:v=0:a=1[pt0_pitched];[1:a]adelay=delays=220500S:all=1[dl1];[pt0_pitched][dl1]amix=inputs=2:normalize=0[out]",
        "-ar",
        44100,
        "-map",
        "[out]",
      ]
    `);

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

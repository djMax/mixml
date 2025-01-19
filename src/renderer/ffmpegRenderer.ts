import fs from 'fs';
import os from 'os';
import path from 'path';

import FF from 'fluent-ffmpeg';

import { ParsedMixmlDocument } from '../types';
import { FilterSpec, getFilterFile } from './ffmpegFilterFile';
import { normalizeUrl } from './media';
import { RenderError } from './RenderError';
import { Track } from './Track';

export async function getFfmpegConfiguration(
  mixml: ParsedMixmlDocument,
  basePath: string,
) {
  // Sort events by time to ensure proper sequencing
  const sortedEvents = [...mixml.events].sort((a, b) => {
    return a.at.pts - b.at.pts;
  });

  const tracks: Track[] = [];
  const active = new Map<string, Track>();

  sortedEvents.forEach((e, ix) => {
    const { event, at } = e;
    const startPts = at.pts;
    const trackId = e.trackId ? `explicit-${e.trackId}` : `implicit-${ix}`;

    let track = active.get(trackId);
    if (event.play) {
      // Stop the current track on this id, if there is one
      // TODO
      // Start a new track on this id
      track = new Track(
        trackId,
        normalizeUrl(event.play, basePath),
        startPts,
        event.cue,
      );
      tracks.push(track);
      active.set(trackId, track);
    } else if (event.play === false) {
      // Stop the current track on this id, if there is one
      track?.setStopPoint(startPts);
      active.delete(trackId);
    }

    if (!track) {
      throw new RenderError(
        `A track was referenced but did not exist and did not have a 'play' value`,
        e,
      );
    }

    if (e.event.pitch) {
      if (typeof e.event.pitch.value !== 'number') {
        throw new RenderError('Interpolated pitch values are not supported', e);
      }
      track.addPitchShift(startPts, e.event.pitch.value);
    }

    if (e.event.volume) {
      track.addVolumeChange(at, e.event.volume);
    }
  });

  const finalRefs: string[] = [];
  const finalFilters: FilterSpec[] = [];

  const command = tracks.reduce((command, track, ix) => {
    const updated = command.input(track.media);
    const filters = track.getFilters(ix);
    if (filters?.length) {
      finalRefs.push(filters[filters.length - 1]?.outputs?.[0] as string);
      finalFilters.push(...filters);
    } else {
      finalRefs.push(`${ix}:a`);
    }
    return updated;
  }, FF().audioFrequency(44100));

  finalFilters.push({
    filter: 'amix',
    inputs: finalRefs,
    options: `inputs=${finalRefs.length}:normalize=0`,
    outputs: ['out'],
  });
  const filterFile = getFilterFile(finalFilters);

  // Write the filter file to a temporary directory
  const filterFilePath = path.join(os.tmpdir(), 'mixml-filter.txt');
  fs.writeFileSync(filterFilePath, filterFile, 'utf-8');

  return command
    .addOption('-filter_complex_script', filterFilePath)
    .map('[out]');
}

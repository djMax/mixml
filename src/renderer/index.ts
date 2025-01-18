import FF from 'fluent-ffmpeg';

import { ParsedMixmlDocument } from '../types';
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
      track = new Track(trackId, normalizeUrl(event.play, basePath), startPts);
      tracks.push(track);
    }

    if (!track) {
      throw new RenderError(
        `A track was referenced but did not exist and did not have a 'play' value`,
        e,
      );
    }

    if (e.event.pitch) {
      track.addPitchShift(startPts, e.event.pitch);
    }

    if (e.event.volume) {
      track.addVolumeChange(startPts, e.event.volume);
    }
  });

  const finalRefs: string[] = [];
  const finalFilters: FF.FilterSpecification[] = [];

  const command = tracks.reduce((command, track, ix) => {
    const updated = command.input(track.media);
    const filters = track.getFilters(updated, ix);
    if (filters?.length) {
      finalRefs.push(filters[filters.length - 1]?.outputs?.[0] as string);
      finalFilters.push(...filters);
    } else {
      finalRefs.push(`${ix}:a`);
    }
    return updated;
  }, FF().audioFrequency(44100));

  return command
    .complexFilter([
      ...finalFilters,
      {
        filter: 'amix',
        inputs: finalRefs,
        options: {
          inputs: finalRefs.length,
          normalize: 0,
        },
        outputs: ['out'],
      },
    ])
    .map('[out]');
}

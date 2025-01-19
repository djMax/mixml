import { TimeWithSample } from '../parser/TimeWithSample';
import { ParsedInterpolatedValueChange, ParsedValueChange } from '../types';
import { FilterSpec } from './ffmpegFilterFile';

type VolumeChangeEvent = ParsedInterpolatedValueChange & { at: TimeWithSample };

/**
 * A track is a single audio stream that can have effects
 * applied to it and can have its media "replaced" with a
 * new media source.
 */
export class Track {
  public readonly pitchShift: { pts: number; shift: number }[] = [];
  public readonly volume: VolumeChangeEvent[] = [];

  private stopPts: number | undefined;

  constructor(
    public readonly id: string,
    public readonly media: string,
    public readonly startPts: number,
    public readonly cue: TimeWithSample | undefined,
  ) {}

  addVolumeChange(at: TimeWithSample, change: ParsedValueChange) {
    // TODO handle the different interpolations
    this.volume.push({
      at,
      ...(change as ParsedInterpolatedValueChange),
    });
  }

  addPitchShift(pts: number, shift: number) {
    this.pitchShift.push({
      pts,
      shift,
    });
  }

  setStopPoint(pts: number) {
    this.stopPts = pts;
  }

  /**
   * Apply the track's effects to the command.
   */
  public getFilters(inputIndex: number): FilterSpec[] {
    const filters: FilterSpec[] = [];

    let inputRef = `${inputIndex}:a`;

    if (this.cue || this.stopPts) {
      const options = [
        this.cue?.pts ? `start_pts=${this.cue.pts}` : '',
        this.stopPts ? `end_pts=${this.stopPts - this.startPts}` : '',
      ]
        .filter(Boolean)
        .join(':');
      const outputRef = `cue${inputIndex}`;
      filters.push({
        inputs: [inputRef],
        filter: 'atrim',
        options,
        outputs: [outputRef],
      });
      inputRef = outputRef;
    }

    if (this.startPts) {
      const outputRef = `dl${inputIndex}`;
      filters.push({
        inputs: [`${inputIndex}:a`],
        filter: 'adelay',
        options: `delays=${this.startPts}S:all=1`,
        outputs: [outputRef],
      });
      inputRef = outputRef;
    }

    const pitchFilters = this.getPitchShiftFilters(inputRef, `pt${inputIndex}`);
    if (pitchFilters.length) {
      filters.push(...pitchFilters);
      inputRef = pitchFilters[pitchFilters.length - 1].outputs?.[0] as string;
    }

    const volumeFilter = this.getVolumeFilter(inputRef, `vol${inputIndex}`);
    if (volumeFilter) {
      filters.push(volumeFilter);
      inputRef = volumeFilter.outputs[0];
    }
    return filters;
  }

  private getVolumeExpression(event: VolumeChangeEvent, startVolume: number) {
    const { at, value, duration, interpolation } = event;
    if (!duration?.pts) {
      // No interpolation, just set the value
      return String(value / 10.0);
    }
    const startGain = startVolume / 10.0;
    const endGain = value / 10.0;
    if (interpolation === 'linear' || !interpolation) {
      const end = at.pts + duration.pts;
      return `if(lte(t, ${end}/${at.sampleRate}), lerp(${startGain}, ${endGain}, (t - ${at.pts}/${at.sampleRate})/(${duration.pts}/${at.sampleRate})), ${endGain})`;
    }
    throw new Error(`Unsupported interpolation: ${interpolation}`);
  }

  private getVolumeFilter(
    inputRef: string,
    outputRef: string,
  ): FilterSpec | undefined {
    if (!this.volume.length) {
      return undefined;
    }

    const points = this.volume.sort((a, b) => a.at.pts - b.at.pts);
    // Make a set of expressions that are missing the closing parenthesis, so that
    // we can join them up as "else" expressions
    const expressions = points.map((point, index, arr) => {
      const nextPoint = arr[index + 1];
      // If this volume event is at the start of the track, assume we start from 0.
      // Otherwise, if it's the first change, assume we started at unity gain,
      // and finally if it's not the first change, use the previous volume value.
      const lastVolume =
        point.at.pts === this.startPts
          ? 0
          : index > 0
            ? arr[index - 1].value
            : 10;
      // TODO couldn't get pts to work here, so using t instead
      if (nextPoint) {
        // Set volume for a range between this point and the next point
        return `if(between(t,${point.at.pts}/${point.at.sampleRate},${nextPoint.at.pts}/${nextPoint.at.sampleRate}),${this.getVolumeExpression(point, lastVolume)},`;
      }
      // Set volume from this point onwards
      return `if(gte(t,${point.at.pts}/44100),${this.getVolumeExpression(point, lastVolume)},`;
    });

    const volumeExpression = `${expressions.join('')}1${')'.repeat(expressions.length)}`;

    return {
      inputs: [inputRef],
      filter: 'volume',
      options: `'volume=${volumeExpression}':eval=frame`,
      outputs: [outputRef],
    };
  }

  private getPitchShiftFilters(inputRef: string, outputRefBase: string) {
    if (!this.pitchShift.length) {
      return [];
    }
    const filters: FilterSpec[] = [];
    const segments: string[] = [];

    this.pitchShift.map((cmd, i) => {
      const { pts, shift } = cmd;
      const nextPts = this.pitchShift[i + 1]?.pts;
      const pitchedRef = `${outputRefBase}_seg${i}`;
      const segmentRef = `${outputRefBase}_s${i}`;

      filters.push({
        filter: 'aselect',
        inputs: [inputRef],
        outputs: [segmentRef],
        options: nextPts
          ? `'between(n\\,${pts}\\,${nextPts - 1})'` // Middle segments
          : `'gte(n\\,${pts})'`, // Last segment
      });
      const multiplier = 1 + shift / 100; // relative to original
      filters.push({
        filter: 'atempo',
        inputs: [segmentRef],
        outputs: [pitchedRef],
        options: String(multiplier),
      });
      segments.push(pitchedRef);
    });

    if (this.pitchShift[0]?.pts) {
      // Handle before the first pitch shift
      filters.unshift({
        filter: 'aselect',
        inputs: [inputRef],
        outputs: [`${outputRefBase}_sinit`],
        options: `'lt(n\\,${this.pitchShift[0].pts})'`,
      });
      filters.unshift({
        filter: 'atempo',
        inputs: [`${outputRefBase}_sinit`],
        outputs: [`${outputRefBase}_seginit`],
        options: '1.0',
      });
      segments.unshift(`${outputRefBase}_seginit`);
    }

    filters.push({
      filter: 'concat',
      inputs: segments,
      outputs: [`${outputRefBase}_pitched`],
      options: `n=${segments.length}:v=0:a=1`,
    });
    return filters;
  }
}

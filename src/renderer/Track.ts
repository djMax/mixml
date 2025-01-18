import { ValueChange } from '../types';
import { FilterSpec } from './FilterFile';

/**
 * A track is a single audio stream that can have effects
 * applied to it and can have its media "replaced" with a
 * new media source.
 */
export class Track {
  public readonly pitchShift: { pts: number; shift: number }[] = [];
  public readonly volume: { pts: number; volume: number }[] = [];

  constructor(
    public readonly id: string,
    public readonly media: string,
    public readonly startPts: number,
  ) {}

  addVolumeChange(pts: number, volume: number | ValueChange) {
    // TODO handle the different interpolations
    this.volume.push({
      pts,
      volume: typeof volume === 'number' ? volume : volume.value,
    });
  }

  addPitchShift(pts: number, shift: number | ValueChange) {
    this.pitchShift.push({
      pts,
      shift: typeof shift === 'number' ? shift : shift.value,
    });
  }

  /**
   * Apply the track's effects to the command.
   */
  public getFilters(inputIndex: number): FilterSpec[] {
    const filters: FilterSpec[] = [];

    let inputRef = `${inputIndex}:a`;
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

    if (this.volume.length) {
      // Adjust volume at the set points
      const outputRef = `vol${inputIndex}`;
      const volumePoints = this.volume
        .map((cmd) => `${cmd.pts}p/${cmd.volume}`)
        .join(' ');
      filters.push({
        inputs: [inputRef],
        filter: 'volume',
        options: `volume=${volumePoints}`,
        outputs: [outputRef],
      });
      inputRef = outputRef;
    }
    return filters;
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

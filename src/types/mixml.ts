import { MixMLDuration } from './iso-8601';
import { TimeWithSample } from '../parser/TimeWithSample';

export interface ValueChange {
  /**
   * The volume value, between 0 and 10
   */
  value: number;
  /**
   * The duration of the volume change
   */
  duration: MixMLDuration;
  /**
   * The way the values are interpolated between the start and end times
   */
  interpolation: 'linear' | 'exponential' | 'logarithmic' | 'literal';
  /**
   * If the interpolation is literal, the values to use, where the time is the
   * time in seconds or fractions of seconds since the start of the event,
   * and the value is the volume value to use at that time.
   */
  values: { time: number; value: number }[];
}

type URL = string;

export interface MixmlEvent {
  /**
   * If the event is a play event, the media to use as the source
   */
  play?: URL;
  /**
   * The volume to apply to the track, between 0 and 10
   */
  volume: ValueChange | number;
  /**
   * The pitch to apply to the track
   */
  pitch: ValueChange | number;
}

export type EventTimeKey = MixMLDuration | `${MixMLDuration}-${string}`;

export interface MixmlDocument {
  [key: EventTimeKey]: MixmlEvent;
}

export interface ParsedMixmlDocument {
  events: {
    at: TimeWithSample;
    event: MixmlEvent;
    trackId?: string;
  }[];
}

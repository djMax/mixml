/**
 * The types as read from a MixML document.
 */

import { MixMLTimeSpec } from './timeSpec';

/**
 * Right now both URLs and paths are supported.
 */
type MediaResourceIdentifier = string;

/**
 * A value at a specific time as specified in the mixml document.
 */
export interface TimedValue {
  time: MixMLTimeSpec;
  value: number;
}

/**
 * A value such as volume or pitch may change over time.
 * This interface describes the way the change occurs.
 */
export interface InterpolatedValueChange {
  /**
   * The value to which the setting should be set, potentially after a duration.
   */
  value: number;
  /**
   * The duration of the volume change
   */
  duration?: MixMLTimeSpec;
  /**
   * The way the values are interpolated between the initial and end values over the duration
   */
  interpolation?: 'linear';
}

export interface LiteralValueChange {
  value: TimedValue[];
}

export type ValueChange = InterpolatedValueChange | LiteralValueChange;

export interface MixmlEvent {
  /**
   * If no media is currently associated with the track,
   * this must be specified to load and start playing the media.
   * If media is already loaded, it can be omitted to set playback characteristics.
   * If false, the media will be stopped.
   */
  play?: MediaResourceIdentifier | false;
  /**
   * The time within the media where playback should start
   */
  cue?: MixMLTimeSpec;
  /**
   * The volume to apply to the track, between 0 and 10
   */
  volume: ValueChange | number;
  /**
   * The pitch to apply to the track
   */
  pitch: ValueChange | number;
}

export type TrackName = string;
export type EventTimeKey = MixMLTimeSpec | `${MixMLTimeSpec}-${TrackName}`;

export interface MixmlDocument {
  sampleRate: number;

  [key: EventTimeKey]: MixmlEvent;
}

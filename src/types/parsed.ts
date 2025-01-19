import { InterpolatedValueChange, LiteralValueChange } from './raw';
import { TimeWithSample } from '../parser/TimeWithSample';

/**
 * A value at a specific time as parsed into the runtime.
 */
export interface ParsedTimedValue {
  time: TimeWithSample;
  value: number;
}

export type ParsedInterpolatedValueChange = Omit<
  InterpolatedValueChange,
  'duration'
> & {
  duration: TimeWithSample;
};

export type ParsedLiteralValueChange = Omit<LiteralValueChange, 'value'> & {
  value: ParsedTimedValue[];
};

export type ParsedValueChange =
  | ParsedInterpolatedValueChange
  | ParsedLiteralValueChange;

export interface ParsedMixmlEvent {
  play?: string | false;
  cue?: TimeWithSample;
  volume?: ParsedValueChange;
  pitch?: ParsedValueChange;
}

export interface ParsedMixmlDocument {
  sampleRate: number;

  events: {
    at: TimeWithSample;
    event: ParsedMixmlEvent;
    trackId?: string;
  }[];
}

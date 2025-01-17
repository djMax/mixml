/**
 * ISO 8601 duration with or without the leading "P"
 */
export type ISO8601Hour = `${number}h` | `${number}H`;
export type ISO8601Minute = `${number}m` | `${number}M`;
export type ISO8601Second = `${number}s` | `${number}S`;

export type ISO8601DurationPart =
  | ISO8601Hour
  | ISO8601Minute
  | ISO8601Second
  | `${ISO8601Hour}${ISO8601Minute}`
  | `${ISO8601Hour}${ISO8601Minute}${ISO8601Second}`
  | `${ISO8601Minute}${ISO8601Second}`;

export type ISO8601Duration = `PT${ISO8601DurationPart}` | `P${ISO8601DurationPart}` | ISO8601DurationPart;

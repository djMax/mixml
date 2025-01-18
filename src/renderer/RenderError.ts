import { ParsedMixmlDocument } from '../types';

export class RenderError extends Error {
  constructor(
    message: string,
    public readonly event: ParsedMixmlDocument['events'][number],
  ) {
    super(message);
    this.name = 'RenderError';
  }

  public readonly line?: number;
}

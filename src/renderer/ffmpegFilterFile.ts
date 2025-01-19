/**
 * Our internal representation of an ffmpeg filter.
 */
export interface FilterSpec {
  inputs: string[];
  filter: string;
  options?: string;
  outputs: string[];
}

export function getFilterFile(filters: FilterSpec[]): string {
  return filters
    .map((filter: FilterSpec) => {
      const inputs = filter.inputs?.map((input) => `[${input}]`).join('');
      const outputs = filter.outputs?.map((output) => `[${output}]`).join('');
      const filterString = `${inputs}${filter.filter}${filter.options ? `=${filter.options}` : ''}${outputs};`;
      return filterString;
    })
    .join('\n');
}

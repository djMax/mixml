import fs from 'fs';
import path from 'path';

export function fixture(f: string) {
  return fs.readFileSync(path.join(__dirname, '../__fixtures__', f), 'utf8');
}

export function fixturePath(file?: string) {
  if (file) {
    return path.join(__dirname, '../__fixtures__', file);
  }
  return path.join(__dirname, '../__fixtures__');
}

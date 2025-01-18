import fs from 'fs';
import path from 'path';

export function normalizeUrl(urlOrPath: string, basePath: string) {
  // if it's a URL, return it. If it's a file URL or a path (relative or absolute), resolve it and return the full path.
  try {
    // Attempt to parse the input as a URL
    const parsedUrl = new URL(urlOrPath);

    // If the URL is a file protocol but not properly formatted or needs resolution
    if (parsedUrl.protocol === 'file:') {
      // Return the pathname directly from the file URL, assuming it's already absolute
      return path.resolve(basePath, parsedUrl.pathname);
    }

    return parsedUrl.href;
  } catch (error) {
    // Error means it wasn't a valid URL, handle it as a file path
    const absolutePath = path.resolve(basePath, urlOrPath); // Resolve the path based on the basePath
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }

    throw error;
  }
}

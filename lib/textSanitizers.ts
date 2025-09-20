export const INVISIBLE_CHAR_PATTERN = /[\u200B\u200C\u200D\uFEFF]/g;
const TRAILING_URL_JUNK = /[\s)\]\}>*,.;:'"]+$/;

export function stripInvisibleCharacters(value: string): string {
  return value.replace(INVISIBLE_CHAR_PATTERN, '');
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ');
}

export function stripTrailingUrlJunk(value: string): string {
  let current = value;
  for (let i = 0; i < 5; i += 1) {
    const stripped = current.replace(TRAILING_URL_JUNK, '');
    if (stripped === current) {
      break;
    }
    current = stripped;
  }
  return current;
}

export function normalizeUrl(value: string): string | undefined {
  let candidate = stripInvisibleCharacters(value).trim();
  if (!candidate) {
    return undefined;
  }
  candidate = stripTrailingUrlJunk(candidate.replace(/\s+/g, ''));
  for (let i = 0; i < 5; i += 1) {
    try {
      const normalized = new URL(candidate).toString();
      return stripTrailingUrlJunk(normalized);
    } catch {
      const stripped = stripTrailingUrlJunk(candidate);
      if (stripped === candidate) {
        break;
      }
      candidate = stripped;
    }
  }
  return undefined;
}

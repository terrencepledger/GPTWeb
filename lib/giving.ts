import { siteSettings } from './queries';
import type { GivingOption } from './queries';

export type { GivingOption } from './queries';

const INVISIBLE_CHAR_PATTERN = /[\u200B\u200C\u200D\uFEFF]/g;
const TRAILING_URL_JUNK = /[\s)\]\}>*,.;:'"]+$/;

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function sanitizeText(value: string): string {
  return value
    .replace(INVISIBLE_CHAR_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTrailingUrlJunk(value: string): string {
  let current = value;
  for (let i = 0; i < 5; i += 1) {
    const stripped = current.replace(TRAILING_URL_JUNK, '');
    if (stripped === current) {
      return current;
    }
    current = stripped;
  }
  return current;
}

function normalizeUrl(rawUrl: string): string | undefined {
  let value = rawUrl.replace(INVISIBLE_CHAR_PATTERN, '').trim();
  if (!value) {
    return undefined;
  }
  value = stripTrailingUrlJunk(value.replace(/\s+/g, ''));
  for (let i = 0; i < 5; i += 1) {
    try {
      const normalized = new URL(value).toString();
      return stripTrailingUrlJunk(normalized);
    } catch {
      const stripped = stripTrailingUrlJunk(value);
      if (stripped === value) {
        break;
      }
      value = stripped;
    }
  }
  return undefined;
}

function normalizeGivingOption(option: unknown): GivingOption | null {
  if (!option || typeof option !== 'object') {
    return null;
  }
  const candidate = option as Partial<GivingOption> & Record<string, unknown>;
  const title = isString(candidate.title) ? sanitizeText(candidate.title) : '';
  let content = isString(candidate.content) ? sanitizeText(candidate.content) : '';
  const href = isString(candidate.href) ? normalizeUrl(candidate.href) : undefined;

  if (!title || !content) {
    return null;
  }

  if (href) {
    const normalizedContentUrl = normalizeUrl(content);
    if (normalizedContentUrl && normalizedContentUrl === href) {
      content = href;
    } else {
      const stripped = stripTrailingUrlJunk(content);
      if (stripped === href) {
        content = href;
      }
    }
  }

  return {
    title,
    content,
    href,
  } satisfies GivingOption;
}

export function normalizeGivingOptions(options: unknown): GivingOption[] {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => normalizeGivingOption(option))
    .filter((option): option is GivingOption => option !== null);
}

export async function getGivingOptions(): Promise<GivingOption[]> {
  try {
    const settings = await siteSettings();
    return normalizeGivingOptions(settings?.givingOptions);
  } catch {
    return [];
  }
}

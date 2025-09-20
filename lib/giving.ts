import { siteSettings } from './queries';
import type { GivingOption } from './queries';
import {
  collapseWhitespace,
  normalizeUrl,
  stripInvisibleCharacters,
  stripTrailingUrlJunk,
} from './textSanitizers';

export type { GivingOption } from './queries';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function sanitizeText(value: string): string {
  return collapseWhitespace(stripInvisibleCharacters(value)).trim();
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

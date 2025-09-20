import { siteSettings } from './queries';
import type { GivingOption } from './queries';

export type { GivingOption } from './queries';

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function getGivingOptions(): Promise<GivingOption[]> {
  try {
    const settings = await siteSettings();
    const options = settings?.givingOptions;
    if (!Array.isArray(options)) {
      return [];
    }

    return options
      .map((option) => {
        const title = isString(option?.title) ? option.title.trim() : '';
        const content = isString(option?.content) ? option.content.trim() : '';
        const href = isString(option?.href) ? option.href.trim() : undefined;

        if (!title || !content) {
          return null;
        }

        return {
          title,
          content,
          href,
        } satisfies GivingOption;
      })
      .filter((option): option is GivingOption => option !== null);
  } catch {
    return [];
  }
}

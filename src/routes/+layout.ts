import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
  const locale = (data as { locale?: 'en' | 'de' })?.locale ?? 'de';

  const common = (await import(`$lib/i18n/locales/${locale}/common.json`)).default;
  const layout = (await import(`$lib/i18n/locales/${locale}/layout.json`)).default;

  return { messages: { common, layout }, locale };
};

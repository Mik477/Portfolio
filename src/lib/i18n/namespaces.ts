// src/lib/i18n/namespaces.ts
// Namespace list and helpers for loading message files

export type Namespace =
  | 'common'
  | 'layout'
  | 'hero'
  | 'about'
  | 'contact'
  | 'projects'
  | 'project-bura'
  | 'legal';

export const CORE_NAMESPACES: Namespace[] = ['common', 'layout'];

export function nsPath(locale: string, ns: Namespace) {
  return `/src/lib/i18n/locales/${locale}/${ns}.json`;
}

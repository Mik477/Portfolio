// src/params/lang.ts
// Constrains [lang] route segment to supported locales
export function match(param: string) {
  return param === 'en' || param === 'de';
}

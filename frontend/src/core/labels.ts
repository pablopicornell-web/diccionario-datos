import type { Labels } from "./model.ts";

/** Lee la etiqueta de un idioma. */
export function getLabel(labels: Labels | null | undefined, language: string): string {
  if (!labels || !labels.values) {
    return "";
  }
  return labels.values[language] ?? "";
}

/** Devuelve las etiquetas definidas como pares idioma/texto, en su orden. */
export function labelEntries(labels: Labels | null | undefined): Array<[string, string]> {
  if (!labels || !labels.values) {
    return [];
  }
  const order = labels.order ?? [];
  const entries: Array<[string, string]> = [];
  const seen = new Set<string>();
  for (const language of order) {
    if (language in labels.values && !seen.has(language)) {
      entries.push([language, labels.values[language]]);
      seen.add(language);
    }
  }
  for (const language of Object.keys(labels.values)) {
    if (!seen.has(language)) {
      entries.push([language, labels.values[language]]);
    }
  }
  return entries;
}

/**
 * Devuelve etiquetas nuevas con el texto indicado. Si el texto queda vacío se
 * elimina esa etiqueta para no ensuciar el YAML.
 */
export function setLabel(
  labels: Labels | null | undefined,
  language: string,
  text: string,
): Labels | null {
  const values: Record<string, string> = { ...(labels?.values ?? {}) };
  const order = [...(labels?.order ?? [])];
  if (!order.includes(language)) {
    order.push(language);
  }
  if (text === "") {
    delete values[language];
  } else {
    values[language] = text;
  }
  if (Object.keys(values).length === 0) {
    return null;
  }
  return { order: order.filter((item) => item in values), values };
}

/** Texto de la etiqueta principal: idioma por defecto y, si falta, el primero. */
export function primaryLabel(
  labels: Labels | null | undefined,
  defaultLanguage: string,
): string {
  const entries = labelEntries(labels);
  return getLabel(labels, defaultLanguage) || (entries[0]?.[1] ?? "");
}

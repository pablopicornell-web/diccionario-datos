/**
 * Conversión entre el texto que se escribe en la interfaz y los valores
 * literales que espera el YAML según el tipo lógico del campo.
 */

/** Convierte el texto de un control en el valor literal correspondiente. */
export function parseLiteralValue(text: string, logicalType: string): unknown {
  const trimmed = text.trim();
  switch (logicalType) {
    case "integer": {
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? trimmed : parsed;
    }
    case "decimal": {
      const parsed = Number(trimmed.replace(",", "."));
      return Number.isNaN(parsed) ? trimmed : parsed;
    }
    case "boolean":
      if (trimmed === "true" || trimmed === "false") {
        return trimmed === "true";
      }
      return trimmed;
    default:
      return text;
  }
}

/** Convierte un valor del YAML en el texto que se muestra en la interfaz. */
export function formatLiteralValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

/** Texto corto que describe un valor permitido en las listas. */
export function describeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "(sin valor)";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

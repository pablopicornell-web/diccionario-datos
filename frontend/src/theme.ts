/** Tema visual del editor. La preferencia se guarda fuera del diccionario. */

export type Theme = "light" | "dark";

/** Aplica el tema al documento HTML. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/** Devuelve el tema contrario. */
export function oppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

/** Convierte un valor recibido del backend en un tema válido. */
export function asTheme(value: string | undefined | null): Theme {
  return value === "dark" ? "dark" : "light";
}

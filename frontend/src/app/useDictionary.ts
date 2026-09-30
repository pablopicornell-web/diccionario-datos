import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as api from "../api";
import { findField, findTable } from "../core/edits.ts";
import type {
  Document,
  ExternalState,
  Field,
  Finding,
  HistoryEntry,
  LockState,
  Table,
} from "../core/model";
import { cloneDocument, normalizeDocument } from "../core/model.ts";
import { applyTheme, asTheme, oppositeTheme, type Theme } from "../theme";

export interface Notice {
  kind: "info" | "error";
  text: string;
}

export interface Selection {
  table: string | null;
  field: string | null;
}

/** Selección especial para editar la cabecera del diccionario. */
export const PROJECT_SELECTION = ":proyecto";

/** Contexto del panel de propiedades: la tabla o el campo seleccionado. */
export type PropertiesPane = "table" | "field";

export interface DictionaryController {
  document: Document | null;
  path: string;
  findings: Finding[];
  errors: Finding[];
  warnings: Finding[];
  dirty: boolean;
  busy: boolean;
  notice: Notice | null;
  external: ExternalState | null;
  lock: LockState | null;
  history: HistoryEntry[] | null;
  theme: Theme;
  selection: Selection;
  pane: PropertiesPane;
  selectedTable: Table | null;
  selectedField: Field | null;
  openFile: () => Promise<void>;
  reload: () => Promise<void>;
  save: () => Promise<void>;
  update: (mutator: (draft: Document) => Document | void) => Promise<void>;
  select: (table: string | null, field?: string | null) => void;
  selectPane: (pane: PropertiesPane) => void;
  validateNow: () => Promise<void>;
  clearOrphanLock: () => Promise<void>;
  dismissNotice: () => void;
  openHistory: () => Promise<void>;
  closeHistory: () => void;
  restoreVersion: (id: string) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const EXTERNAL_POLL_MS = 4000;
const VALIDATION_DEBOUNCE_MS = 250;

/**
 * Estado de trabajo del editor: documento abierto, hallazgos de validación,
 * sesión de edición, avisos y panel de historial.
 */
export function useDictionary(): DictionaryController {
  const [document, setDocument] = useState<Document | null>(null);
  const [path, setPath] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [external, setExternal] = useState<ExternalState | null>(null);
  const [lock, setLock] = useState<LockState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [selection, setSelection] = useState<Selection>({ table: null, field: null });
  const [pane, setPane] = useState<PropertiesPane>("table");
  const sessionOpen = useRef(false);

  const selectedTable = useMemo(
    () => (document && selection.table ? findTable(document, selection.table) ?? null : null),
    [document, selection.table],
  );
  const selectedField = useMemo(
    () => (selectedTable && selection.field ? findField(selectedTable, selection.field) ?? null : null),
    [selectedTable, selection.field],
  );

  useEffect(() => {
    let active = true;
    api
      .getPreferences()
      .then((preferences) => {
        if (active) {
          setTheme(asTheme(preferences.theme));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyLoadResult = useCallback((loaded: {
    path: string;
    findings: Finding[];
    document?: Document | null;
    lock?: LockState | null;
    migratedFromV1?: boolean;
  }) => {
    const nextDocument = loaded.document ? normalizeDocument(loaded.document) : null;
    setDocument(nextDocument);
    setPath(loaded.path);
    setFindings(loaded.findings ?? []);
    setLock(loaded.lock ?? null);
    setExternal(null);
    setHistory(null);
    setDirty(false);
    sessionOpen.current = false;
    setPane("table");
    setSelection({
      table: nextDocument?.tables[0]?.name ?? null,
      field: null,
    });
    if (loaded.migratedFromV1) {
      setNotice({
        kind: "info",
        text:
          "El archivo estaba en format_version 1: se convirtió display_field a display_fields. " +
          "Al guardar quedará escrito en format_version 2.",
      });
    }
  }, []);

  const openFile = useCallback(async () => {
    setBusy(true);
    try {
      const chosen = await api.chooseDictionaryFile();
      if (!chosen) {
        return;
      }
      applyLoadResult(await api.openDictionary(chosen));
      setNotice(null);
    } catch (error) {
      setNotice({ kind: "error", text: describeError(error) });
    } finally {
      setBusy(false);
    }
  }, [applyLoadResult]);

  const reload = useCallback(async () => {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Descartarlos y recargar desde disco?")) {
      return;
    }
    setBusy(true);
    try {
      applyLoadResult(await api.reloadDictionary());
      setNotice({ kind: "info", text: "Diccionario recargado desde disco." });
    } catch (error) {
      setNotice({ kind: "error", text: describeError(error) });
    } finally {
      setBusy(false);
    }
  }, [applyLoadResult, dirty]);

  const ensureSession = useCallback(async () => {
    if (sessionOpen.current) {
      return true;
    }
    try {
      const state = await api.beginEdit();
      sessionOpen.current = true;
      setLock(state);
      return true;
    } catch (error) {
      setNotice({ kind: "error", text: describeError(error) });
      try {
        setLock(await api.lockState());
      } catch {
        setLock(null);
      }
      return false;
    }
  }, []);

  const update = useCallback(
    async (mutator: (draft: Document) => Document | void) => {
      if (!document) {
        return;
      }
      if (!(await ensureSession())) {
        return;
      }
      setDocument((previous) => {
        if (!previous) {
          return previous;
        }
        const draft = cloneDocument(previous);
        return mutator(draft) ?? draft;
      });
      setDirty(true);
    },
    [document, ensureSession],
  );

  const save = useCallback(async () => {
    if (!document) {
      return;
    }
    setBusy(true);
    try {
      const result = await api.saveDictionary(document);
      setFindings(result.findings ?? []);
      if (!result.saved) {
        setNotice({ kind: "error", text: result.message || "No se guardó el diccionario." });
        return;
      }
      setDirty(false);
      sessionOpen.current = false;
      setNotice({ kind: "info", text: `${result.message} Versión previa: ${result.historyId}.` });
      setExternal(null);
      if (result.document) {
        setDocument(normalizeDocument(result.document));
      }
      setLock(await api.lockState());
      if (history !== null) {
        setHistory(await api.history());
      }
    } catch (error) {
      setNotice({ kind: "error", text: describeError(error) });
      try {
        setExternal(await api.checkExternal());
      } catch {
        setExternal(null);
      }
    } finally {
      setBusy(false);
    }
  }, [document, history]);

  const validateNow = useCallback(async () => {
    if (!document) {
      return;
    }
    try {
      setFindings(await api.validateDictionary(document));
    } catch (error) {
      setNotice({ kind: "error", text: describeError(error) });
    }
  }, [document]);

  useEffect(() => {
    if (!document) {
      return;
    }
    const timer = window.setTimeout(() => {
      api.validateDictionary(document).then(setFindings).catch(() => undefined);
    }, VALIDATION_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [document]);

  useEffect(() => {
    if (!path) {
      return;
    }
    const timer = window.setInterval(() => {
      api
        .checkExternal()
        .then((state) => setExternal(state.changed ? state : null))
        .catch(() => undefined);
    }, EXTERNAL_POLL_MS);
    return () => window.clearInterval(timer);
  }, [path]);

  useEffect(() => {
    if (!document) {
      return;
    }
    setSelection((current) => {
      if (current.table === PROJECT_SELECTION) {
        return current;
      }
      const table = current.table && findTable(document, current.table) ? current.table : document.tables[0]?.name ?? null;
      const found = document.tables.find((item) => item.name === table);
      // Sin campo seleccionado se muestran las propiedades de la tabla, que es
      // donde viven índices, órdenes de grilla y restricciones únicas.
      const field = current.field && findField(found, current.field) ? current.field : null;
      if (table === current.table && field === current.field) {
        return current;
      }
      return { table, field };
    });
  }, [document]);

  const select = useCallback((table: string | null, field: string | null = null) => {
    setPane(field ? "field" : "table");
    setSelection({ table, field });
  }, []);

  const selectPane = useCallback(
    (next: PropertiesPane) => {
      setPane(next);
      if (next !== "field") {
        return;
      }
      setSelection((current) => {
        if (current.field || !document || !current.table) {
          return current;
        }
        const table = findTable(document, current.table);
        const first = table?.fields[0]?.name ?? null;
        return first ? { ...current, field: first } : current;
      });
    },
    [document],
  );

  const clearOrphanLock = useCallback(async () => {
    try {
      await api.clearLock();
      setLock(await api.lockState());
      setNotice({ kind: "info", text: "Bloqueo liberado manualmente." });
    } catch (error) {
      setNotice({ kind: "error", text: describeError(error) });
    }
  }, []);

  const openHistory = useCallback(async () => {
    try {
      setHistory(await api.history());
    } catch (error) {
      setNotice({ kind: "error", text: describeError(error) });
    }
  }, []);

  const closeHistory = useCallback(() => setHistory(null), []);

  const restoreVersion = useCallback(
    async (id: string) => {
      if (!window.confirm(`¿Restaurar la versión ${id}? El estado actual se guardará antes en el historial.`)) {
        return;
      }
      setBusy(true);
      try {
        applyLoadResult(await api.restoreVersion(id));
        setNotice({ kind: "info", text: `Versión ${id} restaurada.` });
      } catch (error) {
        setNotice({ kind: "error", text: describeError(error) });
      } finally {
        setBusy(false);
      }
    },
    [applyLoadResult],
  );

  const toggleTheme = useCallback(async () => {
    const next = oppositeTheme(theme);
    setTheme(next);
    try {
      await api.setTheme(next);
    } catch (error) {
      setNotice({ kind: "error", text: describeError(error) });
    }
  }, [theme]);

  return {
    document,
    path,
    findings,
    errors: findings.filter((finding) => finding.severity === "error"),
    warnings: findings.filter((finding) => finding.severity === "warning"),
    dirty,
    busy,
    notice,
    external,
    lock,
    history,
    theme,
    selection,
    pane,
    selectedTable,
    selectedField,
    openFile,
    reload,
    save,
    update,
    select,
    selectPane,
    validateNow,
    clearOrphanLock,
    dismissNotice: () => setNotice(null),
    openHistory,
    closeHistory,
    restoreVersion,
    toggleTheme,
  };
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

import { PROJECT_SELECTION } from "../app/useDictionary";
import type { DictionaryController } from "../app/useDictionary";
import { addTable, moveTable, removeTable, renameTable, tableDependencies } from "../core/edits.ts";
import { primaryLabel } from "../core/labels.ts";

interface TablesPanelProps {
  controller: DictionaryController;
}

/** Panel izquierdo: listado y operaciones sobre tablas. */
export function TablesPanel({ controller }: TablesPanelProps) {
  const { document, selection, select, update } = controller;
  if (!document) {
    return (
      <section className="panel">
        <h2>Tablas</h2>
        <p className="empty">Abrí un DiccionarioDatos.yaml para empezar.</p>
      </section>
    );
  }

  const defaultLanguage = document.project.default_language;
  const activeTables = document.tables.filter((table) => table.status !== "deprecated");
  const deprecatedTables = document.tables.filter((table) => table.status === "deprecated");

  const createTable = async () => {
    await update((draft) => addTable(draft));
  };

  const renameSelected = async () => {
    if (!selection.table) {
      return;
    }
    const next = window.prompt("Nuevo nombre de la tabla", selection.table);
    if (!next || next === selection.table) {
      return;
    }
    await update((draft) => renameTable(draft, selection.table as string, next));
    select(next, selection.field);
  };

  const deleteSelected = async () => {
    if (!selection.table) {
      return;
    }
    const dependencies = tableDependencies(document, selection.table);
    const detail = dependencies.length > 0 ? `\n\nReferencias que quedarán sin relación:\n- ${dependencies.join("\n- ")}` : "";
    if (!window.confirm(`¿Eliminar la tabla ${selection.table}?${detail}`)) {
      return;
    }
    await update((draft) => removeTable(draft, selection.table as string));
  };

  const move = async (delta: number) => {
    if (!selection.table) {
      return;
    }
    await update((draft) => moveTable(draft, selection.table as string, delta));
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Tablas</h2>
        <div className="panel-actions">
          <button type="button" onClick={createTable} title="Nueva tabla">
            +
          </button>
          <button type="button" onClick={renameSelected} disabled={!selection.table} title="Renombrar">
            ✎
          </button>
          <button type="button" onClick={deleteSelected} disabled={!selection.table} title="Eliminar">
            ✕
          </button>
          <button type="button" onClick={() => move(-1)} disabled={!selection.table} title="Subir">
            ↑
          </button>
          <button type="button" onClick={() => move(1)} disabled={!selection.table} title="Bajar">
            ↓
          </button>
        </div>
      </header>
      <ul className="list">
        <li>
          <button
            type="button"
            className={selection.table === PROJECT_SELECTION ? "list-item selected" : "list-item"}
            onClick={() => select(PROJECT_SELECTION, null)}
          >
            <span className="list-title">Proyecto</span>
            <span className="list-subtitle">
              {document.project.name || "sin nombre"} ·{" "}
              {document.project.languages.join(", ") || "sin idiomas"}
            </span>
          </button>
        </li>
        {activeTables.map((table) => (
          <li key={table.name}>
            <button
              type="button"
              className={selection.table === table.name ? "list-item selected" : "list-item"}
              onClick={() => select(table.name, null)}
            >
              <span className="list-title">{primaryLabel(table.label, defaultLanguage) || table.name}</span>
              <span className="list-subtitle">
                {table.name}
                {table.table_role ? ` · ${table.table_role}` : ""} · {table.fields.length} campos
                {table.indexes.length > 0 ? ` · ${table.indexes.length} índices` : ""}
                {table.unique_constraints.length > 0
                  ? ` · ${table.unique_constraints.length} únicos`
                  : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {deprecatedTables.length > 0 ? (
        <details className="deprecated-group">
          <summary>Tablas obsoletas ({deprecatedTables.length})</summary>
          <ul className="list">
            {deprecatedTables.map((table) => (
              <li key={table.name}>
                <button
                  type="button"
                  className={selection.table === table.name ? "list-item selected" : "list-item"}
                  onClick={() => select(table.name, null)}
                >
                  <span className="list-title">{table.name}</span>
                  <span className="list-subtitle">obsoleta</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

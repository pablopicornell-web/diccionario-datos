import type { DictionaryController } from "../app/useDictionary";
import { addField, findField, moveField, removeField, renameField } from "../core/edits.ts";
import { primaryLabel } from "../core/labels.ts";

interface FieldsPanelProps {
  controller: DictionaryController;
}

/** Panel central: campos de la tabla seleccionada. */
export function FieldsPanel({ controller }: FieldsPanelProps) {
  const { document, selection, selectedTable, select, update } = controller;
  if (!document || !selectedTable) {
    return (
      <section className="panel">
        <h2>Campos</h2>
        <p className="empty">Seleccioná una tabla para ver sus campos.</p>
      </section>
    );
  }

  const defaultLanguage = document.project.default_language;
  const tableName = selectedTable.name;
  const currentField = findField(selectedTable, selection.field ?? "");
  const activeFields = selectedTable.fields.filter((field) => field.status !== "deprecated");
  const deprecatedFields = selectedTable.fields.filter((field) => field.status === "deprecated");

  const createField = async () => {
    await update((draft) => addField(draft, tableName));
  };

  const renameSelected = async () => {
    if (!currentField) {
      return;
    }
    const next = window.prompt("Nuevo nombre del campo", currentField.name);
    if (!next || next === currentField.name) {
      return;
    }
    await update((draft) => renameField(draft, tableName, currentField.name, next));
    select(tableName, next);
  };

  const deleteSelected = async () => {
    if (!currentField) {
      return;
    }
    if (!window.confirm(`¿Eliminar el campo ${currentField.name}? Se limpiarán las referencias que lo usaban.`)) {
      return;
    }
    await update((draft) => removeField(draft, tableName, currentField.name));
    select(tableName, null);
  };

  const move = async (delta: number) => {
    if (!currentField) {
      return;
    }
    await update((draft) => moveField(draft, tableName, currentField.name, delta));
  };

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Campos de {tableName}</h2>
        <div className="panel-actions">
          <button type="button" onClick={createField} title="Nuevo campo">
            +
          </button>
          <button type="button" onClick={renameSelected} disabled={!currentField} title="Renombrar">
            ✎
          </button>
          <button type="button" onClick={deleteSelected} disabled={!currentField} title="Eliminar">
            ✕
          </button>
          <button type="button" onClick={() => move(-1)} disabled={!currentField} title="Subir">
            ↑
          </button>
          <button type="button" onClick={() => move(1)} disabled={!currentField} title="Bajar">
            ↓
          </button>
        </div>
      </header>
      <ul className="list">
        {activeFields.map((field) => (
          <li key={field.name}>
            <button
              type="button"
              className={selection.field === field.name ? "list-item selected" : "list-item"}
              onClick={() => select(tableName, field.name)}
            >
              <span className="list-title">{primaryLabel(field.label, defaultLanguage) || field.name}</span>
              <span className="list-subtitle">
                {field.name}
                {field.logical_type ? ` · ${field.logical_type}` : ""}
                {field.required ? " · obligatorio" : ""}
                {field.relation ? ` → ${field.relation.table}` : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {deprecatedFields.length > 0 ? (
        <details className="deprecated-group">
          <summary>Campos obsoletos ({deprecatedFields.length})</summary>
          <ul className="list">
            {deprecatedFields.map((field) => (
              <li key={field.name}>
                <button
                  type="button"
                  className={selection.field === field.name ? "list-item selected" : "list-item"}
                  onClick={() => select(tableName, field.name)}
                >
                  <span className="list-title">{field.name}</span>
                  <span className="list-subtitle">obsoleto</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

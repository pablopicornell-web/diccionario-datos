import type { DictionaryController } from "../app/useDictionary";
import { addUniqueConstraint, removeUniqueConstraint } from "../core/edits.ts";
import type { Table } from "../core/model";
import { CheckboxList } from "./inputs";

interface UniqueConstraintsEditorProps {
  controller: DictionaryController;
  table: Table;
}

/** Restricciones únicas compuestas, definidas a nivel de tabla. */
export function UniqueConstraintsEditor({ controller, table }: UniqueConstraintsEditorProps) {
  const fieldNames = table.fields.map((field) => field.name);

  return (
    <div className="index-editor">
      {table.unique_constraints.length === 0 ? (
        <p className="hint">La tabla no declara restricciones únicas compuestas.</p>
      ) : null}

      {table.unique_constraints.map((constraint, position) => (
        <div className="index-block" key={`restriccion-${position}`}>
          <div className="index-head">
            <span className="meta-label">campos de la restricción</span>
            <button
              type="button"
              title="Quitar restricción"
              onClick={() =>
                void controller.update((draft) => removeUniqueConstraint(draft, table.name, position))
              }
            >
              ✕
            </button>
          </div>
          <CheckboxList
            options={fieldNames}
            selected={constraint.fields}
            onChange={(selected) =>
              void controller.update((draft) => {
                const target = draft.tables.find((item) => item.name === table.name);
                if (target?.unique_constraints[position]) {
                  target.unique_constraints[position].fields = selected;
                }
              })
            }
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => void controller.update((draft) => addUniqueConstraint(draft, table.name))}
      >
        Agregar restricción
      </button>
    </div>
  );
}

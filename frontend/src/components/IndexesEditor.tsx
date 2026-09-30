import type { DictionaryController } from "../app/useDictionary";
import {
  addIndex,
  addIndexField,
  findTable,
  moveIndexField,
  removeIndex,
  removeIndexField,
  renameIndex,
} from "../core/edits.ts";
import type { Document, Index, Table } from "../core/model";
import { NameInput, SelectInput, TriStateInput } from "./inputs";

interface IndexesEditorProps {
  controller: DictionaryController;
  table: Table;
}

/**
 * Editor de índices de tabla: nombre, unicidad y componentes en orden, con
 * dirección ASC/DESC por componente.
 */
export function IndexesEditor({ controller, table }: IndexesEditorProps) {
  const fieldNames = table.fields.map((field) => field.name);

  const apply = (mutator: (draft: Document) => Document) => {
    void controller.update(mutator);
  };

  const updateIndex = (indexName: string, mutator: (index: Index) => void) => {
    void controller.update((draft) => {
      const target = findTable(draft, table.name)?.indexes.find((index) => index.name === indexName);
      if (target) {
        mutator(target);
      }
    });
  };

  return (
    <div className="index-editor">
      {table.indexes.length === 0 ? <p className="hint">La tabla no declara índices.</p> : null}

      {table.indexes.map((index) => (
        <div className="index-block" key={index.name}>
          <div className="index-head">
            <NameInput
              value={index.name}
              onCommit={(next) => apply((draft) => renameIndex(draft, table.name, index.name, next))}
            />
            <span className="meta-label">único</span>
            <TriStateInput
              value={index.unique}
              onChange={(value) => updateIndex(index.name, (draft) => void (draft.unique = value))}
            />
            <button
              type="button"
              title="Eliminar índice"
              onClick={() => apply((draft) => removeIndex(draft, table.name, index.name))}
            >
              ✕
            </button>
          </div>

          {index.fields.map((component, position) => (
            <div className="index-field" key={`${component.name}-${position}`}>
              <SelectInput
                value={component.name}
                options={fieldNames}
                onChange={(value) =>
                  updateIndex(index.name, (draft) => {
                    draft.fields[position] = { ...draft.fields[position], name: value };
                  })
                }
              />
              <SelectInput
                value={component.order}
                options={["asc", "desc"]}
                emptyLabel="asc"
                onChange={(value) =>
                  updateIndex(index.name, (draft) => {
                    draft.fields[position] = { ...draft.fields[position], order: value };
                  })
                }
              />
              <div className="index-field-actions">
                <button
                  type="button"
                  title="Subir componente"
                  onClick={() =>
                    apply((draft) => moveIndexField(draft, table.name, index.name, position, -1))
                  }
                >
                  ↑
                </button>
                <button
                  type="button"
                  title="Bajar componente"
                  onClick={() =>
                    apply((draft) => moveIndexField(draft, table.name, index.name, position, 1))
                  }
                >
                  ↓
                </button>
                <button
                  type="button"
                  title="Quitar componente"
                  onClick={() =>
                    apply((draft) => removeIndexField(draft, table.name, index.name, position))
                  }
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => apply((draft) => addIndexField(draft, table.name, index.name))}
          >
            Agregar componente
          </button>
        </div>
      ))}

      <button type="button" onClick={() => apply((draft) => addIndex(draft, table.name))}>
        Agregar índice
      </button>
    </div>
  );
}

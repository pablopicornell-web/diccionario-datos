import { useState } from "react";

import type { DictionaryController } from "../app/useDictionary";
import { addAvailableSort, findTable, removeAvailableSort } from "../core/edits.ts";
import { setLabel } from "../core/labels.ts";
import type { AvailableSort, Table } from "../core/model";
import { LabelsEditor, SelectInput } from "./inputs";

interface AvailableSortsEditorProps {
  controller: DictionaryController;
  table: Table;
}

/**
 * Órdenes de grilla visibles. Reutilizan índices existentes: no se redefine el
 * orden, sólo se elige cuál se ofrece y con qué etiqueta.
 */
export function AvailableSortsEditor({ controller, table }: AvailableSortsEditorProps) {
  const [candidate, setCandidate] = useState("");
  const languages = controller.document?.project.languages ?? [];
  const indexNames = table.indexes.map((index) => index.name);
  const sorts = table.ui?.available_sorts ?? [];
  const pending = indexNames.filter((name) => !sorts.some((sort) => sort.index === name));

  const updateSort = (position: number, mutator: (sort: AvailableSort) => void) => {
    void controller.update((draft) => {
      const sort = findTable(draft, table.name)?.ui?.available_sorts?.[position];
      if (sort) {
        mutator(sort);
      }
    });
  };

  return (
    <div className="index-editor">
      {table.indexes.length === 0 ? <p className="hint">Primero definí al menos un índice.</p> : null}

      {sorts.map((sort, position) => (
        <div className="index-block" key={`${sort.index}-${position}`}>
          <div className="index-head">
            <SelectInput
              value={sort.index}
              options={indexNames}
              onChange={(value) =>
                updateSort(position, (draft) => {
                  draft.index = value;
                })
              }
            />
            <button
              type="button"
              title="Quitar orden"
              onClick={() =>
                void controller.update((draft) => removeAvailableSort(draft, table.name, position))
              }
            >
              ✕
            </button>
          </div>
          <LabelsEditor
            labels={sort.label}
            languages={languages}
            onChange={(language, text) =>
              updateSort(position, (draft) => {
                draft.label = setLabel(draft.label, language, text);
              })
            }
          />
        </div>
      ))}

      {pending.length > 0 ? (
        <div className="index-head">
          <SelectInput value={candidate} options={pending} onChange={setCandidate} />
          <button
            type="button"
            disabled={candidate === ""}
            onClick={() => {
              const chosen = candidate;
              setCandidate("");
              void controller.update((draft) => addAvailableSort(draft, table.name, chosen));
            }}
          >
            Agregar orden
          </button>
        </div>
      ) : null}
    </div>
  );
}

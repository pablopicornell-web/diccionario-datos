import type { DictionaryController } from "../app/useDictionary";
import { findTable, renameTable } from "../core/edits.ts";
import { setLabel } from "../core/labels.ts";
import { DELETE_MODES, NAVIGATION_SECTIONS, STATUSES, TABLE_ROLES } from "../core/model";
import { MAX_DISPLAY_FIELDS } from "../core/model";
import type { Table } from "../core/model";
import { setDisplayField } from "../core/edits.ts";
import { AvailableSortsEditor } from "./AvailableSortsEditor";
import { IndexesEditor } from "./IndexesEditor";
import { UniqueConstraintsEditor } from "./UniqueConstraintsEditor";
import {
  CheckboxList,
  FieldRow,
  LabelsEditor,
  NameInput,
  Section,
  SelectInput,
  TextArea,
  TextInput,
  TriStateInput,
} from "./inputs";

interface TablePropertiesProps {
  controller: DictionaryController;
  table: Table;
}

/** Propiedades de la tabla seleccionada. */
export function TableProperties({ controller, table }: TablePropertiesProps) {
  const document = controller.document;
  if (!document) {
    return null;
  }
  const languages = document.project.languages;
  const fieldNames = table.fields.map((field) => field.name);
  const indexNames = table.indexes.map((index) => index.name);

  const updateTable = (mutator: (draft: Table) => void) => {
    void controller.update((draft) => {
      const target = findTable(draft, table.name);
      if (target) {
        mutator(target);
      }
    });
  };

  const rename = (next: string) => {
    if (next === table.name) {
      return;
    }
    void controller.update((draft) => renameTable(draft, table.name, next));
    controller.select(next, controller.selection.field);
  };

  return (
    <div className="properties">
      <Section title="General">
        <FieldRow label="Nombre">
          <NameInput value={table.name} onCommit={rename} />
        </FieldRow>
        <FieldRow label="Nombre físico">
          <TextInput
            value={table.physical_name}
            onChange={(value) => updateTable((draft) => void (draft.physical_name = value))}
          />
        </FieldRow>
        <FieldRow label="Alias de código">
          <TextInput
            value={table.code_alias}
            onChange={(value) => updateTable((draft) => void (draft.code_alias = value))}
          />
        </FieldRow>
        <FieldRow label="Rol">
          <SelectInput
            value={table.table_role}
            options={TABLE_ROLES}
            onChange={(value) => updateTable((draft) => void (draft.table_role = value))}
          />
        </FieldRow>
        <FieldRow label="Estado">
          <SelectInput
            value={table.status}
            options={STATUSES}
            onChange={(value) => updateTable((draft) => void (draft.status = value))}
          />
        </FieldRow>
      </Section>

      <Section title="Etiquetas">
        <LabelsEditor
          labels={table.label}
          languages={languages}
          onChange={(language, text) =>
            updateTable((draft) => void (draft.label = setLabel(draft.label, language, text)))
          }
        />
      </Section>

      <Section title="Textos">
        <FieldRow label="Descripción">
          <TextArea
            value={table.description}
            onChange={(value) => updateTable((draft) => void (draft.description = value))}
          />
        </FieldRow>
        <FieldRow label="Notas">
          <TextArea
            value={table.notes}
            onChange={(value) => updateTable((draft) => void (draft.notes = value))}
          />
        </FieldRow>
      </Section>

      <Section title="Clave y presentación">
        <FieldRow label="Clave primaria">
          <CheckboxList
            options={fieldNames}
            selected={table.primary_key}
            onChange={(selected) => updateTable((draft) => void (draft.primary_key = selected))}
          />
        </FieldRow>
        <FieldRow
          label="Representación visible"
          hint="Hasta 5 campos de esta tabla, en orden. La FK sigue guardando la clave."
        >
          <div className="display-fields">
            {Array.from({ length: MAX_DISPLAY_FIELDS }, (_, position) => {
              const current = table.display_fields[position] ?? "";
              const usedElsewhere = table.display_fields.filter(
                (name, index) => index !== position && name !== "",
              );
              const options = fieldNames.filter(
                (name) => name === current || !usedElsewhere.includes(name),
              );
              return (
                <SelectInput
                  key={`display-${position}`}
                  value={current}
                  options={options}
                  emptyLabel="(vacío)"
                  onChange={(value) =>
                    void controller.update((draft) =>
                      setDisplayField(draft, table.name, position, value),
                    )
                  }
                />
              );
            })}
          </div>
        </FieldRow>
        <FieldRow label="Modo de borrado">
          <SelectInput
            value={table.lifecycle?.delete_mode ?? ""}
            options={DELETE_MODES}
            onChange={(value) =>
              updateTable((draft) => {
                if (value === "") {
                  draft.lifecycle = null;
                  return;
                }
                draft.lifecycle = {
                  delete_mode: value,
                  field: draft.lifecycle?.field ?? "",
                  deleted_value: draft.lifecycle?.deleted_value ?? "",
                };
              })
            }
          />
        </FieldRow>
        {table.lifecycle?.delete_mode === "soft" || table.lifecycle?.delete_mode === "status" ? (
          <FieldRow label="Campo de borrado">
            <SelectInput
              value={table.lifecycle?.field ?? ""}
              options={fieldNames}
              onChange={(value) =>
                updateTable((draft) => {
                  if (draft.lifecycle) {
                    draft.lifecycle = { ...draft.lifecycle, field: value };
                  }
                })
              }
            />
          </FieldRow>
        ) : null}
        {table.lifecycle?.delete_mode === "status" ? (
          <FieldRow label="Valor de borrado">
            <TextInput
              value={table.lifecycle?.deleted_value ?? ""}
              onChange={(value) =>
                updateTable((draft) => {
                  if (draft.lifecycle) {
                    draft.lifecycle = { ...draft.lifecycle, deleted_value: value };
                  }
                })
              }
            />
          </FieldRow>
        ) : null}
      </Section>

      <Section title="Navegación">
        <FieldRow label="Mantenimiento">
          <TriStateInput
            value={table.ui?.maintenance}
            onChange={(value) =>
              updateTable((draft) => {
                draft.ui = { default_sort: "", available_sorts: [], ...draft.ui, maintenance: value };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Sección">
          <SelectInput
            value={table.ui?.navigation?.section ?? ""}
            options={NAVIGATION_SECTIONS}
            onChange={(value) =>
              updateTable((draft) => {
                const ui = { default_sort: "", available_sorts: [], ...draft.ui };
                ui.navigation = value === "" ? null : { section: value };
                draft.ui = ui;
              })
            }
          />
        </FieldRow>
        {(["create", "edit", "delete", "view"] as const).map((action) => (
          <FieldRow key={action} label={`Acción ${action}`}>
            <TriStateInput
              value={table.ui?.actions?.[action]}
              onChange={(value) =>
                updateTable((draft) => {
                  const ui = { default_sort: "", available_sorts: [], ...draft.ui };
                  ui.actions = { ...ui.actions, [action]: value };
                  draft.ui = ui;
                })
              }
            />
          </FieldRow>
        ))}
      </Section>

      <Section title="Índices">
        <IndexesEditor controller={controller} table={table} />
      </Section>

      <Section title="Órdenes de grilla">
        <FieldRow label="Orden por defecto" hint="Reutiliza un índice existente.">
          <SelectInput
            value={table.ui?.default_sort ?? ""}
            options={indexNames}
            onChange={(value) =>
              updateTable((draft) => {
                draft.ui = { default_sort: value, available_sorts: [], ...draft.ui };
              })
            }
          />
        </FieldRow>
        <AvailableSortsEditor controller={controller} table={table} />
      </Section>

      <Section title="Restricciones únicas">
        <UniqueConstraintsEditor controller={controller} table={table} />
      </Section>

    </div>
  );
}

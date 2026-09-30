import type { DictionaryController } from "../app/useDictionary";
import { findField, findTable, renameField } from "../core/edits.ts";
import { setLabel } from "../core/labels.ts";
import {
  ALIGNMENTS,
  CANONICAL_TEMPORAL_FORMATS,
  DURATION_UNITS,
  GENERATED_STRATEGIES,
  LOOKUP_SEARCH_MODES,
  LOGICAL_TYPES,
  REFERENTIAL_ACTIONS,
  SEMANTIC_KINDS,
  STATUSES,
  SYSTEM_DEFAULT_VALUES,
  UI_CONTROLS,
} from "../core/model";
import type { Field, LookupUI, NumberFormat, Table } from "../core/model";
import { formatLiteralValue, parseLiteralValue } from "../core/values.ts";
import { AllowedValuesEditor } from "./AllowedValuesEditor";
import {
  CheckboxList,
  FieldRow,
  LabelsEditor,
  NameInput,
  NumberInput,
  Section,
  SelectInput,
  TextArea,
  TextInput,
  TriStateInput,
} from "./inputs";

interface FieldPropertiesProps {
  controller: DictionaryController;
  table: Table;
  field: Field;
}

/** Propiedades del campo seleccionado. */
export function FieldProperties({ controller, table, field }: FieldPropertiesProps) {
  const document = controller.document;
  if (!document) {
    return null;
  }
  const languages = document.project.languages;
  const engines = document.database.engines;
  const tableNames = document.tables.map((item) => item.name);
  const relatedTable = field.relation ? findTable(document, field.relation.table) : undefined;
  const relatedFieldNames = relatedTable?.fields.map((item) => item.name) ?? [];

  const updateField = (mutator: (draft: Field) => void) => {
    void controller.update((draft) => {
      const target = findField(findTable(draft, table.name), field.name);
      if (target) {
        mutator(target);
      }
    });
  };

  const rename = (next: string) => {
    if (next === field.name) {
      return;
    }
    void controller.update((draft) => renameField(draft, table.name, field.name, next));
    controller.select(table.name, next);
  };

  const setPhysical = (engine: string, type: string, length: number | null) => {
    updateField((draft) => {
      const physical = { ...(draft.physical ?? {}) };
      if (type === "") {
        delete physical[engine];
      } else {
        physical[engine] = { type, length };
      }
      draft.physical = Object.keys(physical).length > 0 ? physical : null;
    });
  };

  return (
    <div className="properties">
      <Section title="General">
        <FieldRow label="Nombre">
          <NameInput value={field.name} onCommit={rename} />
        </FieldRow>
        <FieldRow label="Nombre físico">
          <TextInput
            value={field.physical_name}
            onChange={(value) => updateField((draft) => void (draft.physical_name = value))}
          />
        </FieldRow>
        <FieldRow label="Estado">
          <SelectInput
            value={field.status}
            options={STATUSES}
            onChange={(value) => updateField((draft) => void (draft.status = value))}
          />
        </FieldRow>
        <FieldRow label="Descripción">
          <TextArea
            value={field.description}
            rows={2}
            onChange={(value) => updateField((draft) => void (draft.description = value))}
          />
        </FieldRow>
        <FieldRow label="Notas">
          <TextArea
            value={field.notes}
            rows={2}
            onChange={(value) => updateField((draft) => void (draft.notes = value))}
          />
        </FieldRow>
      </Section>

      <Section title="Etiquetas">
        <LabelsEditor
          labels={field.label}
          languages={languages}
          onChange={(language, text) =>
            updateField((draft) => void (draft.label = setLabel(draft.label, language, text)))
          }
        />
      </Section>

      <Section title="Datos">
        <FieldRow
          label="Tipo lógico"
          hint={
            CANONICAL_TEMPORAL_FORMATS[field.logical_type]
              ? `Valor canónico: ${CANONICAL_TEMPORAL_FORMATS[field.logical_type]}`
              : undefined
          }
        >
          <SelectInput
            value={field.logical_type}
            options={LOGICAL_TYPES}
            onChange={(value) => updateField((draft) => void (draft.logical_type = value))}
          />
        </FieldRow>
        <FieldRow label="Longitud" hint="Máximo de caracteres para texto.">
          <NumberInput
            value={field.length}
            onChange={(value) => updateField((draft) => void (draft.length = value))}
          />
        </FieldRow>
        <FieldRow label="Precisión" hint="Cantidad total de dígitos.">
          <NumberInput
            value={field.precision}
            onChange={(value) => updateField((draft) => void (draft.precision = value))}
          />
        </FieldRow>
        <FieldRow label="Escala" hint="Posiciones decimales.">
          <NumberInput
            value={field.scale}
            onChange={(value) => updateField((draft) => void (draft.scale = value))}
          />
        </FieldRow>
        <FieldRow label="Unidad" hint="Sólo para duration.">
          <SelectInput
            value={field.unit}
            options={DURATION_UNITS}
            onChange={(value) => updateField((draft) => void (draft.unit = value))}
          />
        </FieldRow>
        <FieldRow label="Obligatorio">
          <TriStateInput
            value={field.required}
            onChange={(value) => updateField((draft) => void (draft.required = value))}
          />
        </FieldRow>
        <FieldRow label="Único">
          <TriStateInput
            value={field.unique}
            onChange={(value) => updateField((draft) => void (draft.unique = value))}
          />
        </FieldRow>
        <FieldRow label="Auditable" hint="Sus cambios pueden generar un evento de auditoría.">
          <TriStateInput
            value={field.auditable}
            onChange={(value) => updateField((draft) => void (draft.auditable = value))}
          />
        </FieldRow>
        <FieldRow label="Generación">
          <SelectInput
            value={field.generated?.strategy ?? ""}
            options={GENERATED_STRATEGIES}
            onChange={(value) =>
              updateField((draft) => {
                draft.generated = value === "" ? null : { strategy: value };
              })
            }
          />
        </FieldRow>
      </Section>

      <Section title="Valor predeterminado">
        <FieldRow label="Origen">
          <SelectInput
            value={field.default?.kind ?? ""}
            options={["literal", "system"]}
            onChange={(value) =>
              updateField((draft) => {
                draft.default = value === "" ? null : { kind: value, value: "" };
              })
            }
          />
        </FieldRow>
        {field.default?.kind === "literal" ? (
          <FieldRow label="Valor">
            <TextInput
              value={formatLiteralValue(field.default.value)}
              onChange={(text) =>
                updateField((draft) => {
                  if (draft.default) {
                    draft.default.value = parseLiteralValue(text, draft.logical_type);
                  }
                })
              }
            />
          </FieldRow>
        ) : null}
        {field.default?.kind === "system" ? (
          <FieldRow label="Valor del sistema">
            <SelectInput
              value={String(field.default.value ?? "")}
              options={SYSTEM_DEFAULT_VALUES}
              onChange={(value) =>
                updateField((draft) => {
                  if (draft.default) {
                    draft.default.value = value;
                  }
                })
              }
            />
          </FieldRow>
        ) : null}
      </Section>

      <Section title="Semántica">
        <FieldRow label="Tipo semántico">
          <SelectInput
            value={field.semantic?.kind ?? ""}
            options={SEMANTIC_KINDS}
            onChange={(value) =>
              updateField((draft) => {
                if (value === "") {
                  draft.semantic = null;
                  return;
                }
                draft.semantic = {
                  kind: value,
                  currency: draft.semantic?.currency ?? "",
                  format: draft.semantic?.format ?? "",
                };
              })
            }
          />
        </FieldRow>
        {field.semantic?.kind === "currency" ? (
          <FieldRow label="Moneda">
            <TextInput
              value={field.semantic.currency}
              onChange={(value) =>
                updateField((draft) => {
                  if (draft.semantic) {
                    draft.semantic.currency = value;
                  }
                })
              }
            />
          </FieldRow>
        ) : null}
      </Section>

      <Section title="Validación">
        <FieldRow label="Mínimo">
          <NumberInput
            value={field.validation?.min ?? null}
            onChange={(value) =>
              updateField((draft) => {
                draft.validation = { pattern: "", ...draft.validation, min: value };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Máximo">
          <NumberInput
            value={field.validation?.max ?? null}
            onChange={(value) =>
              updateField((draft) => {
                draft.validation = { pattern: "", ...draft.validation, max: value };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Longitud mínima">
          <NumberInput
            value={field.validation?.min_length ?? null}
            onChange={(value) =>
              updateField((draft) => {
                draft.validation = { pattern: "", ...draft.validation, min_length: value };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Patrón">
          <TextInput
            value={field.validation?.pattern ?? ""}
            onChange={(value) =>
              updateField((draft) => {
                draft.validation = { pattern: value, ...draft.validation };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Permite vacío">
          <TriStateInput
            value={field.validation?.allow_empty}
            onChange={(value) =>
              updateField((draft) => {
                draft.validation = { pattern: "", ...draft.validation, allow_empty: value };
              })
            }
          />
        </FieldRow>
        <button type="button" onClick={() => updateField((draft) => void (draft.validation = null))}>
          Quitar validaciones
        </button>
      </Section>

      <Section title="Relación">
        <FieldRow label="Tabla relacionada">
          <SelectInput
            value={field.relation?.table ?? ""}
            options={tableNames}
            onChange={(value) =>
              updateField((draft) => {
                draft.relation =
                  value === ""
                    ? null
                    : { table: value, field: "", on_delete: "", on_update: "" };
              })
            }
          />
        </FieldRow>
        {field.relation ? (
          <>
            <FieldRow label="Campo relacionado">
              <SelectInput
                value={field.relation.field}
                options={relatedFieldNames}
                onChange={(value) =>
                  updateField((draft) => {
                    if (draft.relation) {
                      draft.relation.field = value;
                    }
                  })
                }
              />
            </FieldRow>
            <FieldRow label="Al eliminar">
              <SelectInput
                value={field.relation.on_delete}
                options={REFERENTIAL_ACTIONS}
                onChange={(value) =>
                  updateField((draft) => {
                    if (draft.relation) {
                      draft.relation.on_delete = value;
                    }
                  })
                }
              />
            </FieldRow>
            <FieldRow label="Al actualizar">
              <SelectInput
                value={field.relation.on_update}
                options={REFERENTIAL_ACTIONS}
                onChange={(value) =>
                  updateField((draft) => {
                    if (draft.relation) {
                      draft.relation.on_update = value;
                    }
                  })
                }
              />
            </FieldRow>
          </>
        ) : null}
      </Section>

      <Section title="Valores permitidos">
        <AllowedValuesEditor
          field={field}
          languages={languages}
          onChange={(values) => updateField((draft) => void (draft.allowed_values = values))}
        />
      </Section>

      <Section title="Presentación">
        <FieldRow label="Control">
          <SelectInput
            value={field.ui?.control ?? ""}
            options={UI_CONTROLS}
            onChange={(value) =>
              updateField((draft) => {
                draft.ui = { control: value, align: "", ...draft.ui };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Alineación">
          <SelectInput
            value={field.ui?.align ?? ""}
            options={ALIGNMENTS}
            onChange={(value) =>
              updateField((draft) => {
                draft.ui = { control: "", align: value, ...draft.ui };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Ancho del control">
          <NumberInput
            value={field.ui?.width ?? null}
            onChange={(value) =>
              updateField((draft) => {
                draft.ui = { control: "", align: "", ...draft.ui, width: value };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Ancho de columna">
          <NumberInput
            value={field.ui?.column_width ?? null}
            onChange={(value) =>
              updateField((draft) => {
                draft.ui = { control: "", align: "", ...draft.ui, column_width: value };
              })
            }
          />
        </FieldRow>
        {(
          [
            ["form_visible", "Visible en formulario"],
            ["form_readonly", "Sólo lectura en formulario"],
            ["list_visible", "Visible en grilla"],
            ["searchable", "Buscable"],
            ["filterable", "Filtrable"],
            ["sortable", "Ordenable"],
            ["column_flexible", "Columna flexible"],
          ] as const
        ).map(([key, label]) => (
          <FieldRow key={key} label={label}>
            <TriStateInput
              value={field.ui?.[key]}
              onChange={(value) =>
                updateField((draft) => {
                  draft.ui = { control: "", align: "", ...draft.ui, [key]: value };
                })
              }
            />
          </FieldRow>
        ))}
        <FieldRow label="Separador de miles" hint="Sólo presentación: no cambia el valor guardado.">
          <TriStateInput
            value={field.ui?.format?.thousands_separator}
            onChange={(value) =>
              updateField((draft) => updateFormat(draft, (format) => void (format.thousands_separator = value)))
            }
          />
        </FieldRow>
        <FieldRow label="Decimales">
          <NumberInput
            value={field.ui?.format?.decimal_places ?? null}
            onChange={(value) =>
              updateField((draft) => updateFormat(draft, (format) => void (format.decimal_places = value)))
            }
          />
        </FieldRow>
        <FieldRow label="Ceros a la izquierda">
          <NumberInput
            value={field.ui?.format?.leading_zeros ?? null}
            onChange={(value) =>
              updateField((draft) => updateFormat(draft, (format) => void (format.leading_zeros = value)))
            }
          />
        </FieldRow>
      </Section>

      {field.ui?.control === "lookup" ? (
        <Section title="Lookup">
          <FieldRow label="Alta inmediata" hint="El control ofrece crear el registro en la tabla relacionada.">
            <TriStateInput
              value={field.ui?.lookup?.allow_create}
              onChange={(value) =>
                updateField((draft) =>
                  updateLookup(draft, (lookup) => void (lookup.allow_create = value)),
                )
              }
            />
          </FieldRow>
          <FieldRow label="Modos de búsqueda" hint="Sin declarar, se asume prefix.">
            <CheckboxList
              options={LOOKUP_SEARCH_MODES}
              selected={field.ui?.lookup?.search_modes ?? []}
              onChange={(selected) =>
                updateField((draft) =>
                  updateLookup(draft, (lookup) => {
                    lookup.search_modes = selected;
                    if (!selected.includes(lookup.default_search_mode)) {
                      lookup.default_search_mode = selected[0] ?? "";
                    }
                  }),
                )
              }
            />
          </FieldRow>
          <FieldRow label="Modo por defecto">
            <SelectInput
              value={field.ui?.lookup?.default_search_mode ?? ""}
              options={
                field.ui?.lookup?.search_modes?.length ? field.ui.lookup.search_modes : ["prefix"]
              }
              emptyLabel="prefix"
              onChange={(value) =>
                updateField((draft) =>
                  updateLookup(draft, (lookup) => void (lookup.default_search_mode = value)),
                )
              }
            />
          </FieldRow>
          <FieldRow
            label="El operador puede cambiar el modo"
            hint="La preferencia elegida no se guarda en el diccionario."
          >
            <TriStateInput
              value={field.ui?.lookup?.user_can_switch_mode}
              onChange={(value) =>
                updateField((draft) =>
                  updateLookup(draft, (lookup) => void (lookup.user_can_switch_mode = value)),
                )
              }
            />
          </FieldRow>
        </Section>
      ) : null}

      <Section title="Definición física">
        {engines.length === 0 ? (
          <p className="hint">El proyecto no declara motores.</p>
        ) : (
          engines.map((engine) => (
            <div key={engine} className="physical-row">
              <span className="language-tag">{engine}</span>
              <TextInput
                value={field.physical?.[engine]?.type ?? ""}
                placeholder="tipo físico"
                onChange={(value) => setPhysical(engine, value, field.physical?.[engine]?.length ?? null)}
              />
              <NumberInput
                value={field.physical?.[engine]?.length ?? null}
                placeholder="longitud"
                onChange={(value) => setPhysical(engine, field.physical?.[engine]?.type ?? "", value)}
              />
            </div>
          ))
        )}
      </Section>

      <Section title="Cálculo">
        <FieldRow label="Habilitado">
          <TriStateInput
            value={field.calculated?.enabled}
            onChange={(value) =>
              updateField((draft) => {
                draft.calculated = {
                  enabled: value,
                  expression: draft.calculated?.expression ?? "",
                  stored: draft.calculated?.stored ?? null,
                };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Expresión">
          <TextInput
            value={field.calculated?.expression ?? ""}
            onChange={(value) =>
              updateField((draft) => {
                draft.calculated = {
                  enabled: draft.calculated?.enabled ?? null,
                  expression: value,
                  stored: draft.calculated?.stored ?? null,
                };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Almacenado">
          <TriStateInput
            value={field.calculated?.stored}
            onChange={(value) =>
              updateField((draft) => {
                draft.calculated = {
                  enabled: draft.calculated?.enabled ?? null,
                  expression: draft.calculated?.expression ?? "",
                  stored: value,
                };
              })
            }
          />
        </FieldRow>
      </Section>

      <Section title="Obsolescencia">
        <FieldRow label="Desde schema">
          <NumberInput
            value={field.deprecation?.since_schema_version ?? null}
            onChange={(value) =>
              updateField((draft) => {
                draft.deprecation = {
                  replacement: draft.deprecation?.replacement ?? "",
                  notes: draft.deprecation?.notes ?? "",
                  since_schema_version: value,
                };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Reemplazo">
          <TextInput
            value={field.deprecation?.replacement ?? ""}
            onChange={(value) =>
              updateField((draft) => {
                draft.deprecation = {
                  replacement: value,
                  notes: draft.deprecation?.notes ?? "",
                  since_schema_version: draft.deprecation?.since_schema_version ?? null,
                };
              })
            }
          />
        </FieldRow>
        <FieldRow label="Notas">
          <TextArea
            value={field.deprecation?.notes ?? ""}
            rows={2}
            onChange={(value) =>
              updateField((draft) => {
                draft.deprecation = {
                  replacement: draft.deprecation?.replacement ?? "",
                  notes: value,
                  since_schema_version: draft.deprecation?.since_schema_version ?? null,
                };
              })
            }
          />
        </FieldRow>
      </Section>
    </div>
  );
}

/** Actualiza el bloque ui.format del campo, creándolo cuando falta. */
function updateFormat(field: Field, mutator: (format: NumberFormat) => void): void {
  const ui = { control: "", align: "", ...field.ui };
  const format: NumberFormat = { ...(ui.format ?? {}) };
  mutator(format);
  ui.format = format;
  field.ui = ui;
}

/** Actualiza la metadata del control lookup, creándola cuando falta. */
function updateLookup(field: Field, mutator: (lookup: LookupUI) => void): void {
  const ui = { control: "", align: "", ...field.ui };
  const lookup: LookupUI = { search_modes: [], default_search_mode: "", ...(ui.lookup ?? {}) };
  mutator(lookup);
  ui.lookup = lookup;
  field.ui = ui;
}

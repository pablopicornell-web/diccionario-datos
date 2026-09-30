import { setLabel } from "../core/labels.ts";
import type { AllowedValue, Field } from "../core/model";
import { LabelsEditor, NumberInput, TextInput, TriStateInput } from "./inputs";
import { describeValue, formatLiteralValue, parseLiteralValue } from "../core/values.ts";

interface AllowedValuesEditorProps {
  field: Field;
  languages: string[];
  onChange: (values: AllowedValue[]) => void;
}

/** Editor de listas fijas: valor imprescindible y etiquetas opcionales. */
export function AllowedValuesEditor({ field, languages, onChange }: AllowedValuesEditorProps) {
  const values = field.allowed_values ?? [];

  const replace = (index: number, next: AllowedValue) => {
    const copy = values.map((item, position) => (position === index ? next : item));
    onChange(copy);
  };

  return (
    <div className="allowed-values">
      {values.length === 0 ? <p className="hint">Sin valores permitidos.</p> : null}
      {values.map((item, index) => (
        <div className="allowed-value" key={`${describeValue(item.value)}-${index}`}>
          <div className="allowed-value-head">
            <TextInput
              value={formatLiteralValue(item.value)}
              onChange={(text) =>
                replace(index, { ...item, value: parseLiteralValue(text, field.logical_type) })
              }
              placeholder="valor"
            />
            <button
              type="button"
              title="Quitar valor"
              onClick={() => onChange(values.filter((_, position) => position !== index))}
            >
              ✕
            </button>
          </div>
          <LabelsEditor
            labels={item.label}
            languages={languages}
            onChange={(language, text) =>
              replace(index, { ...item, label: setLabel(item.label, language, text) })
            }
          />
          <div className="allowed-value-meta">
            <span className="meta-label">orden</span>
            <NumberInput
              value={item.order ?? null}
              onChange={(value) => replace(index, { ...item, order: value })}
            />
            <span className="meta-label">activo</span>
            <TriStateInput
              value={item.active}
              onChange={(value) => replace(index, { ...item, active: value })}
            />
            <span className="meta-label">color</span>
            <TextInput
              value={item.color}
              onChange={(value) => replace(index, { ...item, color: value })}
            />
            <span className="meta-label">notas</span>
            <TextInput
              value={item.notes}
              onChange={(value) => replace(index, { ...item, notes: value })}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...values,
            { value: "", label: null, order: null, active: null, color: "", notes: "" },
          ])
        }
      >
        Agregar valor
      </button>
    </div>
  );
}

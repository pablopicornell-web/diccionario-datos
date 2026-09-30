import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { getLabel } from "../core/labels.ts";
import type { Labels } from "../core/model";

interface FieldRowProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

/** Fila etiqueta + control de los paneles de propiedades. */
export function FieldRow({ label, children, hint }: FieldRowProps) {
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <div className="field-control">
        {children}
        {hint ? <p className="hint">{hint}</p> : null}
      </div>
    </div>
  );
}

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TextInput({ value, onChange, placeholder, disabled }: TextInputProps) {
  return (
    <input
      className="input"
      type="text"
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      spellCheck={false}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface NameInputProps {
  value: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
}

/**
 * Nombre técnico editable. El cambio se aplica al confirmar (Enter o salir del
 * campo) para poder renombrar y actualizar referencias en un solo paso.
 */
export function NameInput({ value, onCommit, disabled }: NameInputProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) {
      onCommit(next);
    } else {
      setDraft(value);
    }
  };

  return (
    <input
      className="input monospace"
      type="text"
      value={draft}
      disabled={disabled}
      spellCheck={false}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(value);
        }
      }}
    />
  );
}

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function TextArea({ value, onChange, rows = 3, placeholder }: TextAreaProps) {
  return (
    <textarea
      className="input"
      rows={rows}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface CheckboxListProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

/** Selección múltiple mediante casillas: se usa para la clave primaria. */
export function CheckboxList({ options, selected, onChange }: CheckboxListProps) {
  if (options.length === 0) {
    return <p className="hint">No hay campos disponibles.</p>;
  }
  return (
    <div className="checkbox-list">
      {options.map((option) => (
        <label key={option} className="checkbox-item">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...selected, option]
                  : selected.filter((item) => item !== option),
              )
            }
          />
          <span className="monospace">{option}</span>
        </label>
      ))}
    </div>
  );
}

interface NumberInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function NumberInput({ value, onChange, placeholder, disabled }: NumberInputProps) {
  return (
    <input
      className="input"
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
    />
  );
}

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  emptyLabel?: string;
  disabled?: boolean;
}

export function SelectInput({
  value,
  onChange,
  options,
  emptyLabel = "(sin definir)",
  disabled,
}: SelectInputProps) {
  return (
    <select
      className="input"
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

interface TriStateInputProps {
  value: boolean | null | undefined;
  onChange: (value: boolean | null) => void;
}

/** Booleano de tres estados: sin definir, sí o no. */
export function TriStateInput({ value, onChange }: TriStateInputProps) {
  const current = value === null || value === undefined ? "" : value ? "true" : "false";
  return (
    <select
      className="input"
      value={current}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === "" ? null : next === "true");
      }}
    >
      <option value="">sin definir</option>
      <option value="true">sí</option>
      <option value="false">no</option>
    </select>
  );
}

interface LabelsEditorProps {
  labels: Labels | null | undefined;
  languages: string[];
  onChange: (language: string, text: string) => void;
}

/** Etiquetas multilenguaje declaradas por el proyecto. */
export function LabelsEditor({ labels, languages, onChange }: LabelsEditorProps) {
  const effective = languages.length > 0 ? languages : ["es"];
  return (
    <div className="labels-editor">
      {effective.map((language) => (
        <div className="labels-row" key={language}>
          <span className="language-tag">{language}</span>
          <TextInput value={getLabel(labels, language)} onChange={(text) => onChange(language, text)} />
        </div>
      ))}
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
}

/**
 * Sección plegable del panel de propiedades. Arranca cerrada por norma: la
 * interfaz no despliega ningún menú por su cuenta.
 */
export function Section({ title, children }: SectionProps) {
  return (
    <details className="section">
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
}

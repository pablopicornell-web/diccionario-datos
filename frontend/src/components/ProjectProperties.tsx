import { useState } from "react";

import type { DictionaryController } from "../app/useDictionary";
import { addListItem, removeListItem, replaceListItem } from "../core/edits.ts";
import { FieldRow, Section, SelectInput, TextArea, TextInput } from "./inputs";

interface ProjectPropertiesProps {
  controller: DictionaryController;
}

/** Cabecera del diccionario: proyecto, idiomas y motores declarados. */
export function ProjectProperties({ controller }: ProjectPropertiesProps) {
  const [newLanguage, setNewLanguage] = useState("");
  const [newEngine, setNewEngine] = useState("");
  const document = controller.document;
  if (!document) {
    return null;
  }
  const project = document.project;
  const database = document.database;

  return (
    <div className="properties">
      <Section title="Proyecto">
        <FieldRow label="Nombre">
          <TextInput
            value={project.name}
            onChange={(value) => void controller.update((draft) => void (draft.project.name = value))}
          />
        </FieldRow>
        <FieldRow label="Descripción">
          <TextArea
            value={project.description}
            rows={2}
            onChange={(value) =>
              void controller.update((draft) => void (draft.project.description = value))
            }
          />
        </FieldRow>
        <FieldRow label="Idioma por defecto">
          <SelectInput
            value={project.default_language}
            options={project.languages}
            onChange={(value) =>
              void controller.update((draft) => void (draft.project.default_language = value))
            }
          />
        </FieldRow>
        <FieldRow label="Configuración regional" hint="Por ejemplo es-AR.">
          <TextInput
            value={project.locale}
            onChange={(value) => void controller.update((draft) => void (draft.project.locale = value))}
          />
        </FieldRow>
      </Section>

      <Section title="Idiomas">
        {project.languages.length === 0 ? <p className="hint">Sin idiomas declarados.</p> : null}
        {project.languages.map((language, position) => (
          <div className="list-row" key={`idioma-${position}`}>
            <TextInput
              value={language}
              onChange={(value) =>
                void controller.update((draft) => {
                  draft.project.languages = replaceListItem(draft.project.languages, position, value);
                })
              }
            />
            <button
              type="button"
              title="Quitar idioma"
              onClick={() =>
                void controller.update((draft) => {
                  draft.project.languages = removeListItem(draft.project.languages, language);
                })
              }
            >
              ✕
            </button>
          </div>
        ))}
        <div className="list-row">
          <TextInput value={newLanguage} placeholder="nuevo idioma" onChange={setNewLanguage} />
          <button
            type="button"
            disabled={newLanguage.trim() === ""}
            onClick={() => {
              const language = newLanguage;
              setNewLanguage("");
              void controller.update((draft) => {
                draft.project.languages = addListItem(draft.project.languages, language);
              });
            }}
          >
            Agregar
          </button>
        </div>
      </Section>

      <Section title="Base de datos">
        <FieldRow label="Motor activo">
          <SelectInput
            value={database.active_engine}
            options={database.engines}
            onChange={(value) =>
              void controller.update((draft) => void (draft.database.active_engine = value))
            }
          />
        </FieldRow>
        {database.engines.length === 0 ? <p className="hint">Sin motores declarados.</p> : null}
        {database.engines.map((engine, position) => (
          <div className="list-row" key={`motor-${position}`}>
            <TextInput
              value={engine}
              onChange={(value) =>
                void controller.update((draft) => {
                  draft.database.engines = replaceListItem(draft.database.engines, position, value);
                })
              }
            />
            <button
              type="button"
              title="Quitar motor"
              onClick={() =>
                void controller.update((draft) => {
                  draft.database.engines = removeListItem(draft.database.engines, engine);
                  if (draft.database.active_engine === engine) {
                    draft.database.active_engine = "";
                  }
                })
              }
            >
              ✕
            </button>
          </div>
        ))}
        <div className="list-row">
          <TextInput value={newEngine} placeholder="nuevo motor" onChange={setNewEngine} />
          <button
            type="button"
            disabled={newEngine.trim() === ""}
            onClick={() => {
              const engine = newEngine;
              setNewEngine("");
              void controller.update((draft) => {
                draft.database.engines = addListItem(draft.database.engines, engine);
              });
            }}
          >
            Agregar
          </button>
        </div>
      </Section>
    </div>
  );
}

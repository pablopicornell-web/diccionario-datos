import { PROJECT_SELECTION } from "../app/useDictionary";
import type { DictionaryController } from "../app/useDictionary";
import { FieldProperties } from "./FieldProperties";
import { ProjectProperties } from "./ProjectProperties";
import { TableProperties } from "./TableProperties";

interface PropertiesPanelProps {
  controller: DictionaryController;
}

/** Panel derecho: propiedades del campo o de la tabla seleccionada. */
export function PropertiesPanel({ controller }: PropertiesPanelProps) {
  const { selectedTable, selectedField, selection, pane, select, selectPane } = controller;

  if (selection.table === PROJECT_SELECTION) {
    return (
      <section className="panel wide">
        <header className="panel-header">
          <h2>Propiedades del proyecto</h2>
        </header>
        <ProjectProperties controller={controller} />
      </section>
    );
  }

  if (!selectedTable) {
    return (
      <section className="panel">
        <h2>Propiedades</h2>
        <p className="empty">Seleccioná una tabla o un campo.</p>
      </section>
    );
  }

  const showField = pane === "field" && selectedField !== null;

  return (
    <section className="panel wide">
      <header className="panel-header">
        <h2>
          Propiedades de {showField ? `campo ${selectedField.name}` : `tabla ${selectedTable.name}`}
        </h2>
        <div className="panel-actions">
          <button
            type="button"
            className={showField ? "" : "active"}
            onClick={() => select(selectedTable.name, null)}
          >
            Tabla
          </button>
          <button
            type="button"
            className={showField ? "active" : ""}
            disabled={selectedTable.fields.length === 0}
            onClick={() => {
              if (selectedField) {
                select(selectedTable.name, selectedField.name);
                return;
              }
              selectPane("field");
            }}
          >
            Campo
          </button>
        </div>
      </header>
      {showField ? (
        <FieldProperties
          key={`campo-${selectedField.name}`}
          controller={controller}
          table={selectedTable}
          field={selectedField}
        />
      ) : (
        <TableProperties key={`tabla-${selectedTable.name}`} controller={controller} table={selectedTable} />
      )}
    </section>
  );
}

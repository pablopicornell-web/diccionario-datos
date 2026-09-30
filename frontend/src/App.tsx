import "./App.css";

import { useDictionary } from "./app/useDictionary";
import { FieldsPanel } from "./components/FieldsPanel";
import { FindingsPanel } from "./components/FindingsPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { TablesPanel } from "./components/TablesPanel";
import { Toolbar } from "./components/Toolbar";

/**
 * Composición de la ventana: barra superior, tres paneles de trabajo, panel de
 * validación y panel lateral de historial.
 */
export default function App() {
  const controller = useDictionary();

  return (
    <div className="app">
      <Toolbar controller={controller} />

      {controller.external?.changed ? (
        <div className="banner warning">
          <span>El diccionario fue modificado externamente.</span>
          <button type="button" onClick={controller.reload}>
            Recargar
          </button>
        </div>
      ) : null}

      {controller.lock?.orphan ? (
        <div className="banner danger">
          <span>
            Hay un bloqueo de {controller.lock.lock?.owner ?? "otro proceso"} en{" "}
            {controller.lock.lock?.machine ?? "otra máquina"} desde{" "}
            {controller.lock.lock?.created_at ?? "fecha desconocida"}.
          </span>
          <button type="button" onClick={controller.clearOrphanLock}>
            Liberar bloqueo
          </button>
        </div>
      ) : null}

      {controller.notice ? (
        <div className={`banner ${controller.notice.kind === "error" ? "danger" : "info"}`}>
          <span>{controller.notice.text}</span>
          <button type="button" onClick={controller.dismissNotice}>
            Cerrar
          </button>
        </div>
      ) : null}

      {controller.document ? (
        <main className="workspace">
          <TablesPanel controller={controller} />
          <FieldsPanel controller={controller} />
          <PropertiesPanel controller={controller} />
        </main>
      ) : (
        <main className="welcome">
          <h1>Editor de DiccionarioDatos.yaml</h1>
          <p>Ab&iacute; un diccionario de datos para verlo, editarlo y guardarlo sobre el mismo archivo.</p>
          <button type="button" className="primary" onClick={controller.openFile}>
            Abrir DiccionarioDatos.yaml
          </button>
        </main>
      )}

      {controller.document ? <FindingsPanel controller={controller} /> : null}
      <HistoryPanel controller={controller} />
    </div>
  );
}

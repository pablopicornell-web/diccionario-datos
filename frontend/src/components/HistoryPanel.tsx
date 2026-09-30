import { useState } from "react";

import type { DictionaryController } from "../app/useDictionary";
import * as api from "../api";

interface HistoryPanelProps {
  controller: DictionaryController;
}

/** Panel lateral: versiones guardadas del historial y restauración. */
export function HistoryPanel({ controller }: HistoryPanelProps) {
  const { history, closeHistory, restoreVersion, openHistory } = controller;
  const [summary, setSummary] = useState<{ id: string; text: string } | null>(null);

  if (history === null) {
    return null;
  }

  const showSummary = async (id: string) => {
    try {
      setSummary({ id, text: await api.historySummary(id) });
    } catch (error) {
      setSummary({ id, text: String(error) });
    }
  };

  return (
    <aside className="history-panel">
      <header className="panel-header">
        <h2>Historial</h2>
        <div className="panel-actions">
          <button type="button" onClick={openHistory} title="Actualizar">
            ⟳
          </button>
          <button type="button" onClick={closeHistory} title="Cerrar">
            ✕
          </button>
        </div>
      </header>
      {history.length === 0 ? (
        <p className="hint">Todavía no hay versiones guardadas.</p>
      ) : (
        <ul className="list">
          {history.map((entry) => (
            <li key={entry.id}>
              <div className="history-entry">
                <div className="history-info">
                  <span className="monospace">{entry.id}</span>
                  <span className="hint">
                    {entry.origin}
                    {entry.hasMarkdown ? " · con resumen" : " · sin resumen (sesión interrumpida)"}
                  </span>
                </div>
                <div className="history-actions">
                  <button type="button" onClick={() => showSummary(entry.id)}>
                    Ver resumen
                  </button>
                  <button type="button" onClick={() => restoreVersion(entry.id)}>
                    Restaurar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {summary ? (
        <div className="history-summary">
          <h3>Resumen de {summary.id}</h3>
          <pre>{summary.text || "Sin resumen registrado."}</pre>
        </div>
      ) : null}
    </aside>
  );
}

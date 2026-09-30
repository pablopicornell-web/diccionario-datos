import type { DictionaryController } from "../app/useDictionary";

interface FindingsPanelProps {
  controller: DictionaryController;
}

/** Panel inferior: errores y advertencias de validación estructural. */
export function FindingsPanel({ controller }: FindingsPanelProps) {
  const { findings, select } = controller;
  const errors = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warning");

  return (
    <section className="findings">
      <header className="panel-header">
        <h2>
          Validación · {errors.length} errores · {warnings.length} advertencias
        </h2>
        <span className="hint">Los errores impiden guardar; las advertencias no.</span>
      </header>
      {findings.length === 0 ? (
        <p className="hint">Sin observaciones. El diccionario es válido.</p>
      ) : (
        <ul className="findings-list">
          {findings.map((finding, index) => (
            <li key={`${finding.code}-${finding.table}-${finding.field}-${index}`}>
              <button
                type="button"
                className={`finding ${finding.severity}`}
                onClick={() => {
                  if (finding.table) {
                    select(finding.table, finding.field || null);
                  }
                }}
              >
                <span className="finding-tag">{finding.severity === "error" ? "error" : "aviso"}</span>
                <span>{finding.message}</span>
                {finding.table ? (
                  <span className="monospace hint">
                    {finding.table}
                    {finding.field ? `.${finding.field}` : ""}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

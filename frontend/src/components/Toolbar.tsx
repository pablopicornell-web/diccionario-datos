import type { DictionaryController } from "../app/useDictionary";

interface ToolbarProps {
  controller: DictionaryController;
}

/** Barra superior: archivo, guardado, validación, historial y tema. */
export function Toolbar({ controller }: ToolbarProps) {
  const {
    document,
    path,
    dirty,
    busy,
    errors,
    warnings,
    lock,
    theme,
    openFile,
    reload,
    save,
    validateNow,
    openHistory,
    toggleTheme,
  } = controller;

  return (
    <header className="toolbar">
      <div className="toolbar-group">
        <button type="button" onClick={openFile} disabled={busy}>
          Abrir…
        </button>
        <button type="button" onClick={reload} disabled={!document || busy}>
          Recargar
        </button>
        <button type="button" className="primary" onClick={save} disabled={!document || busy || !dirty}>
          Guardar
        </button>
      </div>
      <div className="toolbar-group grow">
        <span className="path" title={path}>
          {path || "Ningún diccionario abierto"}
        </span>
        {document ? (
          <span className={dirty ? "badge dirty" : "badge"}>
            {dirty ? "cambios sin guardar" : "sin cambios"}
          </span>
        ) : null}
        {document ? <span className="badge">schema {document.schema_version}</span> : null}
        {lock?.orphan ? <span className="badge danger">bloqueado por otro proceso</span> : null}
      </div>
      <div className="toolbar-group">
        <button type="button" onClick={validateNow} disabled={!document}>
          Validar
        </button>
        <span className={errors.length > 0 ? "badge danger" : "badge"}>{errors.length} errores</span>
        <span className="badge">{warnings.length} advertencias</span>
        <button type="button" onClick={openHistory} disabled={!document}>
          Historial
        </button>
        <button type="button" onClick={toggleTheme} title="Cambiar tema claro/oscuro">
          {theme === "dark" ? "Tema oscuro" : "Tema claro"}
        </button>
      </div>
    </header>
  );
}

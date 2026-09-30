import type { Document } from "./model.ts";
import { createField, createTable } from "./model.ts";

/** Diccionario de ejemplo usado por las pruebas del núcleo. */
export function sampleDocument(): Document {
  const localidades = createTable("localidades");
  localidades.table_role = "lookup";
  localidades.display_fields = ["nombre"];
  localidades.primary_key = ["id"];
  const localidadId = createField("id");
  localidadId.logical_type = "integer";
  localidadId.required = true;
  const localidadNombre = createField("nombre");
  localidadNombre.logical_type = "string";
  localidadNombre.length = 60;
  localidades.fields = [localidadId, localidadNombre];

  const usuarios = createTable("usuarios");
  usuarios.primary_key = ["id"];
  const usuarioId = createField("id");
  usuarioId.logical_type = "integer";
  const usuarioLocalidad = createField("localidad_id");
  usuarioLocalidad.logical_type = "integer";
  usuarioLocalidad.relation = {
    table: "localidades",
    field: "id",
    on_delete: "restrict",
    on_update: "",
  };
  usuarios.fields = [usuarioId, usuarioLocalidad];

  return {
    format_version: 2,
    schema_version: 1,
    project: {
      name: "Pruebas",
      description: "",
      default_language: "es",
      languages: ["es", "en"],
      locale: "es-AR",
    },
    database: { active_engine: "sqlite", engines: ["sqlite"] },
    tables: [localidades, usuarios],
  };
}

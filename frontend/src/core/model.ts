/**
 * Tipos del diccionario. Reflejan el JSON que expone el backend Go, por eso los
 * nombres de las propiedades están en el mismo formato que el YAML.
 */

export interface Labels {
  order: string[];
  values: Record<string, string>;
}

export interface Project {
  name: string;
  description: string;
  default_language: string;
  languages: string[];
  locale: string;
}

export interface Database {
  active_engine: string;
  engines: string[];
}

export interface Lifecycle {
  delete_mode: string;
  field: string;
  deleted_value: string;
}

export interface Navigation {
  section: string;
}

export interface TableActions {
  create?: boolean | null;
  edit?: boolean | null;
  delete?: boolean | null;
  view?: boolean | null;
}

export interface AvailableSort {
  index: string;
  label?: Labels | null;
}

export interface TableUI {
  maintenance?: boolean | null;
  navigation?: Navigation | null;
  actions?: TableActions | null;
  default_sort: string;
  available_sorts: AvailableSort[];
}

export interface IndexField {
  name: string;
  order: string;
}

export interface Index {
  name: string;
  unique?: boolean | null;
  fields: IndexField[];
}

export interface UniqueConstraint {
  fields: string[];
}

export interface DefaultValue {
  kind: string;
  value: unknown;
}

export interface Semantic {
  kind: string;
  currency: string;
  format: string;
}

export interface Validation {
  min?: number | null;
  max?: number | null;
  min_length?: number | null;
  pattern: string;
  allow_empty?: boolean | null;
}

export interface AllowedValue {
  value: unknown;
  label?: Labels | null;
  order?: number | null;
  active?: boolean | null;
  color: string;
  notes: string;
}

export interface Relation {
  table: string;
  field: string;
  on_delete: string;
  on_update: string;
}

export interface Generated {
  strategy: string;
}

export interface Calculated {
  enabled?: boolean | null;
  expression: string;
  stored?: boolean | null;
}

export interface PhysicalType {
  type: string;
  length?: number | null;
}

export interface NumberFormat {
  thousands_separator?: boolean | null;
  decimal_places?: number | null;
  leading_zeros?: number | null;
}

export interface FieldUI {
  control: string;
  width?: number | null;
  align: string;
  form_visible?: boolean | null;
  form_readonly?: boolean | null;
  list_visible?: boolean | null;
  searchable?: boolean | null;
  filterable?: boolean | null;
  sortable?: boolean | null;
  column_width?: number | null;
  column_flexible?: boolean | null;
  format?: NumberFormat | null;
  lookup?: LookupUI | null;
}

/** Capacidades del control lookup declaradas por el diccionario. */
export interface LookupUI {
  allow_create?: boolean | null;
  search_modes: string[];
  default_search_mode: string;
  user_can_switch_mode?: boolean | null;
}

export interface Deprecation {
  since_schema_version?: number | null;
  replacement: string;
  notes: string;
}

export interface Field {
  name: string;
  physical_name: string;
  label?: Labels | null;
  description: string;
  notes: string;
  logical_type: string;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  unit: string;
  required?: boolean | null;
  unique?: boolean | null;
  default?: DefaultValue | null;
  semantic?: Semantic | null;
  validation?: Validation | null;
  allowed_values: AllowedValue[];
  relation?: Relation | null;
  generated?: Generated | null;
  calculated?: Calculated | null;
  physical: Record<string, PhysicalType> | null;
  ui?: FieldUI | null;
  status: string;
  deprecation?: Deprecation | null;
  /** Marca el campo para que sus cambios generen auditoría. Por defecto false. */
  auditable?: boolean | null;
}

export interface Table {
  name: string;
  physical_name: string;
  code_alias: string;
  label?: Labels | null;
  description: string;
  notes: string;
  status: string;
  table_role: string;
  /** Representación visible: hasta 5 campos existentes de la tabla. */
  display_fields: string[];
  primary_key: string[];
  lifecycle?: Lifecycle | null;
  ui?: TableUI | null;
  fields: Field[];
  indexes: Index[];
  unique_constraints: UniqueConstraint[];
}

export interface Document {
  format_version: number;
  schema_version: number;
  project: Project;
  database: Database;
  tables: Table[];
}

export interface Finding {
  /** "error" o "warning"; se compara contra las constantes de severidad. */
  severity: string;
  code: string;
  message: string;
  table?: string;
  field?: string;
}

export interface HistoryEntry {
  id: string;
  number: number;
  origin: string;
  yamlName: string;
  markdownName: string;
  hasMarkdown: boolean;
}

export interface LockInfo {
  owner: string;
  machine: string;
  created_at: string;
  base_sha256: string;
}

export interface LockState {
  path: string;
  exists: boolean;
  held: boolean;
  orphan: boolean;
  lock?: LockInfo | null;
}

export interface ExternalState {
  path: string;
  changed: boolean;
  missing: boolean;
  baseSha256: string;
  currentSha256: string;
}

export interface LoadResult {
  path: string;
  sha256: string;
  document?: Document | null;
  findings: Finding[];
  lock?: LockState | null;
  /** El archivo estaba en format_version 1 y se convirtió en memoria. */
  migratedFromV1?: boolean;
}

export interface SaveResult {
  saved: boolean;
  path: string;
  sha256: string;
  findings: Finding[];
  historyId: string;
  message: string;
  /** Documento tal como quedó guardado (por ejemplo, con schema_version actualizado). */
  document?: Document | null;
}

export const LOGICAL_TYPES = [
  "string",
  "text",
  "integer",
  "decimal",
  "boolean",
  "date",
  "time",
  "datetime",
  "datetime_tz",
  "duration",
  "binary",
  "json",
  "uuid",
];

export const TABLE_ROLES = ["main", "lookup", "transaction", "system"];
export const NAVIGATION_SECTIONS = ["main", "configuration", "hidden"];
export const DELETE_MODES = ["hard", "soft", "status"];
export const REFERENTIAL_ACTIONS = ["restrict", "cascade", "set_null", "no_action"];
export const GENERATED_STRATEGIES = ["manual", "auto_increment", "uuid", "ulid", "sequence"];
export const DURATION_UNITS = ["seconds", "milliseconds", "minutes"];
export const ALIGNMENTS = ["left", "center", "right"];
export const STATUSES = ["active", "deprecated"];
export const SYSTEM_DEFAULT_VALUES = [
  "current_date",
  "current_time",
  "current_datetime",
  "current_user",
];
export const SEMANTIC_KINDS = [
  "email",
  "phone",
  "currency",
  "percentage",
  "password_hash",
  "url",
  "identifier",
  "code",
  "file_path",
  "mime_type",
  "rich_text",
  "html",
  "latitude",
  "longitude",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
];
export const UI_CONTROLS = [
  "text",
  "textarea",
  "number",
  "checkbox",
  "switch",
  "radio",
  "select",
  "lookup",
  "date",
  "time",
  "datetime",
  "password",
  "rich_text_editor",
];

export const LOOKUP_SEARCH_MODES = ["prefix", "contains"];
export const MAX_DISPLAY_FIELDS = 5;
export const FORMAT_VERSION = 2;

/** Formato textual canónico de cada tipo temporal. */
export const CANONICAL_TEMPORAL_FORMATS: Record<string, string> = {
  date: "YYYY-MM-DD",
  time: "HH:MM:SS",
  datetime: "YYYY-MM-DDTHH:MM:SS",
  datetime_tz: "YYYY-MM-DDTHH:MM:SS±HH:MM",
};

/** Crea un campo vacío con el nombre indicado. */
export function createField(name: string): Field {
  return {
    name,
    physical_name: "",
    label: null,
    description: "",
    notes: "",
    logical_type: "",
    length: null,
    precision: null,
    scale: null,
    unit: "",
    required: null,
    unique: null,
    default: null,
    semantic: null,
    validation: null,
    allowed_values: [],
    relation: null,
    generated: null,
    calculated: null,
    physical: null,
    ui: null,
    status: "",
    deprecation: null,
    auditable: null,
  };
}

/** Crea una tabla vacía con el nombre indicado. */
export function createTable(name: string): Table {
  return {
    name,
    physical_name: "",
    code_alias: "",
    label: null,
    description: "",
    notes: "",
    status: "",
    table_role: "",
    display_fields: [],
    primary_key: [],
    lifecycle: null,
    ui: null,
    fields: [],
    indexes: [],
    unique_constraints: [],
  };
}

/**
 * Normaliza un documento recién leído: garantiza listas y valores por defecto
 * para que la interfaz no tenga que comprobar nulos en cada acceso.
 */
export function normalizeDocument(source: Document): Document {
  const document = structuredClone(source);
  document.project = {
    name: document.project?.name ?? "",
    description: document.project?.description ?? "",
    default_language: document.project?.default_language ?? "",
    languages: document.project?.languages ?? [],
    locale: document.project?.locale ?? "",
  };
  document.database = {
    active_engine: document.database?.active_engine ?? "",
    engines: document.database?.engines ?? [],
  };
  document.tables = (document.tables ?? []).map((table) => {
    const normalized: Table = {
      ...createTable(table.name),
      ...table,
      fields: (table.fields ?? []).map((field) => ({
        ...createField(field.name),
        ...field,
        physical: field.physical ?? null,
        ui: field.ui
          ? {
              ...field.ui,
              lookup: field.ui.lookup
                ? {
                    allow_create: field.ui.lookup.allow_create ?? null,
                    search_modes: field.ui.lookup.search_modes ?? [],
                    default_search_mode: field.ui.lookup.default_search_mode ?? "",
                    user_can_switch_mode: field.ui.lookup.user_can_switch_mode ?? null,
                  }
                : null,
            }
          : null,
      })),
      indexes: table.indexes ?? [],
      unique_constraints: table.unique_constraints ?? [],
    };
    if (normalized.ui) {
      normalized.ui = { ...normalized.ui, available_sorts: normalized.ui.available_sorts ?? [] };
    }
    normalized.display_fields = normalized.display_fields ?? [];
    return normalized;
  });
  return document;
}

/** Devuelve una copia profunda del documento. */
export function cloneDocument(document: Document): Document {
  return structuredClone(document);
}

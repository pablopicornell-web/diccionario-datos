export namespace core {
	
	export class Labels {
	    order: string[];
	    values: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new Labels(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.order = source["order"];
	        this.values = source["values"];
	    }
	}
	export class AllowedValue {
	    value: any;
	    label?: Labels;
	    order?: number;
	    active?: boolean;
	    color: string;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new AllowedValue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.value = source["value"];
	        this.label = this.convertValues(source["label"], Labels);
	        this.order = source["order"];
	        this.active = source["active"];
	        this.color = source["color"];
	        this.notes = source["notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AvailableSort {
	    index: string;
	    label?: Labels;
	
	    static createFrom(source: any = {}) {
	        return new AvailableSort(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.index = source["index"];
	        this.label = this.convertValues(source["label"], Labels);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Calculated {
	    enabled?: boolean;
	    expression: string;
	    stored?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Calculated(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.expression = source["expression"];
	        this.stored = source["stored"];
	    }
	}
	export class Database {
	    active_engine: string;
	    engines: string[];
	
	    static createFrom(source: any = {}) {
	        return new Database(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.active_engine = source["active_engine"];
	        this.engines = source["engines"];
	    }
	}
	export class DefaultValue {
	    kind: string;
	    value: any;
	
	    static createFrom(source: any = {}) {
	        return new DefaultValue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.kind = source["kind"];
	        this.value = source["value"];
	    }
	}
	export class Deprecation {
	    since_schema_version?: number;
	    replacement: string;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new Deprecation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.since_schema_version = source["since_schema_version"];
	        this.replacement = source["replacement"];
	        this.notes = source["notes"];
	    }
	}
	export class UniqueConstraint {
	    fields: string[];
	
	    static createFrom(source: any = {}) {
	        return new UniqueConstraint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fields = source["fields"];
	    }
	}
	export class IndexField {
	    name: string;
	    order: string;
	
	    static createFrom(source: any = {}) {
	        return new IndexField(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.order = source["order"];
	    }
	}
	export class Index {
	    name: string;
	    unique?: boolean;
	    fields: IndexField[];
	
	    static createFrom(source: any = {}) {
	        return new Index(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.unique = source["unique"];
	        this.fields = this.convertValues(source["fields"], IndexField);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LookupUI {
	    allow_create?: boolean;
	    search_modes: string[];
	    default_search_mode: string;
	    user_can_switch_mode?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new LookupUI(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.allow_create = source["allow_create"];
	        this.search_modes = source["search_modes"];
	        this.default_search_mode = source["default_search_mode"];
	        this.user_can_switch_mode = source["user_can_switch_mode"];
	    }
	}
	export class NumberFormat {
	    thousands_separator?: boolean;
	    decimal_places?: number;
	    leading_zeros?: number;
	
	    static createFrom(source: any = {}) {
	        return new NumberFormat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.thousands_separator = source["thousands_separator"];
	        this.decimal_places = source["decimal_places"];
	        this.leading_zeros = source["leading_zeros"];
	    }
	}
	export class FieldUI {
	    control: string;
	    width?: number;
	    align: string;
	    form_visible?: boolean;
	    form_readonly?: boolean;
	    list_visible?: boolean;
	    searchable?: boolean;
	    filterable?: boolean;
	    sortable?: boolean;
	    column_width?: number;
	    column_flexible?: boolean;
	    format?: NumberFormat;
	    lookup?: LookupUI;
	
	    static createFrom(source: any = {}) {
	        return new FieldUI(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.control = source["control"];
	        this.width = source["width"];
	        this.align = source["align"];
	        this.form_visible = source["form_visible"];
	        this.form_readonly = source["form_readonly"];
	        this.list_visible = source["list_visible"];
	        this.searchable = source["searchable"];
	        this.filterable = source["filterable"];
	        this.sortable = source["sortable"];
	        this.column_width = source["column_width"];
	        this.column_flexible = source["column_flexible"];
	        this.format = this.convertValues(source["format"], NumberFormat);
	        this.lookup = this.convertValues(source["lookup"], LookupUI);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PhysicalType {
	    type: string;
	    length?: number;
	
	    static createFrom(source: any = {}) {
	        return new PhysicalType(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.length = source["length"];
	    }
	}
	export class Generated {
	    strategy: string;
	
	    static createFrom(source: any = {}) {
	        return new Generated(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.strategy = source["strategy"];
	    }
	}
	export class Relation {
	    table: string;
	    field: string;
	    on_delete: string;
	    on_update: string;
	
	    static createFrom(source: any = {}) {
	        return new Relation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.table = source["table"];
	        this.field = source["field"];
	        this.on_delete = source["on_delete"];
	        this.on_update = source["on_update"];
	    }
	}
	export class Validation {
	    min?: number;
	    max?: number;
	    min_length?: number;
	    pattern: string;
	    allow_empty?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Validation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.min = source["min"];
	        this.max = source["max"];
	        this.min_length = source["min_length"];
	        this.pattern = source["pattern"];
	        this.allow_empty = source["allow_empty"];
	    }
	}
	export class Semantic {
	    kind: string;
	    currency: string;
	    format: string;
	
	    static createFrom(source: any = {}) {
	        return new Semantic(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.kind = source["kind"];
	        this.currency = source["currency"];
	        this.format = source["format"];
	    }
	}
	export class Field {
	    name: string;
	    physical_name: string;
	    label?: Labels;
	    description: string;
	    notes: string;
	    logical_type: string;
	    length?: number;
	    precision?: number;
	    scale?: number;
	    unit: string;
	    required?: boolean;
	    unique?: boolean;
	    default?: DefaultValue;
	    semantic?: Semantic;
	    validation?: Validation;
	    allowed_values: AllowedValue[];
	    relation?: Relation;
	    generated?: Generated;
	    calculated?: Calculated;
	    physical: Record<string, PhysicalType>;
	    ui?: FieldUI;
	    status: string;
	    deprecation?: Deprecation;
	    auditable?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Field(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.physical_name = source["physical_name"];
	        this.label = this.convertValues(source["label"], Labels);
	        this.description = source["description"];
	        this.notes = source["notes"];
	        this.logical_type = source["logical_type"];
	        this.length = source["length"];
	        this.precision = source["precision"];
	        this.scale = source["scale"];
	        this.unit = source["unit"];
	        this.required = source["required"];
	        this.unique = source["unique"];
	        this.default = this.convertValues(source["default"], DefaultValue);
	        this.semantic = this.convertValues(source["semantic"], Semantic);
	        this.validation = this.convertValues(source["validation"], Validation);
	        this.allowed_values = this.convertValues(source["allowed_values"], AllowedValue);
	        this.relation = this.convertValues(source["relation"], Relation);
	        this.generated = this.convertValues(source["generated"], Generated);
	        this.calculated = this.convertValues(source["calculated"], Calculated);
	        this.physical = this.convertValues(source["physical"], PhysicalType, true);
	        this.ui = this.convertValues(source["ui"], FieldUI);
	        this.status = source["status"];
	        this.deprecation = this.convertValues(source["deprecation"], Deprecation);
	        this.auditable = source["auditable"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class TableActions {
	    create?: boolean;
	    edit?: boolean;
	    delete?: boolean;
	    view?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new TableActions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.create = source["create"];
	        this.edit = source["edit"];
	        this.delete = source["delete"];
	        this.view = source["view"];
	    }
	}
	export class Navigation {
	    section: string;
	
	    static createFrom(source: any = {}) {
	        return new Navigation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.section = source["section"];
	    }
	}
	export class TableUI {
	    maintenance?: boolean;
	    navigation?: Navigation;
	    actions?: TableActions;
	    default_sort: string;
	    available_sorts: AvailableSort[];
	
	    static createFrom(source: any = {}) {
	        return new TableUI(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.maintenance = source["maintenance"];
	        this.navigation = this.convertValues(source["navigation"], Navigation);
	        this.actions = this.convertValues(source["actions"], TableActions);
	        this.default_sort = source["default_sort"];
	        this.available_sorts = this.convertValues(source["available_sorts"], AvailableSort);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Lifecycle {
	    delete_mode: string;
	    field: string;
	    deleted_value: string;
	
	    static createFrom(source: any = {}) {
	        return new Lifecycle(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.delete_mode = source["delete_mode"];
	        this.field = source["field"];
	        this.deleted_value = source["deleted_value"];
	    }
	}
	export class Table {
	    name: string;
	    physical_name: string;
	    code_alias: string;
	    label?: Labels;
	    description: string;
	    notes: string;
	    status: string;
	    table_role: string;
	    display_fields: string[];
	    primary_key: string[];
	    lifecycle?: Lifecycle;
	    ui?: TableUI;
	    fields: Field[];
	    indexes: Index[];
	    unique_constraints: UniqueConstraint[];
	
	    static createFrom(source: any = {}) {
	        return new Table(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.physical_name = source["physical_name"];
	        this.code_alias = source["code_alias"];
	        this.label = this.convertValues(source["label"], Labels);
	        this.description = source["description"];
	        this.notes = source["notes"];
	        this.status = source["status"];
	        this.table_role = source["table_role"];
	        this.display_fields = source["display_fields"];
	        this.primary_key = source["primary_key"];
	        this.lifecycle = this.convertValues(source["lifecycle"], Lifecycle);
	        this.ui = this.convertValues(source["ui"], TableUI);
	        this.fields = this.convertValues(source["fields"], Field);
	        this.indexes = this.convertValues(source["indexes"], Index);
	        this.unique_constraints = this.convertValues(source["unique_constraints"], UniqueConstraint);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Project {
	    name: string;
	    description: string;
	    default_language: string;
	    languages: string[];
	    locale: string;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.default_language = source["default_language"];
	        this.languages = source["languages"];
	        this.locale = source["locale"];
	    }
	}
	export class Document {
	    format_version: number;
	    schema_version: number;
	    project: Project;
	    database: Database;
	    tables: Table[];
	
	    static createFrom(source: any = {}) {
	        return new Document(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.format_version = source["format_version"];
	        this.schema_version = source["schema_version"];
	        this.project = this.convertValues(source["project"], Project);
	        this.database = this.convertValues(source["database"], Database);
	        this.tables = this.convertValues(source["tables"], Table);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ExternalState {
	    path: string;
	    changed: boolean;
	    missing: boolean;
	    baseSha256: string;
	    currentSha256: string;
	
	    static createFrom(source: any = {}) {
	        return new ExternalState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.changed = source["changed"];
	        this.missing = source["missing"];
	        this.baseSha256 = source["baseSha256"];
	        this.currentSha256 = source["currentSha256"];
	    }
	}
	
	
	export class Finding {
	    severity: string;
	    code: string;
	    message: string;
	    table?: string;
	    field?: string;
	
	    static createFrom(source: any = {}) {
	        return new Finding(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.severity = source["severity"];
	        this.code = source["code"];
	        this.message = source["message"];
	        this.table = source["table"];
	        this.field = source["field"];
	    }
	}
	
	export class HistoryEntry {
	    id: string;
	    number: number;
	    origin: string;
	    yamlName: string;
	    markdownName: string;
	    hasMarkdown: boolean;
	
	    static createFrom(source: any = {}) {
	        return new HistoryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.number = source["number"];
	        this.origin = source["origin"];
	        this.yamlName = source["yamlName"];
	        this.markdownName = source["markdownName"];
	        this.hasMarkdown = source["hasMarkdown"];
	    }
	}
	
	
	
	
	export class Lock {
	    owner: string;
	    machine: string;
	    created_at: string;
	    base_sha256: string;
	
	    static createFrom(source: any = {}) {
	        return new Lock(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.owner = source["owner"];
	        this.machine = source["machine"];
	        this.created_at = source["created_at"];
	        this.base_sha256 = source["base_sha256"];
	    }
	}
	export class LockState {
	    path: string;
	    exists: boolean;
	    held: boolean;
	    orphan: boolean;
	    lock?: Lock;
	
	    static createFrom(source: any = {}) {
	        return new LockState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.exists = source["exists"];
	        this.held = source["held"];
	        this.orphan = source["orphan"];
	        this.lock = this.convertValues(source["lock"], Lock);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class LoadResult {
	    path: string;
	    sha256: string;
	    document?: Document;
	    findings: Finding[];
	    lock?: LockState;
	    migratedFromV1: boolean;
	
	    static createFrom(source: any = {}) {
	        return new LoadResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.sha256 = source["sha256"];
	        this.document = this.convertValues(source["document"], Document);
	        this.findings = this.convertValues(source["findings"], Finding);
	        this.lock = this.convertValues(source["lock"], LockState);
	        this.migratedFromV1 = source["migratedFromV1"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	
	
	export class WindowState {
	    width: number;
	    height: number;
	    x: number;
	    y: number;
	    hasPosition: boolean;
	    maximised: boolean;
	
	    static createFrom(source: any = {}) {
	        return new WindowState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	        this.x = source["x"];
	        this.y = source["y"];
	        this.hasPosition = source["hasPosition"];
	        this.maximised = source["maximised"];
	    }
	}
	export class Preferences {
	    theme: string;
	    window: WindowState;
	
	    static createFrom(source: any = {}) {
	        return new Preferences(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.window = this.convertValues(source["window"], WindowState);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class SaveResult {
	    saved: boolean;
	    path: string;
	    sha256: string;
	    findings: Finding[];
	    historyId: string;
	    message: string;
	    document?: Document;
	
	    static createFrom(source: any = {}) {
	        return new SaveResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.saved = source["saved"];
	        this.path = source["path"];
	        this.sha256 = source["sha256"];
	        this.findings = this.convertValues(source["findings"], Finding);
	        this.historyId = source["historyId"];
	        this.message = source["message"];
	        this.document = this.convertValues(source["document"], Document);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	
	
	
	

}


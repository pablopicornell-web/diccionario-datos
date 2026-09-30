package core

import (
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
)

// Formatos canónicos de los valores temporales (sección 5 del contrato).
var (
	canonicalDatePattern       = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	canonicalTimePattern       = regexp.MustCompile(`^\d{2}:\d{2}:\d{2}$`)
	canonicalDatetimePattern   = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$`)
	canonicalDatetimeTZPattern = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$`)
)

// Severidades de los hallazgos de validación.
const (
	SeverityError   = "error"
	SeverityWarning = "warning"
)

// Códigos de validación usados por la interfaz para agrupar y ubicar el error.
const (
	CodeFormatVersion      = "format_version"
	CodeProjectName        = "project_name"
	CodeLanguages          = "languages"
	CodeDefaultLanguage    = "default_language"
	CodeEngines            = "engines"
	CodeActiveEngine       = "active_engine"
	CodeDuplicateTable     = "duplicate_table"
	CodeMissingTableName   = "missing_table_name"
	CodeDuplicateField     = "duplicate_field"
	CodeMissingFieldName   = "missing_field_name"
	CodeTableWithoutFields = "table_without_fields"
	CodeFieldWithoutType   = "field_without_type"
	CodeUnknownLogicalType = "unknown_logical_type"
	CodePrimaryKey         = "primary_key"
	CodeRelationTable      = "relation_table"
	CodeRelationField      = "relation_field"
	CodeRelationAction     = "relation_action"
	CodeSetNullRequired    = "set_null_required"
	CodeIndexField         = "index_field"
	CodeIndexOrder         = "index_order"
	CodeIndexName          = "index_name"
	CodeUniqueConstraint   = "unique_constraint"
	CodeDisplayFields      = "display_fields"
	CodeSortIndex          = "sort_index"
	CodeMinMax             = "min_max"
	CodeScalePrecision     = "scale_precision"
	CodeDefaultValue       = "default_value"
	CodeAllowedValue       = "allowed_value"
	CodeAllowedDuplicate   = "allowed_value_duplicate"
	CodeAllowEmpty         = "allow_empty"
	CodeControl            = "ui_control"
	CodeAlign              = "ui_align"
	CodeStatus             = "status"
	CodeTableRole          = "table_role"
	CodeNavigationSection  = "navigation_section"
	CodeDeleteMode         = "delete_mode"
	CodeSemanticKind       = "semantic_kind"
	CodeGeneratedStrategy  = "generated_strategy"
	CodeDurationUnit       = "duration_unit"
	CodePhysicalEngine     = "physical_engine"
	CodeLookupDisplayField = "lookup_display_fields"
	CodeLookupMetadata     = "lookup_metadata"
	CodeTemporalFormat     = "temporal_format"
)

var logicalTypes = []string{
	"string", "text", "integer", "decimal", "boolean", "date", "time",
	"datetime", "datetime_tz", "duration", "binary", "json", "uuid",
}

var semanticKinds = []string{
	"email", "phone", "currency", "percentage", "password_hash", "url",
	"identifier", "code", "file_path", "mime_type", "rich_text", "html",
	"latitude", "longitude", "created_at", "updated_at", "created_by",
	"updated_by", "deleted_at",
}

var tableRoles = []string{"main", "lookup", "transaction", "system"}
var navigationSections = []string{"main", "configuration", "hidden"}
var deleteModes = []string{"hard", "soft", "status"}
var referentialActions = []string{"restrict", "cascade", "set_null", "no_action"}
var generatedStrategies = []string{"manual", "auto_increment", "uuid", "ulid", "sequence"}
var durationUnits = []string{"seconds", "milliseconds", "minutes"}
var uiControls = []string{
	"text", "textarea", "number", "checkbox", "switch", "radio", "select", "lookup",
	"date", "time", "datetime", "password", "rich_text_editor",
}
var alignments = []string{"left", "center", "right"}
var systemDefaultValues = []string{"current_date", "current_time", "current_datetime", "current_user"}

// Finding es un error o una advertencia de validación estructural.
type Finding struct {
	Severity string `json:"severity"`
	Code     string `json:"code"`
	Message  string `json:"message"`
	Table    string `json:"table,omitempty"`
	Field    string `json:"field,omitempty"`
}

func errorf(code, table, field, format string, args ...any) Finding {
	return Finding{Severity: SeverityError, Code: code, Table: table, Field: field, Message: fmt.Sprintf(format, args...)}
}

func warningf(code, table, field, format string, args ...any) Finding {
	return Finding{Severity: SeverityWarning, Code: code, Table: table, Field: field, Message: fmt.Sprintf(format, args...)}
}

// HasErrors indica si hay al menos un hallazgo que impide guardar.
func HasErrors(findings []Finding) bool {
	for _, finding := range findings {
		if finding.Severity == SeverityError {
			return true
		}
	}
	return false
}

// Validate revisa la estructura completa del diccionario.
func Validate(doc *Document) []Finding {
	findings := []Finding{}
	if doc == nil {
		return append(findings, errorf(CodeFormatVersion, "", "", "No hay diccionario cargado."))
	}

	if doc.FormatVersion != FormatVersion {
		findings = append(findings, errorf(CodeFormatVersion, "", "",
			"`format_version` debe ser %d y es %d.", FormatVersion, doc.FormatVersion))
	}
	if doc.SchemaVersion < 1 {
		findings = append(findings, errorf(CodeFormatVersion, "", "",
			"`schema_version` debe ser un entero mayor o igual a 1."))
	}
	if strings.TrimSpace(doc.Project.Name) == "" {
		findings = append(findings, errorf(CodeProjectName, "", "", "El proyecto no tiene `name`."))
	}
	if len(doc.Project.Languages) == 0 {
		findings = append(findings, errorf(CodeLanguages, "", "", "El proyecto debe declarar al menos un idioma en `languages`."))
	}
	seenLanguages := map[string]bool{}
	for _, language := range doc.Project.Languages {
		if seenLanguages[language] {
			findings = append(findings, errorf(CodeLanguages, "", "", "El idioma `%s` está declarado más de una vez.", language))
		}
		seenLanguages[language] = true
	}
	if doc.Project.DefaultLanguage == "" {
		findings = append(findings, errorf(CodeDefaultLanguage, "", "", "Falta `default_language`."))
	} else if len(doc.Project.Languages) > 0 && !seenLanguages[doc.Project.DefaultLanguage] {
		findings = append(findings, errorf(CodeDefaultLanguage, "", "",
			"`default_language` (`%s`) no está incluido en `languages`.", doc.Project.DefaultLanguage))
	}

	engines := map[string]bool{}
	if len(doc.Database.Engines) == 0 {
		findings = append(findings, errorf(CodeEngines, "", "", "El proyecto debe declarar al menos un motor en `database.engines`."))
	}
	for _, engine := range doc.Database.Engines {
		if engines[engine] {
			findings = append(findings, errorf(CodeEngines, "", "", "El motor `%s` está declarado más de una vez.", engine))
		}
		engines[engine] = true
	}
	if doc.Database.ActiveEngine == "" {
		findings = append(findings, errorf(CodeActiveEngine, "", "", "Falta `database.active_engine`."))
	} else if !engines[doc.Database.ActiveEngine] {
		findings = append(findings, errorf(CodeActiveEngine, "", "",
			"El motor activo `%s` no está declarado en `database.engines`.", doc.Database.ActiveEngine))
	}

	tableNames := map[string]bool{}
	for _, table := range doc.Tables {
		if table == nil {
			continue
		}
		if strings.TrimSpace(table.Name) == "" {
			findings = append(findings, errorf(CodeMissingTableName, "", "", "Hay una tabla sin `name`."))
			continue
		}
		if tableNames[table.Name] {
			findings = append(findings, errorf(CodeDuplicateTable, table.Name, "", "La tabla `%s` está declarada más de una vez.", table.Name))
		}
		tableNames[table.Name] = true
	}

	for _, table := range doc.Tables {
		if table == nil || table.Name == "" {
			continue
		}
		findings = append(findings, validateTable(doc, table, engines)...)
	}
	return findings
}

func validateTable(doc *Document, table *Table, engines map[string]bool) []Finding {
	findings := []Finding{}

	if len(table.Fields) == 0 {
		findings = append(findings, warningf(CodeTableWithoutFields, table.Name, "", "La tabla `%s` no tiene campos.", table.Name))
	}
	if table.Status != "" && table.Status != StatusActive && table.Status != StatusDeprecated {
		findings = append(findings, errorf(CodeStatus, table.Name, "", "`status` debe ser `active` o `deprecated`."))
	}
	if table.TableRole != "" && !contains(tableRoles, table.TableRole) {
		findings = append(findings, warningf(CodeTableRole, table.Name, "", "`table_role` desconocido: `%s`.", table.TableRole))
	}
	if table.UI != nil {
		if table.UI.Navigation != nil && table.UI.Navigation.Section != "" && !contains(navigationSections, table.UI.Navigation.Section) {
			findings = append(findings, errorf(CodeNavigationSection, table.Name, "", "`ui.navigation.section` debe ser main, configuration o hidden."))
		}
	}
	if table.Lifecycle != nil && table.Lifecycle.DeleteMode != "" && !contains(deleteModes, table.Lifecycle.DeleteMode) {
		findings = append(findings, errorf(CodeDeleteMode, table.Name, "", "`lifecycle.delete_mode` debe ser hard, soft o status."))
	}
	if table.Lifecycle != nil && table.Lifecycle.DeleteMode == "soft" && table.Lifecycle.Field == "" {
		findings = append(findings, errorf(CodeDeleteMode, table.Name, "", "`lifecycle.delete_mode: soft` requiere `field`."))
	}
	if table.Lifecycle != nil && table.Lifecycle.DeleteMode == "status" && (table.Lifecycle.Field == "" || table.Lifecycle.DeletedValue == "") {
		findings = append(findings, errorf(CodeDeleteMode, table.Name, "", "`lifecycle.delete_mode: status` requiere `field` y `deleted_value`."))
	}

	fieldNames := map[string]bool{}
	for _, field := range table.Fields {
		if field == nil {
			continue
		}
		if strings.TrimSpace(field.Name) == "" {
			findings = append(findings, errorf(CodeMissingFieldName, table.Name, "", "La tabla `%s` tiene un campo sin `name`.", table.Name))
			continue
		}
		if fieldNames[field.Name] {
			findings = append(findings, errorf(CodeDuplicateField, table.Name, field.Name,
				"El campo `%s` está declarado más de una vez en `%s`.", field.Name, table.Name))
		}
		fieldNames[field.Name] = true
	}

	if len(table.PrimaryKey) == 0 {
		findings = append(findings, errorf(CodePrimaryKey, table.Name, "", "La tabla `%s` no define `primary_key`.", table.Name))
	}
	for _, keyField := range table.PrimaryKey {
		if !fieldNames[keyField] {
			findings = append(findings, errorf(CodePrimaryKey, table.Name, keyField,
				"La clave primaria de `%s` referencia el campo inexistente `%s`.", table.Name, keyField))
		}
	}

	findings = append(findings, validateDisplayFields(table, fieldNames)...)
	if table.TableRole == "lookup" && len(table.DisplayFields) == 0 {
		findings = append(findings, warningf(CodeLookupDisplayField, table.Name, "",
			"La tabla `lookup` `%s` no define `display_fields`.", table.Name))
	}

	indexNames := map[string]bool{}
	for _, index := range table.Indexes {
		if index == nil {
			continue
		}
		if strings.TrimSpace(index.Name) == "" {
			findings = append(findings, errorf(CodeIndexName, table.Name, "", "Hay un índice sin `name` en `%s`.", table.Name))
		} else if indexNames[index.Name] {
			findings = append(findings, errorf(CodeIndexName, table.Name, "", "El índice `%s` está declarado más de una vez en `%s`.", index.Name, table.Name))
		}
		indexNames[index.Name] = true
		if len(index.Fields) == 0 {
			findings = append(findings, errorf(CodeIndexField, table.Name, "", "El índice `%s` no tiene campos.", index.Name))
		}
		for _, indexField := range index.Fields {
			if indexField == nil {
				continue
			}
			if !fieldNames[indexField.Name] {
				findings = append(findings, errorf(CodeIndexField, table.Name, indexField.Name,
					"El índice `%s` referencia el campo inexistente `%s`.", index.Name, indexField.Name))
			}
			if indexField.Order != "" && indexField.Order != "asc" && indexField.Order != "desc" {
				findings = append(findings, errorf(CodeIndexOrder, table.Name, indexField.Name,
					"El orden `%s` del índice `%s` debe ser asc o desc.", indexField.Order, index.Name))
			}
		}
	}

	if table.UI != nil {
		if table.UI.DefaultSort != "" && !indexNames[table.UI.DefaultSort] {
			findings = append(findings, errorf(CodeSortIndex, table.Name, "",
				"`ui.default_sort` referencia el índice inexistente `%s`.", table.UI.DefaultSort))
		}
		for _, sort := range table.UI.AvailableSorts {
			if sort == nil {
				continue
			}
			if !indexNames[sort.Index] {
				findings = append(findings, errorf(CodeSortIndex, table.Name, "",
					"`ui.available_sorts` referencia el índice inexistente `%s`.", sort.Index))
			}
		}
	}

	for _, constraint := range table.UniqueConstraints {
		if constraint == nil || len(constraint.Fields) == 0 {
			findings = append(findings, errorf(CodeUniqueConstraint, table.Name, "", "Hay una restricción única sin campos en `%s`.", table.Name))
			continue
		}
		for _, field := range constraint.Fields {
			if !fieldNames[field] {
				findings = append(findings, errorf(CodeUniqueConstraint, table.Name, field,
					"La restricción única referencia el campo inexistente `%s`.", field))
			}
		}
	}

	for _, field := range table.Fields {
		if field == nil || field.Name == "" {
			continue
		}
		findings = append(findings, validateField(doc, table, field, fieldNames, engines)...)
	}
	return findings
}

func validateField(doc *Document, table *Table, field *Field, fieldNames map[string]bool, engines map[string]bool) []Finding {
	findings := []Finding{}

	if field.LogicalType == "" {
		findings = append(findings, warningf(CodeFieldWithoutType, table.Name, field.Name,
			"El campo `%s` no define `logical_type`.", field.Name))
	} else if !contains(logicalTypes, field.LogicalType) {
		findings = append(findings, errorf(CodeUnknownLogicalType, table.Name, field.Name,
			"`%s` no es un tipo lógico válido.", field.LogicalType))
	}
	if field.Status != "" && field.Status != StatusActive && field.Status != StatusDeprecated {
		findings = append(findings, errorf(CodeStatus, table.Name, field.Name, "`status` debe ser `active` o `deprecated`."))
	}
	if field.Scale != nil && field.Precision != nil && *field.Scale > *field.Precision {
		findings = append(findings, errorf(CodeScalePrecision, table.Name, field.Name,
			"`scale` (%d) no puede ser mayor que `precision` (%d).", *field.Scale, *field.Precision))
	}
	if field.LogicalType == "duration" && field.Unit != "" && !contains(durationUnits, field.Unit) {
		findings = append(findings, errorf(CodeDurationUnit, table.Name, field.Name,
			"`unit` debe ser seconds, milliseconds o minutes."))
	}
	if field.Validation != nil {
		if field.Validation.Min != nil && field.Validation.Max != nil && *field.Validation.Min > *field.Validation.Max {
			findings = append(findings, errorf(CodeMinMax, table.Name, field.Name,
				"`validation.min` (%v) no puede ser mayor que `validation.max` (%v).", *field.Validation.Min, *field.Validation.Max))
		}
		if field.Validation.AllowEmpty != nil && !isTextual(field.LogicalType) {
			findings = append(findings, warningf(CodeAllowEmpty, table.Name, field.Name,
				"`validation.allow_empty` sólo corresponde a campos textuales."))
		}
	}
	if field.Semantic != nil && field.Semantic.Kind != "" && !contains(semanticKinds, field.Semantic.Kind) {
		findings = append(findings, warningf(CodeSemanticKind, table.Name, field.Name,
			"`semantic.kind` desconocido: `%s`.", field.Semantic.Kind))
	}
	if field.Generated != nil && field.Generated.Strategy != "" && !contains(generatedStrategies, field.Generated.Strategy) {
		findings = append(findings, errorf(CodeGeneratedStrategy, table.Name, field.Name,
			"`generated.strategy` debe ser manual, auto_increment, uuid, ulid o sequence."))
	}
	if field.UI != nil {
		if field.UI.Control != "" && !contains(uiControls, field.UI.Control) {
			findings = append(findings, warningf(CodeControl, table.Name, field.Name,
				"`ui.control` desconocido: `%s`.", field.UI.Control))
		}
		if field.UI.Align != "" && !contains(alignments, field.UI.Align) {
			findings = append(findings, errorf(CodeAlign, table.Name, field.Name,
				"`ui.align` debe ser left, center o right."))
		}
		findings = append(findings, validateLookupMetadata(table, field)...)
	}
	if field.Default != nil {
		findings = append(findings, validateDefault(table, field)...)
	}
	if len(field.AllowedValues) > 0 {
		seen := map[string]bool{}
		for _, allowed := range field.AllowedValues {
			if allowed == nil {
				continue
			}
			key := fmt.Sprintf("%v", allowed.Value)
			if seen[key] {
				findings = append(findings, errorf(CodeAllowedDuplicate, table.Name, field.Name,
					"El valor permitido `%s` está repetido.", key))
			}
			seen[key] = true
			if allowed.Value == nil {
				findings = append(findings, errorf(CodeAllowedValue, table.Name, field.Name,
					"Hay un valor permitido sin `value`."))
				continue
			}
			if !literalMatchesType(allowed.Value, field.LogicalType) {
				findings = append(findings, errorf(CodeAllowedValue, table.Name, field.Name,
					"El valor permitido `%v` no es compatible con el tipo `%s`.", allowed.Value, field.LogicalType))
			}
		}
	}
	if field.Relation != nil {
		relation := field.Relation
		related := doc.FindTable(relation.Table)
		if related == nil {
			findings = append(findings, errorf(CodeRelationTable, table.Name, field.Name,
				"La relación apunta a la tabla inexistente `%s`.", relation.Table))
		} else if relation.Field != "" && related.FindField(relation.Field) == nil {
			findings = append(findings, errorf(CodeRelationField, table.Name, field.Name,
				"La relación apunta al campo inexistente `%s.%s`.", relation.Table, relation.Field))
		}
		if relation.OnDelete != "" && !contains(referentialActions, relation.OnDelete) {
			findings = append(findings, errorf(CodeRelationAction, table.Name, field.Name,
				"`on_delete` debe ser restrict, cascade, set_null o no_action."))
		}
		if relation.OnUpdate != "" && !contains(referentialActions, relation.OnUpdate) {
			findings = append(findings, errorf(CodeRelationAction, table.Name, field.Name,
				"`on_update` debe ser restrict, cascade, set_null o no_action."))
		}
		if relation.OnDelete == "set_null" && field.Required != nil && *field.Required {
			findings = append(findings, errorf(CodeSetNullRequired, table.Name, field.Name,
				"`on_delete: set_null` no es válido sobre un campo obligatorio."))
		}
		if relation.OnUpdate == "set_null" && field.Required != nil && *field.Required {
			findings = append(findings, errorf(CodeSetNullRequired, table.Name, field.Name,
				"`on_update: set_null` no es válido sobre un campo obligatorio."))
		}
	}
	for engine := range field.Physical {
		if !engines[engine] {
			findings = append(findings, warningf(CodePhysicalEngine, table.Name, field.Name,
				"Se declara `physical.%s` pero ese motor no está en `database.engines`.", engine))
		}
	}
	if doc.Database.ActiveEngine != "" && engines[doc.Database.ActiveEngine] && len(field.Physical) > 0 {
		if _, ok := field.Physical[doc.Database.ActiveEngine]; !ok {
			findings = append(findings, warningf(CodePhysicalEngine, table.Name, field.Name,
				"El campo no tiene definición `physical.%s` para el motor activo.", doc.Database.ActiveEngine))
		}
	}
	return findings
}

func validateDefault(table *Table, field *Field) []Finding {
	findings := []Finding{}
	switch field.Default.Kind {
	case "literal":
		if field.Default.Value == nil {
			findings = append(findings, errorf(CodeDefaultValue, table.Name, field.Name, "El `default` literal no tiene `value`."))
		} else if !literalMatchesType(field.Default.Value, field.LogicalType) {
			findings = append(findings, errorf(CodeDefaultValue, table.Name, field.Name,
				"El `default` `%v` no es compatible con el tipo `%s`.", field.Default.Value, field.LogicalType))
		} else if text, isText := field.Default.Value.(string); isText {
			if format, expected := canonicalTemporalFormat(field.LogicalType); expected && !matchesCanonicalTemporal(text, field.LogicalType) {
				findings = append(findings, warningf(CodeTemporalFormat, table.Name, field.Name,
					"El valor predeterminado `%s` no respeta el formato canónico `%s`.", text, format))
			}
		}
	case "system":
		value, ok := field.Default.Value.(string)
		if !ok || !contains(systemDefaultValues, value) {
			findings = append(findings, errorf(CodeDefaultValue, table.Name, field.Name,
				"El `default` de sistema debe ser current_date, current_time, current_datetime o current_user."))
		}
	case "":
		findings = append(findings, errorf(CodeDefaultValue, table.Name, field.Name, "El `default` no define `kind`."))
	default:
		findings = append(findings, errorf(CodeDefaultValue, table.Name, field.Name,
			"`default.kind` debe ser `literal` o `system`."))
	}
	return findings
}

// canonicalTemporalFormat devuelve el formato textual exigido por el contrato
// para el tipo lógico indicado.
func canonicalTemporalFormat(logicalType string) (string, bool) {
	switch logicalType {
	case "date":
		return "YYYY-MM-DD", true
	case "time":
		return "HH:MM:SS", true
	case "datetime":
		return "YYYY-MM-DDTHH:MM:SS", true
	case "datetime_tz":
		return "YYYY-MM-DDTHH:MM:SS±HH:MM", true
	default:
		return "", false
	}
}

// matchesCanonicalTemporal comprueba un texto contra el formato canónico del
// tipo temporal.
func matchesCanonicalTemporal(value, logicalType string) bool {
	switch logicalType {
	case "date":
		return canonicalDatePattern.MatchString(value)
	case "time":
		return canonicalTimePattern.MatchString(value)
	case "datetime":
		return canonicalDatetimePattern.MatchString(value)
	case "datetime_tz":
		return canonicalDatetimeTZPattern.MatchString(value)
	default:
		return true
	}
}

// validateDisplayFields revisa la representación visible de la tabla: campos
// existentes, sin repetidos y como máximo cinco componentes.
func validateDisplayFields(table *Table, fieldNames map[string]bool) []Finding {
	findings := []Finding{}
	seen := []string{}
	for _, name := range table.DisplayFields {
		trimmed := strings.TrimSpace(name)
		if trimmed == "" {
			continue
		}
		if containsString(seen, trimmed) {
			findings = append(findings, errorf(CodeDisplayFields, table.Name, trimmed,
				"`display_fields` repite el campo `%s`.", trimmed))
			continue
		}
		seen = append(seen, trimmed)
		if !fieldNames[trimmed] {
			findings = append(findings, errorf(CodeDisplayFields, table.Name, trimmed,
				"`display_fields` referencia el campo inexistente `%s`.", trimmed))
		}
	}
	if len(seen) > MaxDisplayFields {
		findings = append(findings, errorf(CodeDisplayFields, table.Name, "",
			"`display_fields` admite hasta %d campos y declara %d.", MaxDisplayFields, len(seen)))
	}
	return findings
}

// validateLookupMetadata revisa la metadata del control lookup.
func validateLookupMetadata(table *Table, field *Field) []Finding {
	findings := []Finding{}
	lookup := field.UI.Lookup
	if lookup == nil {
		return findings
	}
	if field.UI.Control != "lookup" {
		findings = append(findings, warningf(CodeLookupMetadata, table.Name, field.Name,
			"`ui.lookup` sólo se usa con `ui.control: lookup`."))
	}
	modes := []string{}
	for _, mode := range lookup.SearchModes {
		if !contains(LookupSearchModes, mode) {
			findings = append(findings, errorf(CodeLookupMetadata, table.Name, field.Name,
				"`search_modes` admite prefix y contains: `%s` no es válido.", mode))
			continue
		}
		if containsString(modes, mode) {
			findings = append(findings, errorf(CodeLookupMetadata, table.Name, field.Name,
				"`search_modes` repite `%s`.", mode))
			continue
		}
		modes = append(modes, mode)
	}
	if len(modes) == 0 {
		modes = []string{"prefix"}
	}
	effectiveDefault := lookup.DefaultSearchMode
	if effectiveDefault == "" {
		effectiveDefault = "prefix"
	}
	if !containsString(modes, effectiveDefault) {
		findings = append(findings, errorf(CodeLookupMetadata, table.Name, field.Name,
			"`default_search_mode` (`%s`) debe estar incluido en `search_modes`.", effectiveDefault))
	}
	return findings
}

func isTextual(logicalType string) bool {
	return logicalType == "string" || logicalType == "text" || logicalType == ""
}

func literalMatchesType(value any, logicalType string) bool {
	switch logicalType {
	case "integer":
		number, ok := toFloat(value)
		if !ok {
			return false
		}
		return number == math.Trunc(number)
	case "decimal":
		_, ok := toFloat(value)
		return ok
	case "boolean":
		_, ok := value.(bool)
		return ok
	case "":
		return true
	default:
		if isTextual(logicalType) || logicalType == "json" || logicalType == "uuid" ||
			logicalType == "date" || logicalType == "time" || logicalType == "datetime" ||
			logicalType == "datetime_tz" || logicalType == "duration" || logicalType == "binary" {
			_, ok := value.(string)
			return ok
		}
		return true
	}
}

func toFloat(value any) (float64, bool) {
	switch number := value.(type) {
	case int:
		return float64(number), true
	case int64:
		return float64(number), true
	case float32:
		return float64(number), true
	case float64:
		return number, true
	default:
		return 0, false
	}
}

func contains(values []string, value string) bool {
	for _, item := range values {
		if item == value {
			return true
		}
	}
	return false
}

// SortFindings ordena los hallazgos por severidad y por ubicación.
func SortFindings(findings []Finding) {
	sort.SliceStable(findings, func(i, j int) bool {
		if findings[i].Severity != findings[j].Severity {
			return findings[i].Severity == SeverityError
		}
		if findings[i].Table != findings[j].Table {
			return findings[i].Table < findings[j].Table
		}
		return findings[i].Field < findings[j].Field
	})
}

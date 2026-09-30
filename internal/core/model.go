// Package core implementa el modelo, la carga, la validación y el guardado
// seguro de DiccionarioDatos.yaml.
//
// El archivo YAML es la única fuente de verdad: la aplicación lo lee, lo edita
// en memoria y vuelve a escribirlo sobre el mismo archivo.
package core

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"go.yaml.in/yaml/v4"
)

// FormatVersion es la versión de formato que esta versión del editor produce.
const FormatVersion = 2

// LegacyFormatVersion es la versión anterior, que se acepta sólo para migrarla.
const LegacyFormatVersion = 1

// MaxDisplayFields es la cantidad máxima de componentes de la representación
// visible de una tabla.
const MaxDisplayFields = 5

// Valores admitidos en propiedades cerradas del diccionario.
const (
	StatusActive     = "active"
	StatusDeprecated = "deprecated"
)

// Labels es un mapa de etiquetas por idioma que conserva el orden del YAML.
// El orden declarado se guarda en Order para poder reescribir el archivo con la
// misma secuencia de idiomas.
type Labels struct {
	Order  []string          `json:"order"`
	Values map[string]string `json:"values"`
}

// NewLabels devuelve un conjunto de etiquetas vacío y utilizable.
func NewLabels() *Labels {
	return &Labels{Order: []string{}, Values: map[string]string{}}
}

// Get devuelve la etiqueta del idioma indicado, o cadena vacía.
func (l *Labels) Get(lang string) string {
	if l == nil {
		return ""
	}
	return l.Values[lang]
}

// Set agrega o reemplaza la etiqueta de un idioma conservando el orden.
func (l *Labels) Set(lang, text string) {
	if l == nil {
		return
	}
	if l.Values == nil {
		l.Values = map[string]string{}
	}
	if _, ok := l.Values[lang]; !ok {
		l.Order = append(l.Order, lang)
	}
	l.Values[lang] = text
}

// orderedKeys devuelve las claves en el orden declarado, con las sobrantes al
// final en orden alfabético (nunca se pierde una etiqueta).
func (l *Labels) orderedKeys() []string {
	keys := make([]string, 0, len(l.Values))
	seen := map[string]bool{}
	for _, k := range l.Order {
		if _, ok := l.Values[k]; ok && !seen[k] {
			keys = append(keys, k)
			seen[k] = true
		}
	}
	rest := make([]string, 0)
	for k := range l.Values {
		if !seen[k] {
			rest = append(rest, k)
		}
	}
	sort.Strings(rest)
	return append(keys, rest...)
}

// MarshalYAML escribe las etiquetas como mapa, respetando el orden.
func (l *Labels) MarshalYAML() (any, error) {
	if l == nil || len(l.Values) == 0 {
		return nil, nil
	}
	node := &yaml.Node{Kind: yaml.MappingNode, Tag: "!!map"}
	for _, k := range l.orderedKeys() {
		node.Content = append(node.Content,
			&yaml.Node{Kind: yaml.ScalarNode, Tag: "!!str", Value: k},
			&yaml.Node{Kind: yaml.ScalarNode, Tag: "!!str", Value: l.Values[k]},
		)
	}
	return node, nil
}

// UnmarshalYAML lee las etiquetas de un mapa YAML.
func (l *Labels) UnmarshalYAML(node *yaml.Node) error {
	if node.Kind == yaml.ScalarNode && node.Tag == "!!null" {
		return nil
	}
	if node.Kind != yaml.MappingNode {
		return fmt.Errorf("se esperaba un mapa de idiomas en la línea %d", node.Line)
	}
	labels := NewLabels()
	for i := 0; i+1 < len(node.Content); i += 2 {
		key := node.Content[i]
		value := node.Content[i+1]
		if value.Kind != yaml.ScalarNode {
			return fmt.Errorf("la etiqueta %q de la línea %d debe ser texto", key.Value, value.Line)
		}
		labels.Set(key.Value, value.Value)
	}
	*l = *labels
	return nil
}

// MarshalJSON expone las etiquetas al frontend.
func (l Labels) MarshalJSON() ([]byte, error) {
	type plain struct {
		Order  []string          `json:"order"`
		Values map[string]string `json:"values"`
	}
	order := l.Order
	if order == nil {
		order = []string{}
	}
	values := l.Values
	if values == nil {
		values = map[string]string{}
	}
	return json.Marshal(plain{Order: order, Values: values})
}

// Document es la raíz del diccionario.
type Document struct {
	FormatVersion int      `yaml:"format_version" json:"format_version"`
	SchemaVersion int      `yaml:"schema_version" json:"schema_version"`
	Project       Project  `yaml:"project" json:"project"`
	Database      Database `yaml:"database" json:"database"`
	Tables        []*Table `yaml:"tables" json:"tables"`

	// MigratedFromV1 indica que el archivo se leyó como format_version 1 y se
	// convirtió en memoria. No forma parte del YAML.
	MigratedFromV1 bool `yaml:"-" json:"-"`
}

// Project describe el proyecto al que pertenece el diccionario.
type Project struct {
	Name            string   `yaml:"name" json:"name"`
	Description     string   `yaml:"description,omitempty" json:"description"`
	DefaultLanguage string   `yaml:"default_language" json:"default_language"`
	Languages       []string `yaml:"languages" json:"languages"`
	Locale          string   `yaml:"locale,omitempty" json:"locale"`
}

// Database indica el motor activo y los motores declarados.
type Database struct {
	ActiveEngine string   `yaml:"active_engine" json:"active_engine"`
	Engines      []string `yaml:"engines" json:"engines"`
}

// Table es una tabla del diccionario.
type Table struct {
	Name              string              `yaml:"name" json:"name"`
	PhysicalName      string              `yaml:"physical_name,omitempty" json:"physical_name"`
	CodeAlias         string              `yaml:"code_alias,omitempty" json:"code_alias"`
	Label             *Labels             `yaml:"label,omitempty" json:"label"`
	Description       string              `yaml:"description,omitempty" json:"description"`
	Notes             string              `yaml:"notes,omitempty" json:"notes"`
	Status            string              `yaml:"status,omitempty" json:"status"`
	TableRole         string              `yaml:"table_role,omitempty" json:"table_role"`
	DisplayFields     []string            `yaml:"display_fields,omitempty" json:"display_fields"`
	PrimaryKey        []string            `yaml:"primary_key,omitempty" json:"primary_key"`
	Lifecycle         *Lifecycle          `yaml:"lifecycle,omitempty" json:"lifecycle"`
	UI                *TableUI            `yaml:"ui,omitempty" json:"ui"`
	Fields            []*Field            `yaml:"fields" json:"fields"`
	Indexes           []*Index            `yaml:"indexes,omitempty" json:"indexes"`
	UniqueConstraints []*UniqueConstraint `yaml:"unique_constraints,omitempty" json:"unique_constraints"`

	// LegacyDisplayField sólo existe para leer archivos format_version 1.
	LegacyDisplayField string `yaml:"display_field,omitempty" json:"-"`
}

// Lifecycle define cómo se elimina un registro de la tabla.
type Lifecycle struct {
	DeleteMode   string `yaml:"delete_mode" json:"delete_mode"`
	Field        string `yaml:"field,omitempty" json:"field"`
	DeletedValue string `yaml:"deleted_value,omitempty" json:"deleted_value"`
}

// TableUI agrupa la presentación y navegación de la tabla.
type TableUI struct {
	Maintenance    *bool            `yaml:"maintenance,omitempty" json:"maintenance"`
	Navigation     *Navigation      `yaml:"navigation,omitempty" json:"navigation"`
	Actions        *TableActions    `yaml:"actions,omitempty" json:"actions"`
	DefaultSort    string           `yaml:"default_sort,omitempty" json:"default_sort"`
	AvailableSorts []*AvailableSort `yaml:"available_sorts,omitempty" json:"available_sorts"`
}

// Navigation indica la sección de menú de la tabla.
type Navigation struct {
	Section string `yaml:"section" json:"section"`
}

// TableActions habilita las acciones de mantenimiento.
type TableActions struct {
	Create *bool `yaml:"create,omitempty" json:"create"`
	Edit   *bool `yaml:"edit,omitempty" json:"edit"`
	Delete *bool `yaml:"delete,omitempty" json:"delete"`
	View   *bool `yaml:"view,omitempty" json:"view"`
}

// AvailableSort es una opción de orden de grilla basada en un índice.
type AvailableSort struct {
	Index string  `yaml:"index" json:"index"`
	Label *Labels `yaml:"label,omitempty" json:"label"`
}

// Field es un campo de una tabla.
type Field struct {
	Name          string                   `yaml:"name" json:"name"`
	PhysicalName  string                   `yaml:"physical_name,omitempty" json:"physical_name"`
	Label         *Labels                  `yaml:"label,omitempty" json:"label"`
	Description   string                   `yaml:"description,omitempty" json:"description"`
	Notes         string                   `yaml:"notes,omitempty" json:"notes"`
	LogicalType   string                   `yaml:"logical_type,omitempty" json:"logical_type"`
	Length        *int                     `yaml:"length,omitempty" json:"length"`
	Precision     *int                     `yaml:"precision,omitempty" json:"precision"`
	Scale         *int                     `yaml:"scale,omitempty" json:"scale"`
	Unit          string                   `yaml:"unit,omitempty" json:"unit"`
	Required      *bool                    `yaml:"required,omitempty" json:"required"`
	Unique        *bool                    `yaml:"unique,omitempty" json:"unique"`
	Default       *DefaultValue            `yaml:"default,omitempty" json:"default"`
	Semantic      *Semantic                `yaml:"semantic,omitempty" json:"semantic"`
	Validation    *Validation              `yaml:"validation,omitempty" json:"validation"`
	AllowedValues []*AllowedValue          `yaml:"allowed_values,omitempty" json:"allowed_values"`
	Relation      *Relation                `yaml:"relation,omitempty" json:"relation"`
	Generated     *Generated               `yaml:"generated,omitempty" json:"generated"`
	Calculated    *Calculated              `yaml:"calculated,omitempty" json:"calculated"`
	Physical      map[string]*PhysicalType `yaml:"physical,omitempty" json:"physical"`
	UI            *FieldUI                 `yaml:"ui,omitempty" json:"ui"`
	Status        string                   `yaml:"status,omitempty" json:"status"`
	Deprecation   *Deprecation             `yaml:"deprecation,omitempty" json:"deprecation"`
	Auditable     *bool                    `yaml:"auditable,omitempty" json:"auditable"`
}

// DefaultValue es un valor predeterminado literal o del sistema.
type DefaultValue struct {
	Kind  string `yaml:"kind" json:"kind"`
	Value any    `yaml:"value" json:"value"`
}

// Semantic agrega significado al tipo lógico.
type Semantic struct {
	Kind     string `yaml:"kind" json:"kind"`
	Currency string `yaml:"currency,omitempty" json:"currency"`
	Format   string `yaml:"format,omitempty" json:"format"`
}

// Validation define restricciones simples de un campo.
type Validation struct {
	Min        *float64 `yaml:"min,omitempty" json:"min"`
	Max        *float64 `yaml:"max,omitempty" json:"max"`
	MinLength  *int     `yaml:"min_length,omitempty" json:"min_length"`
	Pattern    string   `yaml:"pattern,omitempty" json:"pattern"`
	AllowEmpty *bool    `yaml:"allow_empty,omitempty" json:"allow_empty"`
}

// AllowedValue es un valor permitido de una lista fija.
type AllowedValue struct {
	Value  any     `yaml:"value" json:"value"`
	Label  *Labels `yaml:"label,omitempty" json:"label"`
	Order  *int    `yaml:"order,omitempty" json:"order"`
	Active *bool   `yaml:"active,omitempty" json:"active"`
	Color  string  `yaml:"color,omitempty" json:"color"`
	Notes  string  `yaml:"notes,omitempty" json:"notes"`
}

// Relation define una referencia a otra tabla.
type Relation struct {
	Table    string `yaml:"table" json:"table"`
	Field    string `yaml:"field" json:"field"`
	OnDelete string `yaml:"on_delete,omitempty" json:"on_delete"`
	OnUpdate string `yaml:"on_update,omitempty" json:"on_update"`
}

// Generated define la estrategia de generación de un identificador.
type Generated struct {
	Strategy string `yaml:"strategy" json:"strategy"`
}

// Calculated define un campo calculado.
type Calculated struct {
	Enabled    *bool  `yaml:"enabled,omitempty" json:"enabled"`
	Expression string `yaml:"expression,omitempty" json:"expression"`
	Stored     *bool  `yaml:"stored,omitempty" json:"stored"`
}

// PhysicalType es la definición física de un campo en un motor.
type PhysicalType struct {
	Type   string `yaml:"type" json:"type"`
	Length *int   `yaml:"length,omitempty" json:"length"`
}

// FieldUI agrupa la presentación de un campo.
type FieldUI struct {
	Control        string        `yaml:"control,omitempty" json:"control"`
	Width          *int          `yaml:"width,omitempty" json:"width"`
	Align          string        `yaml:"align,omitempty" json:"align"`
	FormVisible    *bool         `yaml:"form_visible,omitempty" json:"form_visible"`
	FormReadonly   *bool         `yaml:"form_readonly,omitempty" json:"form_readonly"`
	ListVisible    *bool         `yaml:"list_visible,omitempty" json:"list_visible"`
	Searchable     *bool         `yaml:"searchable,omitempty" json:"searchable"`
	Filterable     *bool         `yaml:"filterable,omitempty" json:"filterable"`
	Sortable       *bool         `yaml:"sortable,omitempty" json:"sortable"`
	ColumnWidth    *int          `yaml:"column_width,omitempty" json:"column_width"`
	ColumnFlexible *bool         `yaml:"column_flexible,omitempty" json:"column_flexible"`
	Format         *NumberFormat `yaml:"format,omitempty" json:"format"`
	Lookup         *LookupUI     `yaml:"lookup,omitempty" json:"lookup"`
}

// LookupUI declara las capacidades del control lookup de un campo relacional.
type LookupUI struct {
	AllowCreate       *bool    `yaml:"allow_create,omitempty" json:"allow_create"`
	SearchModes       []string `yaml:"search_modes,omitempty" json:"search_modes"`
	DefaultSearchMode string   `yaml:"default_search_mode,omitempty" json:"default_search_mode"`
	UserCanSwitchMode *bool    `yaml:"user_can_switch_mode,omitempty" json:"user_can_switch_mode"`
}

// LookupSearchModes son los modos de búsqueda admitidos por el contrato.
var LookupSearchModes = []string{"prefix", "contains"}

// NumberFormat define el formato de presentación numérico.
type NumberFormat struct {
	ThousandsSeparator *bool `yaml:"thousands_separator,omitempty" json:"thousands_separator"`
	DecimalPlaces      *int  `yaml:"decimal_places,omitempty" json:"decimal_places"`
	LeadingZeros       *int  `yaml:"leading_zeros,omitempty" json:"leading_zeros"`
}

// Deprecation describe el reemplazo de un elemento obsoleto.
type Deprecation struct {
	SinceSchemaVersion *int   `yaml:"since_schema_version,omitempty" json:"since_schema_version"`
	Replacement        string `yaml:"replacement,omitempty" json:"replacement"`
	Notes              string `yaml:"notes,omitempty" json:"notes"`
}

// Index es un índice declarado a nivel de tabla.
type Index struct {
	Name   string        `yaml:"name" json:"name"`
	Unique *bool         `yaml:"unique,omitempty" json:"unique"`
	Fields []*IndexField `yaml:"fields" json:"fields"`
}

// IndexField es un campo dentro de un índice.
type IndexField struct {
	Name  string `yaml:"name" json:"name"`
	Order string `yaml:"order,omitempty" json:"order"`
}

// UniqueConstraint es una restricción única compuesta.
type UniqueConstraint struct {
	Fields []string `yaml:"fields" json:"fields"`
}

// FindTable busca una tabla por nombre.
func (d *Document) FindTable(name string) *Table {
	for _, t := range d.Tables {
		if t.Name == name {
			return t
		}
	}
	return nil
}

// FindField busca un campo por nombre dentro de una tabla.
func (t *Table) FindField(name string) *Field {
	if t == nil {
		return nil
	}
	for _, f := range t.Fields {
		if f.Name == name {
			return f
		}
	}
	return nil
}

// FieldNames devuelve los nombres de los campos en orden.
func (t *Table) FieldNames() []string {
	names := make([]string, 0, len(t.Fields))
	for _, f := range t.Fields {
		names = append(names, f.Name)
	}
	return names
}

// NormalizeDisplayFields deja la representación visible sin posiciones vacías
// ni nombres repetidos, como exige el contrato al guardar.
func (t *Table) NormalizeDisplayFields() {
	if t == nil {
		return
	}
	cleaned := make([]string, 0, len(t.DisplayFields))
	for _, name := range t.DisplayFields {
		trimmed := strings.TrimSpace(name)
		if trimmed == "" || len(cleaned) >= MaxDisplayFields || containsString(cleaned, trimmed) {
			continue
		}
		cleaned = append(cleaned, trimmed)
	}
	if len(cleaned) == 0 {
		t.DisplayFields = nil
		return
	}
	t.DisplayFields = cleaned
}

// Normalize aplica las reglas de escritura del contrato antes de guardar.
func (d *Document) Normalize() {
	if d == nil {
		return
	}
	for _, table := range d.Tables {
		if table == nil {
			continue
		}
		table.LegacyDisplayField = ""
		table.NormalizeDisplayFields()
	}
}

func containsString(values []string, value string) bool {
	for _, item := range values {
		if item == value {
			return true
		}
	}
	return false
}

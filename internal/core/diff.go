package core

import (
	"fmt"
	"reflect"
	"sort"
	"strings"

	"go.yaml.in/yaml/v4"
)

// ChangeSummary describe en texto los cambios semánticos entre dos versiones
// del diccionario. Se usa para el archivo Markdown del historial.
func ChangeSummary(previous, updated *Document) []string {
	if previous == nil || updated == nil {
		return []string{"Sin versión previa para comparar."}
	}
	lines := []string{}

	if previous.SchemaVersion != updated.SchemaVersion {
		lines = append(lines, fmt.Sprintf("- Se actualizó `schema_version`: %d → %d.", previous.SchemaVersion, updated.SchemaVersion))
	}
	lines = append(lines, changedPropertyLines("El proyecto", "project", previous.Project, updated.Project)...)
	lines = append(lines, changedPropertyLines("La base de datos", "database", previous.Database, updated.Database)...)

	previousTables := map[string]*Table{}
	for _, table := range previous.Tables {
		previousTables[table.Name] = table
	}
	updatedTables := map[string]*Table{}
	for _, table := range updated.Tables {
		updatedTables[table.Name] = table
	}

	for _, table := range previous.Tables {
		if _, ok := updatedTables[table.Name]; !ok {
			lines = append(lines, fmt.Sprintf("- Se eliminó la tabla `%s`.", table.Name))
		}
	}
	for _, table := range updated.Tables {
		if _, ok := previousTables[table.Name]; !ok {
			lines = append(lines, fmt.Sprintf("- Se agregó la tabla `%s`.", table.Name))
		}
	}
	if changedOrder(names(previous.Tables), names(updated.Tables)) != "" {
		lines = append(lines, fmt.Sprintf("- Se reordenaron las tablas: %s → %s.", currentOrder(previous.Tables), currentOrder(updated.Tables)))
	}

	for _, table := range updated.Tables {
		previousTable, ok := previousTables[table.Name]
		if !ok {
			continue
		}
		lines = append(lines, changedPropertyLines(fmt.Sprintf("Tabla `%s`", table.Name), "table", previousTable, table)...)
		lines = append(lines, tableFieldSummary(previousTable, table)...)
	}

	if len(lines) == 0 {
		lines = append(lines, "- No se detectaron cambios estructurales respecto del respaldo previo.")
	}
	return lines
}

// presentationKeys son las propiedades que la especificación excluye del
// incremento de schema_version: no afectan almacenamiento ni validez.
var presentationKeys = map[string]bool{
	"label":       true,
	"description": true,
	"notes":       true,
	"ui":          true,
	// La cabecera del proyecto es metadata: nombre, descripción, idiomas y
	// configuración regional no afectan almacenamiento ni validez.
	"project":        true,
	"format_version": true,
	"schema_version": true,
}

// StructuralChange indica si el cambio afecta almacenamiento o validez de los
// datos, es decir, si corresponde incrementar schema_version.
func StructuralChange(previous, updated *Document) bool {
	if previous == nil || updated == nil {
		return false
	}
	return !reflect.DeepEqual(structuralView(previous), structuralView(updated))
}

func structuralView(document *Document) map[string]any {
	view := toMap(document)
	stripPresentation(view)
	return view
}

func stripPresentation(value any) {
	switch node := value.(type) {
	case map[string]any:
		for key := range node {
			if presentationKeys[key] {
				delete(node, key)
				continue
			}
			stripPresentation(node[key])
		}
	case []any:
		for _, item := range node {
			stripPresentation(item)
		}
	}
}

func tableFieldSummary(previous, updated *Table) []string {
	lines := []string{}
	previousFields := map[string]*Field{}
	for _, field := range previous.Fields {
		previousFields[field.Name] = field
	}
	updatedFields := map[string]*Field{}
	for _, field := range updated.Fields {
		updatedFields[field.Name] = field
	}
	for _, field := range previous.Fields {
		if _, ok := updatedFields[field.Name]; !ok {
			lines = append(lines, fmt.Sprintf("- Tabla `%s`: se eliminó el campo `%s`.", updated.Name, field.Name))
		}
	}
	for _, field := range updated.Fields {
		if _, ok := previousFields[field.Name]; !ok {
			lines = append(lines, fmt.Sprintf("- Tabla `%s`: se agregó el campo `%s`.", updated.Name, field.Name))
		}
	}
	if changedOrder(fieldNameList(previous.Fields), fieldNameList(updated.Fields)) != "" {
		lines = append(lines, fmt.Sprintf("- Tabla `%s`: se reordenaron los campos (%s).", updated.Name, currentFieldOrder(updated)))
	}
	for _, field := range updated.Fields {
		previousField, ok := previousFields[field.Name]
		if !ok {
			continue
		}
		keys := changedKeys(previousField, field)
		if len(keys) == 0 {
			continue
		}
		lines = append(lines, fmt.Sprintf("- Tabla `%s`, campo `%s`: cambió %s.", updated.Name, field.Name, strings.Join(keys, ", ")))
	}
	return lines
}

func changedPropertyLines(subject, kind string, previous, updated any) []string {
	keys := changedKeys(previous, updated)
	lines := []string{}
	for _, key := range keys {
		lines = append(lines, fmt.Sprintf("- %s (%s): cambió `%s`.", subject, kind, key))
	}
	return lines
}

// changedKeys compara dos estructuras propiedad por propiedad.
func changedKeys(previous, updated any) []string {
	previousMap := toMap(previous)
	updatedMap := toMap(updated)
	keys := []string{}
	for key := range previousMap {
		if _, ok := updatedMap[key]; !ok {
			keys = append(keys, key)
			continue
		}
		if !reflect.DeepEqual(previousMap[key], updatedMap[key]) {
			keys = append(keys, key)
		}
	}
	for key := range updatedMap {
		if _, ok := previousMap[key]; !ok {
			keys = append(keys, key)
		}
	}
	sort.Strings(keys)
	return keys
}

func toMap(value any) map[string]any {
	raw, err := yaml.Marshal(value)
	if err != nil {
		return map[string]any{}
	}
	result := map[string]any{}
	if err := yaml.Unmarshal(raw, &result); err != nil {
		return map[string]any{}
	}
	return result
}

func names(tables []*Table) []string {
	result := make([]string, 0, len(tables))
	for _, table := range tables {
		result = append(result, table.Name)
	}
	return result
}

func fieldNameList(fields []*Field) []string {
	result := make([]string, 0, len(fields))
	for _, field := range fields {
		result = append(result, field.Name)
	}
	return result
}

func changedOrder(previous, updated []string) string {
	if len(previous) != len(updated) {
		return ""
	}
	same := true
	for i := range previous {
		if previous[i] != updated[i] {
			same = false
			break
		}
	}
	if same {
		return ""
	}
	added := map[string]bool{}
	for _, name := range updated {
		added[name] = true
	}
	for _, name := range previous {
		if !added[name] {
			return ""
		}
	}
	previousPosition := map[string]int{}
	for i, name := range previous {
		previousPosition[name] = i
	}
	moved := []string{}
	for i, name := range updated {
		if previousPosition[name] != i {
			moved = append(moved, name)
		}
	}
	if len(moved) == 0 {
		return ""
	}
	return strings.Join(moved, ", ")
}

func currentOrder(tables []*Table) string {
	return strings.Join(names(tables), ", ")
}

func currentFieldOrder(table *Table) string {
	return strings.Join(fieldNameList(table.Fields), ", ")
}

package core

import (
	"strings"
	"testing"
)

func TestLegacyV1IsMigratedToV2(t *testing.T) {
	path := writeDictionary(t, legacyDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	if !result.MigratedFromV1 {
		t.Fatal("el archivo v1 debería informarse como migrado")
	}
	if result.Document.FormatVersion != FormatVersion {
		t.Fatalf("en memoria el formato debe ser %d: %d", FormatVersion, result.Document.FormatVersion)
	}
	table := result.Document.FindTable("localidades")
	if len(table.DisplayFields) != 1 || table.DisplayFields[0] != "nombre" {
		t.Fatalf("display_field debería migrarse a display_fields: %v", table.DisplayFields)
	}
	if HasErrors(result.Findings) {
		t.Fatalf("el archivo v1 migrado no debería tener errores: %v", result.Findings)
	}

	table.Description = "edición posterior"
	mustSave(t, engine, result.Document)
	saved := readFile(t, path)
	if !strings.Contains(saved, "format_version: 2") {
		t.Fatal("al guardar debe escribirse format_version 2")
	}
	if strings.Contains(saved, "display_field:") {
		t.Fatal("al guardar no debe quedar la propiedad display_field")
	}
	if !strings.Contains(saved, "display_fields:") {
		t.Fatal("al guardar debe quedar display_fields")
	}
}

func TestV2RejectsLegacyDisplayField(t *testing.T) {
	legacy := strings.Replace(legacyDictionary, "format_version: 1", "format_version: 2", 1)
	if _, err := DecodeDocument([]byte(legacy)); err == nil {
		t.Fatal("un archivo v2 con display_field debe rechazarse")
	}
}

func TestUnsupportedFormatVersionIsRejected(t *testing.T) {
	future := strings.Replace(sampleDictionary, "format_version: 2", "format_version: 3", 1)
	if _, err := DecodeDocument([]byte(future)); err == nil {
		t.Fatal("una versión de formato desconocida debe rechazarse")
	}
}

func TestDisplayFieldsRules(t *testing.T) {
	base, err := DecodeDocument([]byte(sampleDictionary))
	if err != nil {
		t.Fatalf("no se pudo interpretar el diccionario de prueba: %v", err)
	}
	table := base.FindTable("usuarios")

	table.DisplayFields = []string{"id", "id"}
	if len(findingsWithCode(Validate(base), CodeDisplayFields)) == 0 {
		t.Fatal("los campos repetidos deben informarse")
	}

	table.DisplayFields = []string{"id", "inexistente"}
	if len(findingsWithCode(Validate(base), CodeDisplayFields)) == 0 {
		t.Fatal("una referencia inexistente debe informarse")
	}

	table.DisplayFields = []string{"id", "localidad_id", "id", "localidad_id", "id", "localidad_id"}
	if len(findingsWithCode(Validate(base), CodeDisplayFields)) == 0 {
		t.Fatal("más de cinco campos debe informarse")
	}

	table.DisplayFields = []string{"id", "localidad_id"}
	if findings := Validate(base); HasErrors(findings) || len(findingsWithCode(findings, CodeDisplayFields)) > 0 {
		t.Fatalf("dos campos válidos no deberían generar hallazgos: %v", findings)
	}
}

func TestDisplayFieldsAreNormalizedOnSave(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	table := result.Document.FindTable("usuarios")
	table.DisplayFields = []string{" id ", "", "id", "localidad_id", "  "}
	mustSave(t, engine, result.Document)

	reopened := mustLoad(t, NewEngine(), path).Document
	got := reopened.FindTable("usuarios").DisplayFields
	if len(got) != 2 || got[0] != "id" || got[1] != "localidad_id" {
		t.Fatalf("la representación visible debería quedar limpia: %v", got)
	}
}

func TestLookupMetadata(t *testing.T) {
	base, err := DecodeDocument([]byte(sampleDictionary))
	if err != nil {
		t.Fatalf("no se pudo interpretar el diccionario de prueba: %v", err)
	}
	field := base.FindTable("usuarios").FindField("localidad_id")
	field.UI = &FieldUI{
		Control: "lookup",
		Lookup: &LookupUI{
			AllowCreate:       boolPointer(true),
			SearchModes:       []string{"prefix", "contains"},
			DefaultSearchMode: "prefix",
			UserCanSwitchMode: boolPointer(true),
		},
	}
	if findings := Validate(base); len(findingsWithCode(findings, CodeLookupMetadata)) > 0 {
		t.Fatalf("la metadata de lookup válida no debería generar hallazgos: %v", findings)
	}

	field.UI.Lookup.SearchModes = []string{"prefix", "difusa"}
	if len(findingsWithCode(Validate(base), CodeLookupMetadata)) == 0 {
		t.Fatal("un modo de búsqueda inválido debe informarse")
	}

	field.UI.Lookup.SearchModes = []string{"contains"}
	field.UI.Lookup.DefaultSearchMode = "prefix"
	if len(findingsWithCode(Validate(base), CodeLookupMetadata)) == 0 {
		t.Fatal("un modo por defecto fuera de la lista debe informarse")
	}

	field.UI.Lookup.SearchModes = nil
	field.UI.Lookup.DefaultSearchMode = ""
	field.UI.Control = "select"
	findings := Validate(base)
	if len(findingsWithCode(findings, CodeLookupMetadata)) == 0 {
		t.Fatal("ui.lookup fuera de un control lookup debe advertirse")
	}
}

func TestSwitchControlAndAuditable(t *testing.T) {
	document, err := DecodeDocument([]byte(sampleDictionary))
	if err != nil {
		t.Fatalf("no se pudo interpretar el diccionario de prueba: %v", err)
	}
	field := document.FindTable("usuarios").FindField("localidad_id")
	field.UI = &FieldUI{Control: "switch"}
	field.Auditable = boolPointer(true)

	findings := Validate(document)
	if len(findingsWithCode(findings, CodeControl)) > 0 {
		t.Fatalf("`switch` debe ser un control válido: %v", findings)
	}
	if HasErrors(findings) {
		t.Fatalf("auditable no debería generar errores: %v", findings)
	}

	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	loaded := mustLoad(t, engine, path)
	loaded.Document.FindTable("usuarios").FindField("localidad_id").Auditable = boolPointer(true)
	mustSave(t, engine, loaded.Document)

	reopened := mustLoad(t, NewEngine(), path).Document
	auditable := reopened.FindTable("usuarios").FindField("localidad_id").Auditable
	if auditable == nil || !*auditable {
		t.Fatal("`auditable` debería conservarse al guardar")
	}
}

func TestTemporalDefaultUsesCanonicalFormat(t *testing.T) {
	document, err := DecodeDocument([]byte(sampleDictionary))
	if err != nil {
		t.Fatalf("no se pudo interpretar el diccionario de prueba: %v", err)
	}
	field := document.FindTable("localidades").FindField("nombre")
	field.LogicalType = "date"
	field.Length = nil
	field.Default = &DefaultValue{Kind: "literal", Value: "28/09/2026"}

	if len(findingsWithCode(Validate(document), CodeTemporalFormat)) == 0 {
		t.Fatal("una fecha fuera del formato canónico debe advertirse")
	}

	field.Default = &DefaultValue{Kind: "literal", Value: "2026-09-28"}
	if len(findingsWithCode(Validate(document), CodeTemporalFormat)) > 0 {
		t.Fatal("una fecha canónica no debería advertirse")
	}
}

package core

import "testing"

func findingsWithCode(findings []Finding, code string) []Finding {
	result := []Finding{}
	for _, finding := range findings {
		if finding.Code == code {
			result = append(result, finding)
		}
	}
	return result
}

func TestValidateDetectsBrokenReferences(t *testing.T) {
	document, err := DecodeDocument([]byte(sampleDictionary))
	if err != nil {
		t.Fatalf("no se pudo interpretar el diccionario de prueba: %v", err)
	}
	table := document.FindTable("usuarios")
	table.PrimaryKey = []string{"inexistente"}
	table.DisplayFields = []string{"tampoco_existe"}
	table.Fields[1].Relation = &Relation{Table: "nope", Field: "id", OnDelete: "restrict"}
	table.Indexes = []*Index{{Name: "idx_prueba", Fields: []*IndexField{{Name: "falta"}}}}
	table.UI = &TableUI{DefaultSort: "idx_otro"}

	findings := Validate(document)
	for _, code := range []string{CodePrimaryKey, CodeDisplayFields, CodeRelationTable, CodeIndexField, CodeSortIndex} {
		if len(findingsWithCode(findings, code)) == 0 {
			t.Fatalf("se esperaba un hallazgo con el código %s", code)
		}
	}
	if !HasErrors(findings) {
		t.Fatal("las referencias rotas deben ser errores")
	}
}

func TestValidateNumericAndDefaultRules(t *testing.T) {
	document, err := DecodeDocument([]byte(sampleDictionary))
	if err != nil {
		t.Fatalf("no se pudo interpretar el diccionario de prueba: %v", err)
	}
	table := document.FindTable("usuarios")
	field := table.Fields[1]
	field.LogicalType = "decimal"
	field.Precision = intPointer(5)
	field.Scale = intPointer(7)
	field.Validation = &Validation{Min: floatPointer(10), Max: floatPointer(2)}
	field.Default = &DefaultValue{Kind: "literal", Value: "texto"}
	field.AllowedValues = []*AllowedValue{{Value: "no numérico"}}
	field.Relation.OnDelete = "set_null"
	required := true
	field.Required = &required

	findings := Validate(document)
	for _, code := range []string{CodeScalePrecision, CodeMinMax, CodeDefaultValue, CodeAllowedValue, CodeSetNullRequired} {
		if len(findingsWithCode(findings, code)) == 0 {
			t.Fatalf("se esperaba un hallazgo con el código %s", code)
		}
	}
}

func TestValidateWarnings(t *testing.T) {
	document, err := DecodeDocument([]byte(sampleDictionary))
	if err != nil {
		t.Fatalf("no se pudo interpretar el diccionario de prueba: %v", err)
	}
	document.FindTable("localidades").DisplayFields = nil

	findings := Validate(document)
	if len(findingsWithCode(findings, CodeLookupDisplayField)) == 0 {
		t.Fatal("se esperaba la advertencia por tabla lookup sin display_field")
	}
	if HasErrors(findings) {
		t.Fatalf("las advertencias no deben impedir guardar: %v", findings)
	}

	withEmptyTable, err := DecodeDocument([]byte(sampleDictionary))
	if err != nil {
		t.Fatalf("no se pudo interpretar el diccionario de prueba: %v", err)
	}
	withEmptyTable.Tables = append(withEmptyTable.Tables, &Table{Name: "vacia"})
	if len(findingsWithCode(Validate(withEmptyTable), CodeTableWithoutFields)) == 0 {
		t.Fatal("se esperaba la advertencia por tabla sin campos")
	}
}

func TestValidateActiveEngine(t *testing.T) {
	document, err := DecodeDocument([]byte(sampleDictionary))
	if err != nil {
		t.Fatalf("no se pudo interpretar el diccionario de prueba: %v", err)
	}
	document.Database.ActiveEngine = "postgres"
	findings := Validate(document)
	if len(findingsWithCode(findings, CodeActiveEngine)) == 0 {
		t.Fatal("se esperaba un error cuando el motor activo no está declarado")
	}
}

func floatPointer(value float64) *float64 {
	return &value
}

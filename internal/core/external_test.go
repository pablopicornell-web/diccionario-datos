package core

import (
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

// TestExternalDictionary comprueba el editor contra un DiccionarioDatos.yaml
// real, generado con la skill canónica. Se ejecuta sólo cuando se indica la
// ruta del archivo, para no depender de rutas locales en la suite normal.
func TestExternalDictionary(t *testing.T) {
	path := os.Getenv("DICCIONARIO_YAML")
	if path == "" {
		t.Skip("definí DICCIONARIO_YAML con la ruta de un diccionario real para ejecutar esta prueba")
	}

	document, _, err := LoadDocument(path)
	if err != nil {
		t.Fatalf("el editor no pudo leer el diccionario real: %v", err)
	}
	findings := Validate(document)
	for _, finding := range findings {
		t.Logf("%s [%s] %s", finding.Severity, finding.Code, finding.Message)
	}
	if HasErrors(findings) {
		t.Fatalf("el diccionario real tiene %d errores de validación", len(findings))
	}

	// Reescribir el archivo no debe perder ni alterar información.
	encoded, err := EncodeDocument(document)
	if err != nil {
		t.Fatalf("no se pudo reescribir el diccionario real: %v", err)
	}
	reopened, err := DecodeDocument(encoded)
	if err != nil {
		t.Fatalf("el diccionario reescrito no se pudo volver a leer: %v", err)
	}
	// La marca de migración es del proceso de lectura, no del contenido.
	reopened.MigratedFromV1 = document.MigratedFromV1
	if !reflect.DeepEqual(document, reopened) {
		t.Fatal("el ida y vuelta del archivo real perdió información")
	}
	if StructuralChange(document, reopened) {
		t.Fatal("el ida y vuelta no debería contar como cambio estructural")
	}
}

// TestExternalDictionaryEditCycle ejecuta un ciclo completo de edición —alta de
// un índice compuesto, guardado y relectura— sobre una copia del diccionario
// real, para comprobar que el editor no rompe el archivo que usa la skill.
func TestExternalDictionaryEditCycle(t *testing.T) {
	source := os.Getenv("DICCIONARIO_YAML")
	if source == "" {
		t.Skip("definí DICCIONARIO_YAML con la ruta de un diccionario real para ejecutar esta prueba")
	}
	data, err := os.ReadFile(source)
	if err != nil {
		t.Fatalf("no se pudo leer el diccionario real: %v", err)
	}
	dir := t.TempDir()
	path := filepath.Join(dir, MasterFileName)
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatalf("no se pudo preparar la copia de trabajo: %v", err)
	}

	engine := NewEngine()
	loaded := mustLoad(t, engine, path)
	originalVersion := loaded.Document.SchemaVersion
	table := loaded.Document.Tables[0]
	table.Indexes = append(table.Indexes, &Index{
		Name:   "idx_prueba_compuesto",
		Unique: boolPointer(false),
		Fields: []*IndexField{
			{Name: table.Fields[0].Name, Order: "asc"},
			{Name: table.Fields[1].Name, Order: "desc"},
		},
	})

	saved := mustSave(t, engine, loaded.Document)
	if saved.Document.SchemaVersion != originalVersion+1 {
		t.Fatalf("el cambio estructural debería incrementar schema_version: %d", saved.Document.SchemaVersion)
	}

	reopened := mustLoad(t, NewEngine(), path)
	if len(reopened.Document.Tables) != len(loaded.Document.Tables) {
		t.Fatalf("se perdió una tabla: %d", len(reopened.Document.Tables))
	}
	var added *Index
	for _, index := range reopened.Document.Tables[0].Indexes {
		if index.Name == "idx_prueba_compuesto" {
			added = index
		}
	}
	if added == nil {
		t.Fatal("el índice nuevo no quedó guardado")
	}
	if len(added.Fields) != 2 || added.Fields[1].Order != "desc" {
		t.Fatalf("el índice compuesto no se conservó: %+v", added.Fields)
	}

	summary, err := engine.HistorySummary(saved.HistoryID)
	if err != nil {
		t.Fatalf("no se pudo leer el resumen del historial: %v", err)
	}
	if !strings.Contains(summary, "indexes") {
		t.Fatalf("el resumen debería registrar el cambio de índices:\n%s", summary)
	}
}

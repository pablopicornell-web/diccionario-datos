package core

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const sampleDictionary = `format_version: 2
schema_version: 1
project:
  name: Pruebas
  description: Diccionario de prueba
  default_language: es
  languages:
    - es
    - en
  locale: es-AR
database:
  active_engine: sqlite
  engines:
    - sqlite
tables:
  - name: localidades
    table_role: lookup
    display_fields:
      - nombre
    primary_key:
      - id
    fields:
      - name: id
        logical_type: integer
        required: true
        generated:
          strategy: auto_increment
        physical:
          sqlite:
            type: INTEGER
      - name: nombre
        logical_type: string
        length: 60
        required: true
        physical:
          sqlite:
            type: TEXT
  - name: usuarios
    primary_key:
      - id
    fields:
      - name: id
        logical_type: integer
        required: true
        generated:
          strategy: auto_increment
        physical:
          sqlite:
            type: INTEGER
      - name: localidad_id
        logical_type: integer
        relation:
          table: localidades
          field: id
          on_delete: restrict
        physical:
          sqlite:
            type: INTEGER
`

// legacyDictionary es un archivo format_version 1, el contrato anterior que el
// editor acepta sólo para migrarlo.
const legacyDictionary = `format_version: 1
schema_version: 1
project:
  name: Pruebas v1
  default_language: es
  languages:
    - es
database:
  active_engine: sqlite
  engines:
    - sqlite
tables:
  - name: localidades
    table_role: lookup
    display_field: nombre
    primary_key:
      - id
    fields:
      - name: id
        logical_type: integer
        required: true
      - name: nombre
        logical_type: string
        length: 60
        required: true
`

// writeDictionary escribe un diccionario de prueba y devuelve su ruta.
func writeDictionary(t *testing.T, content string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, MasterFileName)
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("no se pudo preparar el diccionario de prueba: %v", err)
	}
	return path
}

func mustLoad(t *testing.T, engine *Engine, path string) *LoadResult {
	t.Helper()
	result, err := engine.Load(path)
	if err != nil {
		t.Fatalf("no se pudo abrir el diccionario: %v", err)
	}
	return result
}

func mustSave(t *testing.T, engine *Engine, document *Document) *SaveResult {
	t.Helper()
	result, err := engine.Save(document)
	if err != nil {
		t.Fatalf("no se pudo guardar el diccionario: %v", err)
	}
	if !result.Saved {
		t.Fatalf("el guardado no se concretó: %s", result.Message)
	}
	return result
}

func readFile(t *testing.T, path string) string {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("no se pudo leer %s: %v", path, err)
	}
	return string(data)
}

func countHistoryFiles(t *testing.T, path string, extension string) int {
	t.Helper()
	entries, err := os.ReadDir(filepath.Join(filepath.Dir(path), HistoryDirName))
	if err != nil {
		return 0
	}
	total := 0
	for _, entry := range entries {
		if strings.HasSuffix(entry.Name(), extension) {
			total++
		}
	}
	return total
}

package core

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadValidDictionary(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	if HasErrors(result.Findings) {
		t.Fatalf("el diccionario válido devolvió errores: %v", result.Findings)
	}
	if len(result.Document.Tables) != 2 {
		t.Fatalf("se esperaban 2 tablas y hay %d", len(result.Document.Tables))
	}
	if result.Document.Tables[0].Name != "localidades" || result.Document.Tables[1].Name != "usuarios" {
		t.Fatalf("se perdió el orden de las tablas: %v", names(result.Document.Tables))
	}
	if result.Document.Tables[1].FindField("localidad_id").Relation.Table != "localidades" {
		t.Fatal("no se leyó la relación entre usuarios y localidades")
	}
}

func TestLoadRejectsInvalidYAML(t *testing.T) {
	engine := NewEngine()

	broken := writeDictionary(t, "format_version: 1\nproject:\n  name: [sin cerrar\n")
	if _, err := engine.Load(broken); err == nil {
		t.Fatal("un YAML inválido debería rechazarse")
	}

	unknown := writeDictionary(t, "format_version: 1\nproject:\n  name: X\n  inventada: 1\n")
	if _, err := engine.Load(unknown); err == nil {
		t.Fatal("una propiedad no definida debería rechazarse")
	}

	empty := writeDictionary(t, "   \n")
	if _, err := engine.Load(empty); err == nil {
		t.Fatal("un archivo vacío debería rechazarse")
	}
}

func TestEditSaveAndReopen(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	document := result.Document
	field := document.FindTable("usuarios").FindField("localidad_id")
	field.Label = NewLabels()
	field.Label.Set("es", "Localidad")
	field.Required = boolPointer(false)

	saved := mustSave(t, engine, document)
	if saved.HistoryID == "" {
		t.Fatal("el guardado no registró una versión en el historial")
	}
	if countHistoryFiles(t, path, ".yaml") != 1 || countHistoryFiles(t, path, ".md") != 1 {
		t.Fatal("se esperaba una copia previa en YAML y su resumen en Markdown")
	}

	reopened := mustLoad(t, NewEngine(), path)
	reopenedField := reopened.Document.FindTable("usuarios").FindField("localidad_id")
	if reopenedField.Label.Get("es") != "Localidad" {
		t.Fatalf("no se conservó la etiqueta guardada: %q", reopenedField.Label.Get("es"))
	}
	if reopenedField.Required == nil || *reopenedField.Required {
		t.Fatal("no se conservó el cambio de `required`")
	}
	if !strings.Contains(readFile(t, path), "  - name: localidades") {
		t.Fatal("el archivo guardado perdió la sangría canónica de dos espacios")
	}
}

func TestSaveRejectsStructuralErrors(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	original := readFile(t, path)
	result := mustLoad(t, engine, path)

	document := result.Document
	document.FindTable("usuarios").Fields = append(
		document.FindTable("usuarios").Fields,
		&Field{Name: "id", LogicalType: "integer"},
	)

	saveResult, err := engine.Save(document)
	if err != nil {
		t.Fatalf("el guardado no debería fallar con error técnico: %v", err)
	}
	if saveResult.Saved {
		t.Fatal("no se debería guardar un diccionario con errores de estructura")
	}
	if !HasErrors(saveResult.Findings) {
		t.Fatal("se esperaba al menos un error de validación")
	}
	if readFile(t, path) != original {
		t.Fatal("el archivo maestro no debería cambiar cuando hay errores")
	}
	if countHistoryFiles(t, path, ".yaml") != 0 {
		t.Fatal("no se debería crear respaldo si el guardado no se concreta")
	}
}

func TestSaveDetectsExternalChange(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	external := strings.Replace(sampleDictionary, "name: Pruebas", "name: Modificado afuera", 1)
	if err := os.WriteFile(path, []byte(external), 0o644); err != nil {
		t.Fatalf("no se pudo simular el cambio externo: %v", err)
	}

	document := result.Document
	document.FindTable("usuarios").FindField("localidad_id").Description = "cambio local"
	if _, err := engine.Save(document); err == nil {
		t.Fatal("se debería detectar el cambio externo y no sobrescribir")
	}
	if !strings.Contains(readFile(t, path), "Modificado afuera") {
		t.Fatal("el archivo externo no debería ser reemplazado")
	}

	state, err := engine.CheckExternal()
	if err != nil {
		t.Fatalf("no se pudo verificar el estado del archivo: %v", err)
	}
	if !state.Changed {
		t.Fatal("CheckExternal debería informar que el archivo cambió")
	}
}

func TestLockBlocksSecondSessionAndCanBeCleared(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	first := NewEngine()
	second := NewEngine()
	mustLoad(t, first, path)
	mustLoad(t, second, path)

	state, err := first.BeginEdit()
	if err != nil {
		t.Fatalf("la primera sesión debería adquirir el bloqueo: %v", err)
	}
	if !state.Held || !state.Exists {
		t.Fatal("el bloqueo de la primera sesión no quedó registrado")
	}
	if _, err := second.BeginEdit(); err == nil {
		t.Fatal("la segunda sesión no debería poder editar mientras hay bloqueo")
	}
	lockState, err := second.LockState()
	if err != nil {
		t.Fatalf("no se pudo consultar el bloqueo: %v", err)
	}
	if !lockState.Orphan || lockState.Lock.Machine == "" {
		t.Fatal("el bloqueo ajeno debería informarse como huérfano con su origen")
	}
	if err := second.ClearLock(); err != nil {
		t.Fatalf("no se pudo liberar el bloqueo manualmente: %v", err)
	}
	if _, err := second.BeginEdit(); err != nil {
		t.Fatalf("después de liberar el bloqueo la edición debería ser posible: %v", err)
	}
	if err := second.CancelEdit(); err != nil {
		t.Fatalf("no se pudo cancelar la sesión: %v", err)
	}
}

func TestRestoreVersion(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	document := result.Document
	document.FindTable("localidades").FindField("nombre").Length = intPointer(120)
	mustSave(t, engine, document)
	if !strings.Contains(readFile(t, path), "length: 120") {
		t.Fatal("el primer guardado no se aplicó")
	}

	entries, err := engine.History()
	if err != nil || len(entries) != 1 {
		t.Fatalf("se esperaba una versión en el historial: %v", err)
	}
	if !entries[0].HasMarkdown {
		t.Fatal("la versión del historial debería tener su resumen en Markdown")
	}
	summary, err := engine.HistorySummary(entries[0].ID)
	if err != nil || !strings.Contains(summary, "nombre") {
		t.Fatalf("el resumen debería describir el cambio: %v / %s", err, summary)
	}

	restored, err := engine.Restore(entries[0].ID)
	if err != nil {
		t.Fatalf("no se pudo restaurar la versión: %v", err)
	}
	nombre := restored.Document.FindTable("localidades").FindField("nombre")
	if nombre.Length == nil || *nombre.Length != 60 {
		t.Fatalf("la restauración no devolvió la longitud anterior: %v", nombre.Length)
	}
	if readFile(t, path) != sampleDictionary {
		t.Fatal("el archivo restaurado no coincide con la versión elegida")
	}
	if countHistoryFiles(t, path, ".yaml") != 2 {
		t.Fatal("la restauración debería respaldar el maestro anterior")
	}
}

func TestReorderPreservesOrder(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	document := result.Document
	document.Tables[0], document.Tables[1] = document.Tables[1], document.Tables[0]
	fields := document.FindTable("usuarios").Fields
	fields[0], fields[1] = fields[1], fields[0]
	mustSave(t, engine, document)

	saved := mustLoad(t, NewEngine(), path).Document
	if names(saved.Tables)[0] != "usuarios" {
		t.Fatalf("no se conservó el orden de las tablas: %v", names(saved.Tables))
	}
	if fieldNameList(saved.FindTable("usuarios").Fields)[0] != "localidad_id" {
		t.Fatalf("no se conservó el orden de los campos: %v", fieldNameList(saved.FindTable("usuarios").Fields))
	}
}

func TestSaveWithoutSessionCreatesBackupOnce(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	document := result.Document
	document.Project.Description = "primera edición"
	mustSave(t, engine, document)
	document.Project.Description = "segunda edición"
	mustSave(t, engine, document)

	if countHistoryFiles(t, path, ".yaml") != 2 {
		t.Fatalf("cada sesión de edición debería dejar una copia previa")
	}
	if _, err := os.Stat(filepath.Join(filepath.Dir(path), LockFileName)); !os.IsNotExist(err) {
		t.Fatal("el bloqueo debería liberarse al terminar el guardado")
	}
}

func TestSchemaVersionIncrementsOnStructuralChange(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	presentation := result.Document
	presentation.FindTable("usuarios").Description = "sólo presentación"
	presentation.FindTable("usuarios").FindField("localidad_id").Notes = "nota interna"
	first := mustSave(t, engine, presentation)
	if first.Document == nil {
		t.Fatal("el guardado debería devolver el documento guardado")
	}
	if first.Document.SchemaVersion != 1 {
		t.Fatalf("los cambios de presentación no deben incrementar schema_version: %d", first.Document.SchemaVersion)
	}

	structural := first.Document
	structural.FindTable("usuarios").FindField("localidad_id").Length = intPointer(20)
	second := mustSave(t, engine, structural)
	if second.Document.SchemaVersion != 2 {
		t.Fatalf("un cambio estructural debe incrementar schema_version: %d", second.Document.SchemaVersion)
	}
	if reopened := mustLoad(t, NewEngine(), path); reopened.Document.SchemaVersion != 2 {
		t.Fatalf("el archivo guardado debería conservar schema_version 2: %d", reopened.Document.SchemaVersion)
	}
}

func boolPointer(value bool) *bool {
	return &value
}

func TestSchemaVersionIgnoresProjectAndVisualChanges(t *testing.T) {
	path := writeDictionary(t, sampleDictionary)
	engine := NewEngine()
	result := mustLoad(t, engine, path)

	metadata := result.Document
	metadata.Project.Languages = append(metadata.Project.Languages, "pt")
	metadata.Project.Name = "Pruebas renombrado"
	metadata.FindTable("usuarios").FindField("localidad_id").UI = &FieldUI{
		Control: "text",
		Align:   "left",
		Format:  &NumberFormat{DecimalPlaces: intPointer(2)},
	}
	first := mustSave(t, engine, metadata)
	if first.Document.SchemaVersion != 1 {
		t.Fatalf("idiomas y metadata visual no deben incrementar schema_version: %d", first.Document.SchemaVersion)
	}

	structural := first.Document
	structural.FindTable("usuarios").Indexes = append(structural.FindTable("usuarios").Indexes,
		&Index{Name: "idx_usuarios_orden", Fields: []*IndexField{{Name: "id", Order: "asc"}}})
	second := mustSave(t, engine, structural)
	if second.Document.SchemaVersion != 2 {
		t.Fatalf("un índice nuevo es estructural: %d", second.Document.SchemaVersion)
	}
}

func intPointer(value int) *int {
	return &value
}

package core

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Engine mantiene el estado de trabajo sobre un diccionario abierto: qué
// archivo está cargado, su contenido en memoria, el bloqueo de la sesión de
// edición y el respaldo pendiente.
type Engine struct {
	mu       sync.Mutex
	path     string
	document *Document
	hash     string
	lock     *Lock
	backup   *HistoryEntry
	host     string
}

// LoadResult devuelve el diccionario abierto y su estado.
type LoadResult struct {
	Path     string     `json:"path"`
	SHA256   string     `json:"sha256"`
	Document *Document  `json:"document"`
	Findings []Finding  `json:"findings"`
	Lock     *LockState `json:"lock"`
	// MigratedFromV1 avisa que el archivo estaba en format_version 1 y se
	// convirtió en memoria; al guardar quedará escrito en format_version 2.
	MigratedFromV1 bool `json:"migratedFromV1"`
}

// SaveResult informa el resultado de un guardado.
type SaveResult struct {
	Saved     bool      `json:"saved"`
	Path      string    `json:"path"`
	SHA256    string    `json:"sha256"`
	Findings  []Finding `json:"findings"`
	HistoryID string    `json:"historyId"`
	Message   string    `json:"message"`
	Document  *Document `json:"document"`
}

// ExternalState informa si el archivo maestro cambió fuera del editor.
type ExternalState struct {
	Path          string `json:"path"`
	Changed       bool   `json:"changed"`
	Missing       bool   `json:"missing"`
	BaseSHA256    string `json:"baseSha256"`
	CurrentSHA256 string `json:"currentSha256"`
}

// NewEngine crea un motor sin diccionario abierto.
func NewEngine() *Engine {
	host, err := os.Hostname()
	if err != nil || host == "" {
		host = "desconocida"
	}
	return &Engine{host: host}
}

// Path devuelve la ruta del diccionario abierto.
func (e *Engine) Path() string {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.path
}

// Document devuelve el diccionario en memoria.
func (e *Engine) Document() *Document {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.document
}

// LockPath devuelve la ruta del archivo de bloqueo del diccionario abierto.
func (e *Engine) LockPath() string {
	if e.path == "" {
		return ""
	}
	return filepath.Join(filepath.Dir(e.path), LockFileName)
}

// HistoryDir devuelve la carpeta de historial del diccionario abierto.
func (e *Engine) HistoryDir() string {
	if e.path == "" {
		return ""
	}
	return filepath.Join(filepath.Dir(e.path), HistoryDirName)
}

// Load abre un diccionario desde disco y descarta cualquier sesión anterior.
func (e *Engine) Load(path string) (*LoadResult, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if strings.TrimSpace(path) == "" {
		return nil, errors.New("no se indicó ningún archivo")
	}
	absolute, err := filepath.Abs(path)
	if err != nil {
		absolute = path
	}
	document, hash, err := LoadDocument(absolute)
	if err != nil {
		return nil, err
	}
	if e.lock != nil {
		_ = e.releaseLockLocked()
	}
	e.path = absolute
	e.document = document
	e.hash = hash
	e.backup = nil
	return e.loadResultLocked(), nil
}

// Reload vuelve a leer el diccionario desde disco.
func (e *Engine) Reload() (*LoadResult, error) {
	e.mu.Lock()
	path := e.path
	e.mu.Unlock()
	if path == "" {
		return nil, errors.New("no hay diccionario abierto")
	}
	return e.Load(path)
}

// ValidateDocument valida un documento sin modificarlo.
func (e *Engine) ValidateDocument(document *Document) []Finding {
	findings := Validate(document)
	SortFindings(findings)
	return findings
}

// BeginEdit abre la sesión de edición: adquiere el bloqueo cooperativo.
func (e *Engine) BeginEdit() (*LockState, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.path == "" {
		return nil, errors.New("no hay diccionario abierto")
	}
	if e.lock != nil {
		return e.lockStateLocked(), nil
	}
	if err := e.acquireLockLocked(); err != nil {
		return nil, err
	}
	return e.lockStateLocked(), nil
}

// CancelEdit descarta la sesión de edición y libera el bloqueo.
func (e *Engine) CancelEdit() error {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.backup = nil
	return e.releaseLockLocked()
}

// Close libera el bloqueo si la aplicación se cierra durante una edición.
func (e *Engine) Close() {
	e.mu.Lock()
	defer e.mu.Unlock()
	_ = e.releaseLockLocked()
}

// Save valida, respalda y guarda el diccionario con reemplazo seguro.
func (e *Engine) Save(document *Document) (*SaveResult, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.path == "" {
		return nil, errors.New("no hay diccionario abierto")
	}
	result := &SaveResult{Path: e.path}
	// El contrato sólo persiste representaciones visibles válidas: sin
	// posiciones vacías, sin repetidos y con la versión vigente del formato.
	document.Normalize()
	document.FormatVersion = FormatVersion
	findings := Validate(document)
	SortFindings(findings)
	result.Findings = findings
	if HasErrors(findings) {
		result.Message = "Hay errores de estructura: no se guardó nada."
		return result, nil
	}
	if e.lock == nil {
		if err := e.acquireLockLocked(); err != nil {
			return nil, err
		}
	}

	currentData, currentHash, err := ReadFileHash(e.path)
	if err != nil {
		return nil, fmt.Errorf("no se pudo leer el archivo maestro: %w", err)
	}
	if currentHash != e.lock.BaseSHA256 {
		return nil, errors.New("el diccionario fue modificado externamente: no se sobrescribió nada; recargá el archivo y volvé a intentar")
	}
	if e.backup == nil {
		entry, err := e.writeHistoryYAMLLocked(currentData, time.Now())
		if err != nil {
			return nil, err
		}
		e.backup = entry
	}

	// El estado anterior se toma del archivo en disco: el documento recibido
	// puede ser el mismo objeto que el editor venía modificando en memoria.
	previous, err := DecodeDocument(currentData)
	if err != nil {
		previous = nil
	}
	if StructuralChange(previous, document) && previous != nil {
		document.SchemaVersion = previous.SchemaVersion + 1
	}

	encoded, err := EncodeDocument(document)
	if err != nil {
		return nil, err
	}
	if err := writeVerifiedMaster(e.path, encoded); err != nil {
		return nil, err
	}
	_, finalHash, err := ReadFileHash(e.path)
	if err != nil {
		return nil, fmt.Errorf("el archivo guardado no se pudo releer: %w", err)
	}
	if finalHash != HashBytes(encoded) {
		return nil, errors.New("el archivo guardado no coincide con el contenido generado")
	}

	e.document = document
	e.hash = finalHash
	result.Saved = true
	result.SHA256 = finalHash
	result.HistoryID = e.backup.ID
	result.Document = document
	result.Message = "Diccionario guardado."

	if err := e.writeHistoryMarkdownLocked(e.backup, ChangeSummary(previous, document)); err != nil {
		result.Message = "Diccionario guardado, pero no se pudo escribir el resumen del historial: " + err.Error()
	}
	e.backup = nil
	if err := e.releaseLockLocked(); err != nil {
		result.Message += " No se pudo liberar el bloqueo: " + err.Error()
	}
	return result, nil
}

// CheckExternal compara el archivo maestro con la versión abierta.
func (e *Engine) CheckExternal() (*ExternalState, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	state := &ExternalState{Path: e.path, BaseSHA256: e.hash}
	if e.path == "" {
		return state, nil
	}
	_, hash, err := ReadFileHash(e.path)
	if err != nil {
		if os.IsNotExist(err) {
			state.Missing = true
			state.Changed = true
			return state, nil
		}
		return nil, err
	}
	state.CurrentSHA256 = hash
	state.Changed = hash != e.hash
	return state, nil
}

// Restore reemplaza el maestro por una versión del historial.
func (e *Engine) Restore(id string) (*LoadResult, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.path == "" {
		return nil, errors.New("no hay diccionario abierto")
	}
	entry, err := e.findHistoryLocked(id)
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(filepath.Join(e.HistoryDir(), entry.YAMLName))
	if err != nil {
		return nil, err
	}
	candidate, err := DecodeDocument(data)
	if err != nil {
		return nil, fmt.Errorf("la versión elegida no se puede interpretar: %w", err)
	}
	if findings := Validate(candidate); HasErrors(findings) {
		return nil, errors.New("la versión elegida tiene errores de estructura y no se restauró")
	}
	if e.lock == nil {
		if err := e.acquireLockLocked(); err != nil {
			return nil, err
		}
	}
	currentData, _, err := ReadFileHash(e.path)
	if err != nil {
		return nil, err
	}
	safety, err := e.writeHistoryYAMLLocked(currentData, time.Now())
	if err != nil {
		return nil, err
	}
	if err := e.writeHistoryMarkdownLocked(safety, []string{
		fmt.Sprintf("- Se restauró la versión `%s` del historial.", entry.ID),
	}); err != nil {
		return nil, err
	}
	if err := writeVerifiedMaster(e.path, data); err != nil {
		return nil, err
	}
	e.document = candidate
	e.hash = HashBytes(data)
	e.backup = nil
	if err := e.releaseLockLocked(); err != nil {
		return nil, err
	}
	return e.loadResultLocked(), nil
}

func (e *Engine) loadResultLocked() *LoadResult {
	findings := Validate(e.document)
	SortFindings(findings)
	return &LoadResult{
		Path:           e.path,
		SHA256:         e.hash,
		Document:       e.document,
		Findings:       findings,
		Lock:           e.lockStateLocked(),
		MigratedFromV1: e.document != nil && e.document.MigratedFromV1,
	}
}

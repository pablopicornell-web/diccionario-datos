package main

import (
	"context"
	"sync"

	"diccionario/internal/core"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App es la capa de enlace entre el frontend y el motor del editor. No contiene
// lógica de negocio: sólo traduce llamadas de la interfaz a operaciones del
// paquete core.
type App struct {
	ctx      context.Context
	engine   *core.Engine
	window   core.WindowState
	windowMu sync.Mutex
}

// NewApp crea la aplicación recordando la última geometría de la ventana.
func NewApp(window core.WindowState) *App {
	return &App{engine: core.NewEngine(), window: window}
}

// MasterFileName devuelve el nombre esperado del archivo fuente de verdad.
func (a *App) MasterFileName() string {
	return core.MasterFileName
}

// ChooseDictionaryFile abre el selector de archivos y devuelve la ruta elegida.
func (a *App) ChooseDictionaryFile() (string, error) {
	return wruntime.OpenFileDialog(a.ctx, wruntime.OpenDialogOptions{
		Title: "Seleccionar DiccionarioDatos.yaml",
		Filters: []wruntime.FileFilter{
			{DisplayName: "Diccionario de datos (*.yaml)", Pattern: "*.yaml"},
			{DisplayName: "Todos los archivos", Pattern: "*.*"},
		},
	})
}

// OpenDictionary lee y valida un diccionario desde disco.
func (a *App) OpenDictionary(path string) (*core.LoadResult, error) {
	return a.engine.Load(path)
}

// ReloadDictionary vuelve a leer el archivo abierto.
func (a *App) ReloadDictionary() (*core.LoadResult, error) {
	return a.engine.Reload()
}

// CurrentPath devuelve la ruta del diccionario abierto.
func (a *App) CurrentPath() string {
	return a.engine.Path()
}

// ValidateDictionary valida el documento tal como está en pantalla.
func (a *App) ValidateDictionary(document *core.Document) []core.Finding {
	return a.engine.ValidateDocument(document)
}

// BeginEdit abre la sesión de edición y adquiere el bloqueo.
func (a *App) BeginEdit() (*core.LockState, error) {
	return a.engine.BeginEdit()
}

// CancelEdit descarta la sesión de edición.
func (a *App) CancelEdit() error {
	return a.engine.CancelEdit()
}

// LockState informa el bloqueo actual.
func (a *App) LockState() (*core.LockState, error) {
	return a.engine.LockState()
}

// ClearLock libera manualmente un bloqueo huérfano o ajeno.
func (a *App) ClearLock() error {
	return a.engine.ClearLock()
}

// CheckExternal informa si el archivo cambió fuera del editor.
func (a *App) CheckExternal() (*core.ExternalState, error) {
	return a.engine.CheckExternal()
}

// SaveDictionary valida, respalda y guarda el diccionario.
func (a *App) SaveDictionary(document *core.Document) (*core.SaveResult, error) {
	return a.engine.Save(document)
}

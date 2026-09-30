package main

import "diccionario/internal/core"

// History lista las versiones guardadas del diccionario abierto.
func (a *App) History() ([]core.HistoryEntry, error) {
	return a.engine.History()
}

// HistoryContent devuelve el YAML de una versión del historial.
func (a *App) HistoryContent(id string) (string, error) {
	return a.engine.HistoryContent(id)
}

// HistorySummary devuelve el resumen en Markdown de una versión del historial.
func (a *App) HistorySummary(id string) (string, error) {
	return a.engine.HistorySummary(id)
}

// RestoreVersion reemplaza el maestro por una versión del historial.
func (a *App) RestoreVersion(id string) (*core.LoadResult, error) {
	return a.engine.Restore(id)
}

// GetPreferences devuelve las preferencias locales del editor.
func (a *App) GetPreferences() core.Preferences {
	return core.LoadPreferences()
}

// SetTheme persiste el tema visual elegido.
func (a *App) SetTheme(theme string) error {
	preferences := core.LoadPreferences()
	preferences.Theme = theme
	return core.SavePreferences(preferences)
}

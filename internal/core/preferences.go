package core

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

// Temas admitidos por el editor.
const (
	ThemeLight = "light"
	ThemeDark  = "dark"
)

// Preferences son las preferencias locales del editor. El tema visual pertenece
// al editor y no al diccionario, por eso se guarda fuera del YAML.
type Preferences struct {
	Theme  string      `json:"theme"`
	Window WindowState `json:"window"`
}

// WindowState recuerda la geometría de la ventana entre sesiones.
type WindowState struct {
	Width       int  `json:"width"`
	Height      int  `json:"height"`
	X           int  `json:"x"`
	Y           int  `json:"y"`
	HasPosition bool `json:"hasPosition"`
	Maximised   bool `json:"maximised"`
}

// maxWindowCoordinate descarta posiciones absurdas (por ejemplo, de un monitor
// que ya no existe) en lugar de restaurarlas a ciegas.
const maxWindowCoordinate = 20000

// DefaultPreferences devuelve las preferencias iniciales.
func DefaultPreferences() Preferences {
	return Preferences{Theme: ThemeLight}
}

// LoadPreferences lee las preferencias locales del editor.
func LoadPreferences() Preferences {
	preferences := DefaultPreferences()
	dir, err := configDir()
	if err != nil {
		return preferences
	}
	data, err := os.ReadFile(filepath.Join(dir, "config.json"))
	if err != nil {
		return preferences
	}
	if err := json.Unmarshal(data, &preferences); err != nil {
		return DefaultPreferences()
	}
	if !validTheme(preferences.Theme) {
		return DefaultPreferences()
	}
	preferences.Window = sanitizeWindowState(preferences.Window)
	return preferences
}

// SavePreferences guarda las preferencias locales del editor.
func SavePreferences(preferences Preferences) error {
	if !validTheme(preferences.Theme) {
		return errors.New("el tema debe ser light o dark")
	}
	preferences.Window = sanitizeWindowState(preferences.Window)
	dir, err := configDir()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(preferences, "", "  ")
	if err != nil {
		return err
	}
	return writeFileAtomic(filepath.Join(dir, "config.json"), data)
}

func validTheme(theme string) bool {
	return theme == ThemeLight || theme == ThemeDark
}

func sanitizeWindowState(state WindowState) WindowState {
	if state.Width < 0 || state.Height < 0 {
		state.Width = 0
		state.Height = 0
	}
	if abs(state.X) > maxWindowCoordinate || abs(state.Y) > maxWindowCoordinate {
		state.HasPosition = false
	}
	if state.Width == 0 || state.Height == 0 {
		state.HasPosition = false
	}
	return state
}

func abs(value int) int {
	if value < 0 {
		return -value
	}
	return value
}

func configDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(base, "diccionario")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

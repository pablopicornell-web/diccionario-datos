package core

import (
	"testing"
)

// useTempConfigDir redirige las preferencias a una carpeta temporal para no
// tocar la configuración real del usuario.
func useTempConfigDir(t *testing.T) {
	t.Helper()
	dir := t.TempDir()
	t.Setenv("AppData", dir)
	t.Setenv("XDG_CONFIG_HOME", dir)
	t.Setenv("HOME", dir)
}

func TestPreferencesRememberWindowGeometry(t *testing.T) {
	useTempConfigDir(t)
	expected := WindowState{Width: 1200, Height: 700, X: 120, Y: 80, HasPosition: true, Maximised: false}
	preferences := DefaultPreferences()
	preferences.Window = expected

	if err := SavePreferences(preferences); err != nil {
		t.Fatalf("no se pudieron guardar las preferencias: %v", err)
	}
	loaded := LoadPreferences()
	if loaded.Window != expected {
		t.Fatalf("la geometría no se conservó: %+v", loaded.Window)
	}
}

func TestPreferencesRememberMaximisedWindow(t *testing.T) {
	useTempConfigDir(t)
	preferences := DefaultPreferences()
	preferences.Window = WindowState{Width: 1024, Height: 640, X: 0, Y: 0, Maximised: true}

	if err := SavePreferences(preferences); err != nil {
		t.Fatalf("no se pudieron guardar las preferencias: %v", err)
	}
	if loaded := LoadPreferences(); !loaded.Window.Maximised {
		t.Fatal("el estado maximizado no se conservó")
	}
}

func TestThemeChangeKeepsWindowGeometry(t *testing.T) {
	useTempConfigDir(t)
	window := WindowState{Width: 1000, Height: 650, X: 40, Y: 30, HasPosition: true}
	initial := DefaultPreferences()
	initial.Window = window
	if err := SavePreferences(initial); err != nil {
		t.Fatalf("no se pudieron guardar las preferencias: %v", err)
	}

	// Es el mismo camino que usa el enlace SetTheme del editor.
	updated := LoadPreferences()
	updated.Theme = ThemeDark
	if err := SavePreferences(updated); err != nil {
		t.Fatalf("no se pudo guardar el tema: %v", err)
	}

	final := LoadPreferences()
	if final.Theme != ThemeDark {
		t.Fatalf("el tema no se guardó: %s", final.Theme)
	}
	if final.Window != window {
		t.Fatalf("cambiar el tema no debe perder la geometría: %+v", final.Window)
	}
}

func TestWindowGeometryOutOfRangeIsIgnored(t *testing.T) {
	useTempConfigDir(t)
	outOfRange := DefaultPreferences()
	outOfRange.Window = WindowState{Width: 900, Height: 600, X: 90000, Y: 5, HasPosition: true}
	if err := SavePreferences(outOfRange); err != nil {
		t.Fatalf("no se pudieron guardar las preferencias: %v", err)
	}
	loaded := LoadPreferences()
	if loaded.Window.HasPosition {
		t.Fatalf("una posición fuera de rango no debe restaurarse: %+v", loaded.Window)
	}
	if loaded.Window.Width != 900 || loaded.Window.Height != 600 {
		t.Fatalf("el tamaño debe conservarse: %+v", loaded.Window)
	}
}

func TestInvalidThemeIsRejected(t *testing.T) {
	useTempConfigDir(t)
	if err := SavePreferences(Preferences{Theme: "azul"}); err == nil {
		t.Fatal("un tema inválido debe rechazarse")
	}
}

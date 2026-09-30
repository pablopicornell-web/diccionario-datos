package main

import (
	"context"
	"time"

	"diccionario/internal/core"

	"github.com/wailsapp/wails/v2/pkg/options"
	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	defaultWindowWidth   = 1360
	defaultWindowHeight  = 860
	minWindowWidth       = 1024
	minWindowHeight      = 640
	geometryPollInterval = time.Second
)

// startup guarda el contexto, coloca la ventana donde estaba y arranca el
// seguimiento de su geometría.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.restoreWindowPosition(ctx)
	go a.watchWindowGeometry(ctx)
}

// domReady muestra la ventana. Se crea oculta para poder colocar posición y
// tamaño antes de que se vea, evitando el salto al abrir.
func (a *App) domReady(ctx context.Context) {
	wruntime.WindowShow(ctx)
}

// onBeforeClose guarda la geometría mientras la ventana todavía existe.
func (a *App) onBeforeClose(ctx context.Context) bool {
	a.saveWindowState(ctx)
	return false
}

// shutdown libera el bloqueo si la aplicación se cierra durante una edición.
func (a *App) shutdown(ctx context.Context) {
	a.engine.Close()
}

// windowSize devuelve el tamaño con el que debe abrir la ventana.
func windowSize(window core.WindowState) (int, int) {
	width, height := defaultWindowWidth, defaultWindowHeight
	if window.Width >= minWindowWidth {
		width = window.Width
	}
	if window.Height >= minWindowHeight {
		height = window.Height
	}
	return width, height
}

// windowStartState devuelve el estado inicial: maximizada si así se cerró.
func windowStartState(window core.WindowState) options.WindowStartState {
	if window.Maximised {
		return options.Maximised
	}
	return options.Normal
}

func (a *App) restoreWindowPosition(ctx context.Context) {
	a.windowMu.Lock()
	state := a.window
	a.windowMu.Unlock()
	if state.Maximised || !state.HasPosition {
		return
	}
	wruntime.WindowSetPosition(ctx, state.X, state.Y)
}

// watchWindowGeometry recuerda el tamaño y la posición mientras la ventana está
// en estado normal, para poder restaurarlos aunque el cierre sea maximizado.
func (a *App) watchWindowGeometry(ctx context.Context) {
	ticker := time.NewTicker(geometryPollInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if wruntime.WindowIsMaximised(ctx) || wruntime.WindowIsMinimised(ctx) {
				continue
			}
			a.rememberNormalGeometry(ctx)
		}
	}
}

func (a *App) rememberNormalGeometry(ctx context.Context) {
	width, height := wruntime.WindowGetSize(ctx)
	if width <= 0 || height <= 0 {
		return
	}
	x, y := wruntime.WindowGetPosition(ctx)
	a.windowMu.Lock()
	defer a.windowMu.Unlock()
	a.window.Width = width
	a.window.Height = height
	a.window.X = x
	a.window.Y = y
	a.window.HasPosition = true
}

func (a *App) saveWindowState(ctx context.Context) {
	maximised := wruntime.WindowIsMaximised(ctx)
	if !maximised {
		a.rememberNormalGeometry(ctx)
	}

	a.windowMu.Lock()
	a.window.Maximised = maximised
	state := a.window
	a.windowMu.Unlock()

	if state.Width <= 0 || state.Height <= 0 {
		return
	}
	preferences := core.LoadPreferences()
	preferences.Window = state
	if err := core.SavePreferences(preferences); err != nil {
		println("No se pudo guardar la geometría de la ventana:", err.Error())
	}
}

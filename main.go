package main

import (
	"embed"

	"diccionario/internal/core"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// La geometría guardada se aplica antes de crear la ventana, para que no
	// aparezca en otra posición ni con otro tamaño.
	preferences := core.LoadPreferences()
	app := NewApp(preferences.Window)
	width, height := windowSize(preferences.Window)

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "Editor de DiccionarioDatos.yaml",
		Width:            width,
		Height:           height,
		MinWidth:         minWindowWidth,
		MinHeight:        minWindowHeight,
		WindowStartState: windowStartState(preferences.Window),
		StartHidden:      true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 32, G: 34, B: 38, A: 1},
		OnStartup:        app.startup,
		OnDomReady:       app.domReady,
		OnBeforeClose:    app.onBeforeClose,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

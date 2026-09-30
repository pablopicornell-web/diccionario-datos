package core

import (
	"errors"
	"fmt"
	"os"
	"time"

	"go.yaml.in/yaml/v4"
)

// Nombres de los archivos asociados al diccionario.
const (
	LockFileName   = "DiccionarioDatos.lock"
	HistoryDirName = "historial"
	lockOwner      = "editor"
)

// Lock es el contenido del bloqueo cooperativo.
type Lock struct {
	Owner      string `yaml:"owner" json:"owner"`
	Machine    string `yaml:"machine" json:"machine"`
	CreatedAt  string `yaml:"created_at" json:"created_at"`
	BaseSHA256 string `yaml:"base_sha256" json:"base_sha256"`
}

// LockState describe el bloqueo que el editor encuentra en el proyecto.
type LockState struct {
	Path   string `json:"path"`
	Exists bool   `json:"exists"`
	Held   bool   `json:"held"`
	Orphan bool   `json:"orphan"`
	Lock   *Lock  `json:"lock"`
}

// LockState informa el bloqueo actual del diccionario abierto.
func (e *Engine) LockState() (*LockState, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.path == "" {
		return nil, errors.New("no hay diccionario abierto")
	}
	return e.lockStateLocked(), nil
}

// ClearLock libera manualmente un bloqueo ajeno u huérfano.
func (e *Engine) ClearLock() error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.path == "" {
		return errors.New("no hay diccionario abierto")
	}
	if e.lock != nil {
		return e.releaseLockLocked()
	}
	if err := os.Remove(e.LockPath()); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (e *Engine) acquireLockLocked() error {
	lockPath := e.LockPath()
	if lockPath == "" {
		return errors.New("no hay diccionario abierto")
	}
	if existing, err := readLock(lockPath); err == nil && existing != nil {
		return fmt.Errorf("el diccionario está bloqueado por %s (%s) desde %s: si es un bloqueo huérfano, liberalo manualmente",
			existing.Owner, existing.Machine, existing.CreatedAt)
	}
	lock := &Lock{
		Owner:      lockOwner,
		Machine:    e.host,
		CreatedAt:  time.Now().Format(time.RFC3339),
		BaseSHA256: e.hash,
	}
	raw, err := yaml.Marshal(lock)
	if err != nil {
		return err
	}
	if err := os.WriteFile(lockPath, raw, 0o644); err != nil {
		return fmt.Errorf("no se pudo crear el bloqueo: %w", err)
	}
	e.lock = lock
	return nil
}

func (e *Engine) releaseLockLocked() error {
	if e.lock == nil {
		return nil
	}
	lockPath := e.LockPath()
	e.lock = nil
	if lockPath == "" {
		return nil
	}
	if err := os.Remove(lockPath); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func (e *Engine) lockStateLocked() *LockState {
	state := &LockState{Path: e.LockPath(), Held: e.lock != nil}
	existing, err := readLock(state.Path)
	if err == nil && existing != nil {
		state.Exists = true
		state.Lock = existing
		state.Orphan = !state.Held
	}
	return state
}

func readLock(path string) (*Lock, error) {
	if path == "" {
		return nil, nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var lock Lock
	if err := yaml.Unmarshal(data, &lock); err != nil {
		lock = Lock{Owner: "desconocido", Machine: "desconocida", CreatedAt: "desconocida"}
	}
	return &lock, nil
}

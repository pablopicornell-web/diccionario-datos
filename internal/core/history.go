package core

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

// historyOrigin identifica al editor como origen de una versión guardada.
const historyOrigin = "editor"

var historyNamePattern = regexp.MustCompile(`^(\d{6})_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})_([a-z]+)$`)

// HistoryEntry es una versión guardada del diccionario.
type HistoryEntry struct {
	ID           string `json:"id"`
	Number       int    `json:"number"`
	Origin       string `json:"origin"`
	YAMLName     string `json:"yamlName"`
	MarkdownName string `json:"markdownName"`
	HasMarkdown  bool   `json:"hasMarkdown"`
}

// History lista las versiones guardadas, de la más reciente a la más antigua.
func (e *Engine) History() ([]HistoryEntry, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.listHistoryLocked()
}

// HistoryContent devuelve el YAML de una versión del historial.
func (e *Engine) HistoryContent(id string) (string, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	entry, err := e.findHistoryLocked(id)
	if err != nil {
		return "", err
	}
	data, err := os.ReadFile(filepath.Join(e.HistoryDir(), entry.YAMLName))
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// HistorySummary devuelve el Markdown de una versión del historial.
func (e *Engine) HistorySummary(id string) (string, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	entry, err := e.findHistoryLocked(id)
	if err != nil {
		return "", err
	}
	if !entry.HasMarkdown {
		return "", nil
	}
	data, err := os.ReadFile(filepath.Join(e.HistoryDir(), entry.MarkdownName))
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func (e *Engine) listHistoryLocked() ([]HistoryEntry, error) {
	dir := e.HistoryDir()
	if dir == "" {
		return []HistoryEntry{}, nil
	}
	items, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return []HistoryEntry{}, nil
		}
		return nil, err
	}
	entries := []HistoryEntry{}
	for _, item := range items {
		if item.IsDir() {
			continue
		}
		name := item.Name()
		extension := filepath.Ext(name)
		if extension != ".yaml" && extension != ".md" {
			continue
		}
		base := strings.TrimSuffix(name, extension)
		match := historyNamePattern.FindStringSubmatch(base)
		if match == nil {
			continue
		}
		number, _ := strconv.Atoi(match[1])
		index := indexOfHistory(entries, base)
		if index < 0 {
			entries = append(entries, HistoryEntry{
				ID:           base,
				Number:       number,
				Origin:       match[4],
				YAMLName:     base + ".yaml",
				MarkdownName: base + ".md",
			})
			index = len(entries) - 1
		}
		if extension == ".yaml" {
			entries[index].YAMLName = name
		} else {
			entries[index].HasMarkdown = true
			entries[index].MarkdownName = name
		}
	}
	sort.SliceStable(entries, func(i, j int) bool { return entries[i].Number > entries[j].Number })
	return entries, nil
}

func indexOfHistory(entries []HistoryEntry, id string) int {
	for i, entry := range entries {
		if entry.ID == id {
			return i
		}
	}
	return -1
}

func (e *Engine) findHistoryLocked(id string) (*HistoryEntry, error) {
	entries, err := e.listHistoryLocked()
	if err != nil {
		return nil, err
	}
	for i := range entries {
		if entries[i].ID == id {
			return &entries[i], nil
		}
	}
	return nil, fmt.Errorf("no existe la versión `%s`", id)
}

func (e *Engine) nextHistoryNumberLocked() (int, error) {
	entries, err := e.listHistoryLocked()
	if err != nil {
		return 0, err
	}
	highest := 0
	for _, entry := range entries {
		if entry.Number > highest {
			highest = entry.Number
		}
	}
	return highest + 1, nil
}

// writeHistoryYAMLLocked guarda la copia del estado anterior del maestro.
func (e *Engine) writeHistoryYAMLLocked(content []byte, now time.Time) (*HistoryEntry, error) {
	dir := e.HistoryDir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	number, err := e.nextHistoryNumberLocked()
	if err != nil {
		return nil, err
	}
	base := fmt.Sprintf("%06d_%s_%s_%s", number, now.Format("2006-01-02"), now.Format("15-04"), historyOrigin)
	yamlName := base + ".yaml"
	if err := writeFileAtomic(filepath.Join(dir, yamlName), content); err != nil {
		return nil, err
	}
	return &HistoryEntry{
		ID:           base,
		Number:       number,
		Origin:       historyOrigin,
		YAMLName:     yamlName,
		MarkdownName: base + ".md",
	}, nil
}

// writeHistoryMarkdownLocked guarda el resumen semántico de la sesión.
func (e *Engine) writeHistoryMarkdownLocked(entry *HistoryEntry, lines []string) error {
	if entry == nil {
		return nil
	}
	var builder strings.Builder
	builder.WriteString("# Cambios registrados por el editor\n\n")
	builder.WriteString(fmt.Sprintf("- Archivo: `%s`\n", filepath.Base(e.path)))
	builder.WriteString(fmt.Sprintf("- Fecha: %s\n", time.Now().Format(time.RFC3339)))
	builder.WriteString("- Origen: editor\n\n")
	builder.WriteString("## Resumen\n\n")
	for _, line := range lines {
		builder.WriteString(line)
		builder.WriteString("\n")
	}
	return writeFileAtomic(filepath.Join(e.HistoryDir(), entry.MarkdownName), []byte(builder.String()))
}

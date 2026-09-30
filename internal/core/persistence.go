package core

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"os"

	"go.yaml.in/yaml/v4"
)

// MasterFileName es el nombre esperado del archivo fuente de verdad.
const MasterFileName = "DiccionarioDatos.yaml"

// tempSuffix identifica los archivos temporales de escritura segura.
const tempSuffix = ".tmp-escritura"

// DecodeDocument interpreta el YAML de un diccionario y rechaza propiedades
// que no estén definidas en el formato.
func DecodeDocument(data []byte) (*Document, error) {
	if len(bytes.TrimSpace(data)) == 0 {
		return nil, errors.New("el archivo está vacío")
	}
	decoder := yaml.NewDecoder(bytes.NewReader(data))
	decoder.KnownFields(true)
	var doc Document
	if err := decoder.Decode(&doc); err != nil {
		return nil, fmt.Errorf("no se pudo interpretar el YAML: %w", err)
	}
	if doc.FormatVersion == 0 && doc.Project.Name == "" && len(doc.Tables) == 0 {
		return nil, errors.New("el archivo no contiene un diccionario de datos")
	}
	switch doc.FormatVersion {
	case FormatVersion:
		if err := rejectLegacyDisplayField(&doc); err != nil {
			return nil, err
		}
		doc.Normalize()
	case LegacyFormatVersion:
		migrateFromV1(&doc)
	default:
		return nil, fmt.Errorf(
			"format_version %d no es compatible: esta versión del editor trabaja con format_version %d",
			doc.FormatVersion, FormatVersion)
	}
	return &doc, nil
}

// rejectLegacyDisplayField evita que un archivo v2 conserve la propiedad vieja.
func rejectLegacyDisplayField(doc *Document) error {
	for _, table := range doc.Tables {
		if table != nil && table.LegacyDisplayField != "" {
			return fmt.Errorf(
				"la tabla `%s` usa `display_field`, que ya no existe en format_version %d: usá `display_fields`",
				table.Name, FormatVersion)
		}
	}
	return nil
}

// migrateFromV1 convierte en memoria el contrato anterior al vigente:
// `display_field: nombre` pasa a `display_fields: [nombre]`.
func migrateFromV1(doc *Document) {
	for _, table := range doc.Tables {
		if table == nil {
			continue
		}
		if len(table.DisplayFields) == 0 && table.LegacyDisplayField != "" {
			table.DisplayFields = []string{table.LegacyDisplayField}
		}
		table.LegacyDisplayField = ""
		table.NormalizeDisplayFields()
	}
	doc.FormatVersion = FormatVersion
	doc.MigratedFromV1 = true
}

// EncodeDocument serializa el diccionario en su orden canónico y con sangría
// de dos espacios, para que el archivo siga siendo legible.
func EncodeDocument(doc *Document) ([]byte, error) {
	var buffer bytes.Buffer
	encoder := yaml.NewEncoder(&buffer)
	encoder.SetIndent(2)
	if err := encoder.Encode(doc); err != nil {
		return nil, fmt.Errorf("no se pudo generar el YAML: %w", err)
	}
	if err := encoder.Close(); err != nil {
		return nil, fmt.Errorf("no se pudo cerrar el YAML generado: %w", err)
	}
	return buffer.Bytes(), nil
}

// ReadFileHash devuelve el contenido del archivo y su SHA-256 en hexadecimal.
func ReadFileHash(path string) ([]byte, string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, "", err
	}
	return data, HashBytes(data), nil
}

// HashBytes calcula el SHA-256 en hexadecimal de un contenido.
func HashBytes(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

// LoadDocument lee y valida un diccionario desde disco.
func LoadDocument(path string) (*Document, string, error) {
	data, hash, err := ReadFileHash(path)
	if err != nil {
		return nil, "", fmt.Errorf("no se pudo leer %s: %w", path, err)
	}
	doc, err := DecodeDocument(data)
	if err != nil {
		return nil, hash, err
	}
	return doc, hash, nil
}

// writeVerifiedMaster escribe el maestro a través de un temporal que se vuelve
// a leer y validar antes de reemplazar el archivo original.
func writeVerifiedMaster(path string, content []byte) error {
	tempPath := path + tempSuffix
	if err := os.WriteFile(tempPath, content, 0o644); err != nil {
		return fmt.Errorf("no se pudo escribir el archivo temporal: %w", err)
	}
	tempData, err := os.ReadFile(tempPath)
	if err != nil {
		_ = os.Remove(tempPath)
		return fmt.Errorf("no se pudo releer el archivo temporal: %w", err)
	}
	verified, err := DecodeDocument(tempData)
	if err != nil {
		_ = os.Remove(tempPath)
		return fmt.Errorf("el archivo temporal no se pudo volver a leer: %w", err)
	}
	if findings := Validate(verified); HasErrors(findings) {
		_ = os.Remove(tempPath)
		return errors.New("el archivo generado no pasó la validación: no se guardó nada")
	}
	if err := os.Rename(tempPath, path); err != nil {
		_ = os.Remove(tempPath)
		return fmt.Errorf("no se pudo reemplazar el archivo maestro: %w", err)
	}
	return nil
}

// writeFileAtomic escribe un archivo auxiliar mediante un temporal.
func writeFileAtomic(path string, content []byte) error {
	tempPath := path + tempSuffix
	if err := os.WriteFile(tempPath, content, 0o644); err != nil {
		return err
	}
	if err := os.Rename(tempPath, path); err != nil {
		_ = os.Remove(tempPath)
		return err
	}
	return nil
}

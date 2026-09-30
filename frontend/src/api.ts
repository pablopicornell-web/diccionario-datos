import {
  BeginEdit,
  CancelEdit,
  CheckExternal,
  ChooseDictionaryFile,
  ClearLock,
  CurrentPath,
  GetPreferences,
  History,
  HistoryContent,
  HistorySummary,
  LockState,
  MasterFileName,
  OpenDictionary,
  ReloadDictionary,
  RestoreVersion,
  SaveDictionary,
  SetTheme,
  ValidateDictionary,
} from "../wailsjs/go/main/App";
import type { core } from "../wailsjs/go/models";
import type {
  Document,
  ExternalState,
  Finding,
  HistoryEntry,
  LoadResult,
  LockState as LockStateModel,
  SaveResult,
} from "./core/model.ts";

/**
 * Los bindings de Wails esperan las clases generadas, mientras que la interfaz
 * trabaja con objetos planos equivalentes. La conversión queda encapsulada acá.
 */
function toWails(document: Document): core.Document {
  return document as unknown as core.Document;
}

export function masterFileName(): Promise<string> {
  return MasterFileName();
}

export function chooseDictionaryFile(): Promise<string> {
  return ChooseDictionaryFile();
}

export async function openDictionary(path: string): Promise<LoadResult> {
  return OpenDictionary(path);
}

export async function reloadDictionary(): Promise<LoadResult> {
  return ReloadDictionary();
}

export function currentPath(): Promise<string> {
  return CurrentPath();
}

export async function saveDictionary(document: Document): Promise<SaveResult> {
  return SaveDictionary(toWails(document));
}

export async function validateDictionary(document: Document): Promise<Finding[]> {
  return ValidateDictionary(toWails(document));
}

export async function beginEdit(): Promise<LockStateModel> {
  return BeginEdit();
}

export async function cancelEdit(): Promise<void> {
  await CancelEdit();
}

export async function lockState(): Promise<LockStateModel> {
  return LockState();
}

export async function clearLock(): Promise<void> {
  await ClearLock();
}

export async function checkExternal(): Promise<ExternalState> {
  return CheckExternal();
}

export async function history(): Promise<HistoryEntry[]> {
  return History();
}

export async function historyContent(id: string): Promise<string> {
  return HistoryContent(id);
}

export async function historySummary(id: string): Promise<string> {
  return HistorySummary(id);
}

export async function restoreVersion(id: string): Promise<LoadResult> {
  return RestoreVersion(id);
}

export async function getPreferences(): Promise<{ theme: string }> {
  return GetPreferences();
}

export async function setTheme(theme: string): Promise<void> {
  await SetTheme(theme);
}

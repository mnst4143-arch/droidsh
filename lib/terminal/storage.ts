import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TerminalPreferences, TerminalState } from "./types";

const KEYS = {
  history: "droidsh.history.v1",
  preferences: "droidsh.preferences.v1",
  session: "droidsh.session.v1",
} as const;

export const DEFAULT_PREFERENCES: TerminalPreferences = {
  fontSize: 14,
  colorMode: "aurora",
  cursorStyle: "block",
  inputMode: "enter",
};

export async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.history);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function saveHistory(history: string[]) {
  await AsyncStorage.setItem(KEYS.history, JSON.stringify(history.slice(-120)));
}

export async function clearStoredHistory() {
  await AsyncStorage.removeItem(KEYS.history);
}

export async function loadPreferences(): Promise<TerminalPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.preferences);
    return { ...DEFAULT_PREFERENCES, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: TerminalPreferences) {
  await AsyncStorage.setItem(KEYS.preferences, JSON.stringify(preferences));
}

export async function loadSession(): Promise<Partial<TerminalState> | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.session);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveSession(state: TerminalState) {
  await AsyncStorage.setItem(
    KEYS.session,
    JSON.stringify({
      cwd: state.cwd,
      fileSystem: state.fileSystem,
      installedPackages: state.installedPackages,
      env: state.env,
    }),
  );
}

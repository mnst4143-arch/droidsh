import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createInitialState } from "@/lib/terminal/engine";
import { PACKAGE_CATALOG } from "@/lib/terminal/packages";
import { createVirtualExecutor } from "@/lib/terminal/runtime";
import {
  clearStoredHistory,
  DEFAULT_PREFERENCES,
  loadHistory,
  loadPreferences,
  loadSession,
  saveHistory,
  savePreferences,
  saveSession,
} from "@/lib/terminal/storage";
import type { TerminalLine, TerminalPreferences, TerminalState } from "@/lib/terminal/types";

const COLORS = {
  background: "#07111F",
  panel: "#0B1A2B",
  panelRaised: "#10253A",
  border: "#1D3A52",
  text: "#DCE9F2",
  muted: "#7892A6",
  cyan: "#72F6D0",
  blue: "#68B5FF",
  amber: "#FFC777",
  red: "#FF8B99",
  green: "#B4F7B1",
};

const QUICK_COMMANDS = ["help", "ls", "pwd", "pkg list", "clear"];

const INITIAL_LINES: TerminalLine[] = [
  { text: "DroidSH v0.1.0  •  console aurora", tone: "system" },
  { text: "Session online  •  virtual runtime ready", tone: "success" },
  { text: "Digite help para ver os comandos disponíveis.", tone: "info" },
  { text: "", tone: "info" },
];

function lineColor(tone: TerminalLine["tone"], colorMode: TerminalPreferences["colorMode"]) {
  if (colorMode === "mono") return COLORS.text;
  if (colorMode === "amber") {
    if (tone === "stderr") return "#FF9D67";
    if (tone === "info" || tone === "system") return COLORS.amber;
    if (tone === "success") return "#FFDFA3";
    return "#F3E6C4";
  }
  switch (tone) {
    case "system":
      return COLORS.cyan;
    case "success":
      return COLORS.green;
    case "stderr":
      return COLORS.red;
    case "info":
      return COLORS.blue;
    default:
      return COLORS.text;
  }
}

export default function TerminalScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [state, setState] = useState<TerminalState>(createInitialState);
  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_LINES);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [preferences, setPreferences] = useState<TerminalPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const executor = useMemo(() => createVirtualExecutor(), []);

  useEffect(() => {
    let active = true;
    Promise.all([loadHistory(), loadPreferences(), loadSession()]).then(([savedHistory, savedPreferences, savedSession]) => {
      if (!active) return;
      if (savedHistory.length) setHistory(savedHistory);
      setPreferences(savedPreferences);
      if (savedSession) {
        setState((current) => ({ ...current, ...savedSession }));
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSession(state).catch(() => undefined);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    savePreferences(preferences).catch(() => undefined);
  }, [hydrated, preferences]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => inputRef.current?.focus(), 220);
      return () => clearTimeout(timer);
    }, []),
  );

  const prompt = useMemo(() => `droid@android:${state.cwd}$`, [state.cwd]);
  const fontSize = preferences.fontSize;
  const inputHeight = Platform.OS === "web" ? 50 : 56;

  const appendCommandLine = (value: string) => {
    setLines((current) => [...current, { text: `${prompt} ${value}`, tone: "system", command: value }]);
  };

  const runCommand = (value = command) => {
    const trimmed = value.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    appendCommandLine(trimmed);
    const nextHistory = [...history.filter((item) => item !== trimmed), trimmed].slice(-120);
    const result = executor(trimmed, state, {
      history: nextHistory,
      user: "droid",
      platform: Platform.OS === "web" ? "web-preview" : "android",
    });
    setHistory(nextHistory);
    setHistoryIndex(-1);
    saveHistory(nextHistory).catch(() => undefined);
    setState(result.state);
    if (result.clear) {
      setLines([]);
    } else if (result.lines.length) {
      setLines((current) => [...current, ...result.lines]);
    }
    setCommand("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 30);
    inputRef.current?.focus();
  };

  const changeHistory = (direction: "up" | "down") => {
    if (!history.length) return;
    const nextIndex = direction === "up" ? Math.min(historyIndex + 1, history.length - 1) : Math.max(historyIndex - 1, -1);
    setHistoryIndex(nextIndex);
    setCommand(nextIndex === -1 ? "" : history[history.length - 1 - nextIndex]);
  };

  const clearHistory = () => {
    setHistory([]);
    setHistoryIndex(-1);
    clearStoredHistory().catch(() => undefined);
    setLines((current) => [...current, { text: "histórico limpo", tone: "info" }]);
    setShowSettings(false);
  };

  const installPackage = (name: string) => {
    runCommand(`pkg install ${name}`);
    setShowPackages(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoChevron}>&gt;_</Text>
            </View>
            <View>
              <Text style={styles.brandName}>DroidSH</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>SESSION ONLINE</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowPackages(true)} accessibilityLabel="Abrir pacotes">
              <Ionicons name="cube-outline" size={19} color={COLORS.cyan} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowSettings(true)} accessibilityLabel="Abrir preferências">
              <Ionicons name="options-outline" size={19} color={COLORS.cyan} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sessionBar}>
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionLabel}>SHELL</Text>
            <Text style={styles.sessionValue}>/system/bin/droidsh</Text>
          </View>
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionLabel}>PACKAGES</Text>
            <Text style={styles.sessionValue}>{state.installedPackages.length}</Text>
          </View>
          <View style={styles.sessionMeta}>
            <Text style={styles.sessionLabel}>HISTORY</Text>
            <Text style={styles.sessionValue}>{history.length}</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.terminal}
          contentContainerStyle={styles.terminalContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        >
          {lines.map((item, index) => (
            <TouchableOpacity
              key={`${index}-${item.text}`}
              activeOpacity={item.command ? 0.65 : 1}
              onPress={() => item.command && setCommand(item.command)}
              disabled={!item.command}
            >
              <Text style={[styles.outputLine, { color: lineColor(item.tone, preferences.colorMode), fontSize }]}>{item.text || " "}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 12 }} />
        </ScrollView>

        <View style={styles.quickRow}>
          <Text style={styles.quickLabel}>QUICK</Text>
          <FlatList
            data={QUICK_COMMANDS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.quickList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.quickChip} onPress={() => setCommand(item)}>
                <Text style={styles.quickText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={[styles.inputBar, { minHeight: inputHeight, paddingBottom: Math.max(insets.bottom, 8) }]}>
          <Text style={styles.prompt}>{prompt}</Text>
          <Text style={[styles.cursorGlyph, preferences.cursorStyle === "line" && styles.cursorGlyphLine]}>
            {preferences.cursorStyle === "block" ? "▌" : "│"}
          </Text>
          <TextInput
            ref={inputRef}
            value={command}
            onChangeText={setCommand}
            onSubmitEditing={preferences.inputMode === "enter" ? () => runCommand() : undefined}
            onKeyPress={(event) => {
              if (event.nativeEvent.key === "ArrowUp") changeHistory("up");
              if (event.nativeEvent.key === "ArrowDown") changeHistory("down");
            }}
            style={[styles.input, { fontSize }]}
            selectionColor={preferences.colorMode === "amber" ? COLORS.amber : COLORS.cyan}
            placeholder={preferences.inputMode === "enter" ? "digite um comando…" : "digite e toque ↑…"}
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType={preferences.inputMode === "enter" ? "send" : "default"}
            accessibilityLabel="Entrada de comando"
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => runCommand()} accessibilityLabel="Executar comando">
            <Ionicons name="arrow-up" size={20} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      </View>

      <PackagesModal
        visible={showPackages}
        installedPackages={state.installedPackages}
        onClose={() => setShowPackages(false)}
        onInstall={installPackage}
        onRun={() => {
          setShowPackages(false);
          runCommand("pkg list");
        }}
      />
      <SettingsModal
        visible={showSettings}
        preferences={preferences}
        onClose={() => setShowSettings(false)}
        onChange={setPreferences}
        onClearHistory={clearHistory}
      />
    </KeyboardAvoidingView>
  );
}

type PackagesModalProps = {
  visible: boolean;
  installedPackages: string[];
  onClose: () => void;
  onInstall: (name: string) => void;
  onRun: () => void;
};

function PackagesModal({ visible, installedPackages, onClose, onInstall, onRun }: PackagesModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>CATÁLOGO LOCAL</Text>
              <Text style={styles.sheetTitle}>Packages</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetDescription}>Instale ferramentas compatíveis com esta sessão virtual.</Text>
          <ScrollView style={styles.packageList} contentContainerStyle={{ gap: 8 }}>
            {PACKAGE_CATALOG.map((item) => {
              const installed = installedPackages.includes(item.name);
              return (
                <View key={item.name} style={styles.packageRow}>
                  <View style={styles.packageInfo}>
                    <View style={styles.packageNameRow}>
                      <Text style={styles.packageName}>{item.name}</Text>
                      <Text style={styles.packageVersion}>{item.version}</Text>
                    </View>
                    <Text style={styles.packageDescription}>{item.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.packageButton, installed && styles.packageButtonInstalled]}
                    onPress={() => !installed && onInstall(item.name)}
                    disabled={installed}
                  >
                    <Text style={[styles.packageButtonText, installed && styles.packageButtonTextInstalled]}>
                      {installed ? "OK" : "INSTALL"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.secondaryButton} onPress={onRun}>
            <Text style={styles.secondaryButtonText}>$ pkg list --installed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type SettingsModalProps = {
  visible: boolean;
  preferences: TerminalPreferences;
  onClose: () => void;
  onChange: (preferences: TerminalPreferences) => void;
  onClearHistory: () => void;
};

function SettingsModal({ visible, preferences, onClose, onChange, onClearHistory }: SettingsModalProps) {
  const update = (patch: Partial<TerminalPreferences>) => onChange({ ...preferences, ...patch });
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>TERMINAL CONFIG</Text>
              <Text style={styles.sheetTitle}>Preferências</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ gap: 20 }}>
            <PreferenceRow label="TAMANHO DO TEXTO" value={`${preferences.fontSize}px`}>
              <View style={styles.choiceRow}>
                {[12, 14, 16, 18].map((size) => (
                  <ChoiceButton key={size} label={`${size}`} active={preferences.fontSize === size} onPress={() => update({ fontSize: size })} />
                ))}
              </View>
            </PreferenceRow>
            <PreferenceRow label="COR DO CURSOR" value={preferences.colorMode.toUpperCase()}>
              <View style={styles.choiceRow}>
                <ChoiceButton label="AURORA" active={preferences.colorMode === "aurora"} onPress={() => update({ colorMode: "aurora" })} />
                <ChoiceButton label="ÂMBAR" active={preferences.colorMode === "amber"} onPress={() => update({ colorMode: "amber" })} />
                <ChoiceButton label="MONO" active={preferences.colorMode === "mono"} onPress={() => update({ colorMode: "mono" })} />
              </View>
            </PreferenceRow>
            <PreferenceRow label="ESTILO DO CURSOR" value={preferences.cursorStyle.toUpperCase()}>
              <View style={styles.choiceRow}>
                <ChoiceButton label="BLOCO" active={preferences.cursorStyle === "block"} onPress={() => update({ cursorStyle: "block" })} />
                <ChoiceButton label="LINHA" active={preferences.cursorStyle === "line"} onPress={() => update({ cursorStyle: "line" })} />
              </View>
            </PreferenceRow>
            <PreferenceRow label="ENVIAR COMANDO" value={preferences.inputMode === "enter" ? "ENTER" : "BOTÃO"}>
              <View style={styles.choiceRow}>
                <ChoiceButton label="ENTER" active={preferences.inputMode === "enter"} onPress={() => update({ inputMode: "enter" })} />
                <ChoiceButton label="BOTÃO ↑" active={preferences.inputMode === "button"} onPress={() => update({ inputMode: "button" })} />
              </View>
            </PreferenceRow>
            <TouchableOpacity style={styles.dangerButton} onPress={onClearHistory}>
              <Ionicons name="trash-outline" size={17} color={COLORS.red} />
              <Text style={styles.dangerText}>Limpar histórico persistente</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PreferenceRow({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceHeader}>
        <Text style={styles.preferenceLabel}>{label}</Text>
        <Text style={styles.preferenceValue}>{value}</Text>
      </View>
      {children}
    </View>
  );
}

function ChoiceButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.choiceButton, active && styles.choiceButtonActive]} onPress={onPress}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: COLORS.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  logoChevron: { color: COLORS.background, fontFamily: "monospace", fontWeight: "800", fontSize: 17, letterSpacing: -2 },
  brandName: { color: COLORS.text, fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  statusText: { color: COLORS.muted, fontSize: 9, letterSpacing: 1.2, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.panelRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionBar: { flexDirection: "row", gap: 20, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: COLORS.panel },
  sessionMeta: { gap: 3 },
  sessionLabel: { color: COLORS.muted, fontSize: 9, letterSpacing: 1.1, fontWeight: "700" },
  sessionValue: { color: COLORS.text, fontFamily: "monospace", fontSize: 11 },
  terminal: { flex: 1, paddingHorizontal: 18 },
  terminalContent: { paddingTop: 18, paddingBottom: 20 },
  outputLine: { fontFamily: "monospace", lineHeight: 21, minHeight: 21 },
  quickRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.panel },
  quickLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  quickList: { gap: 8, paddingRight: 12 },
  quickChip: { backgroundColor: COLORS.panelRaised, borderColor: COLORS.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  quickText: { color: COLORS.cyan, fontFamily: "monospace", fontSize: 11 },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingTop: 9, backgroundColor: COLORS.background },
  prompt: { color: COLORS.cyan, fontFamily: "monospace", fontSize: 12, maxWidth: 132 },
  cursorGlyph: { color: COLORS.cyan, fontFamily: "monospace", fontSize: 15, marginLeft: -3, marginRight: -2 },
  cursorGlyphLine: { color: COLORS.blue, fontSize: 17 },
  input: { flex: 1, color: COLORS.text, fontFamily: "monospace", paddingVertical: 7, minWidth: 0 },
  sendButton: { width: 38, height: 38, borderRadius: 11, backgroundColor: COLORS.cyan, alignItems: "center", justifyContent: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(2, 7, 13, 0.74)", justifyContent: "flex-end" },
  sheet: { maxHeight: "86%", backgroundColor: COLORS.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24, borderTopWidth: 1, borderColor: COLORS.border },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  sheetEyebrow: { color: COLORS.cyan, fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 5 },
  sheetTitle: { color: COLORS.text, fontSize: 25, fontWeight: "800" },
  closeButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.panelRaised, alignItems: "center", justifyContent: "center" },
  sheetDescription: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  packageList: { maxHeight: 410 },
  packageRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 13, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  packageInfo: { flex: 1, gap: 4 },
  packageNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  packageName: { color: COLORS.text, fontFamily: "monospace", fontSize: 14, fontWeight: "700" },
  packageVersion: { color: COLORS.cyan, fontFamily: "monospace", fontSize: 10 },
  packageDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  packageButton: { borderRadius: 8, backgroundColor: COLORS.cyan, paddingHorizontal: 9, paddingVertical: 7 },
  packageButtonInstalled: { backgroundColor: "#173D36" },
  packageButtonText: { color: COLORS.background, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  packageButtonTextInstalled: { color: COLORS.green },
  secondaryButton: { marginTop: 14, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.cyan },
  secondaryButtonText: { color: COLORS.cyan, fontFamily: "monospace", fontSize: 12 },
  preferenceRow: { gap: 10 },
  preferenceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  preferenceLabel: { color: COLORS.muted, fontSize: 10, letterSpacing: 1.1, fontWeight: "800" },
  preferenceValue: { color: COLORS.cyan, fontFamily: "monospace", fontSize: 11 },
  choiceRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  choiceButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  choiceButtonActive: { backgroundColor: "#173D36", borderColor: COLORS.cyan },
  choiceText: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  choiceTextActive: { color: COLORS.cyan },
  dangerButton: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 4, padding: 13, borderRadius: 11, borderWidth: 1, borderColor: "#5B2835" },
  dangerText: { color: COLORS.red, fontSize: 12, fontWeight: "700" },
});

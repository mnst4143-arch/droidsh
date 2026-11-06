export type LineTone = "system" | "stdout" | "stderr" | "success" | "info";

export type FileKind = "file" | "directory";

export type VirtualFile = {
  kind: FileKind;
  content?: string;
};

export type VirtualFileSystem = Record<string, VirtualFile>;

export type TerminalPreferences = {
  fontSize: number;
  colorMode: "aurora" | "amber" | "mono";
  cursorStyle: "block" | "line";
  inputMode: "enter" | "button";
};

export type TerminalState = {
  cwd: string;
  fileSystem: VirtualFileSystem;
  installedPackages: string[];
  env: Record<string, string>;
};

export type TerminalLine = {
  text: string;
  tone: LineTone;
  command?: string;
};

export type CommandContext = {
  history: string[];
  now?: Date;
  user?: string;
  platform?: string;
};

export type CommandResult = {
  lines: TerminalLine[];
  state: TerminalState;
  clear?: boolean;
};

export type TerminalExecutor = (input: string, state: TerminalState, context: CommandContext) => CommandResult;

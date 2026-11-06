import { findPackage, PACKAGE_CATALOG, packageLabel, searchPackages } from "./packages";
import type {
  CommandContext,
  CommandResult,
  TerminalLine,
  TerminalState,
  VirtualFileSystem,
} from "./types";

const ROOT = "/";

export function createDefaultFileSystem(): VirtualFileSystem {
  return {
    "/": { kind: "directory" },
    "/home": { kind: "directory" },
    "/home/droid": { kind: "directory" },
    "/home/droid/readme.txt": {
      kind: "file",
      content:
        "DroidSH\n\nEste é um shell virtual para experimentar comandos no Android.\nDigite help para explorar.",
    },
    "/tmp": { kind: "directory" },
    "/etc": { kind: "directory" },
    "/etc/motd": {
      kind: "file",
      content: "DroidSH console aurora — runtime virtual pronto.",
    },
    "/usr": { kind: "directory" },
    "/usr/bin": { kind: "directory" },
  };
}

export function createInitialState(): TerminalState {
  return {
    cwd: "/home/droid",
    fileSystem: createDefaultFileSystem(),
    installedPackages: ["bash", "coreutils"],
    env: {
      SHELL: "/system/bin/droidsh",
      TERM: "droidsh-256color",
      LANG: "pt_BR.UTF-8",
      HOME: "/home/droid",
      PATH: "/usr/bin:/bin",
    },
  };
}

export function resolvePath(input: string | undefined, cwd: string) {
  if (!input || input === "~") return "/home/droid";
  const rawParts = (input.startsWith("/") ? input : `${cwd}/${input}`).split("/");
  const parts: string[] = [];
  rawParts.forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  });
  return `/${parts.join("/")}` || ROOT;
}

function basename(path: string) {
  return path.split("/").filter(Boolean).pop() ?? "/";
}

function line(text: string, tone: TerminalLine["tone"] = "stdout"): TerminalLine {
  return { text, tone };
}

function error(text: string) {
  return line(text, "stderr");
}

function success(text: string) {
  return line(text, "success");
}

function parseCommand(input: string) {
  const tokens = input.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  return tokens.map((token) => (token.startsWith('"') ? token.slice(1, -1) : token));
}

function childPaths(fileSystem: VirtualFileSystem, directory: string) {
  const prefix = directory === "/" ? "/" : `${directory}/`;
  return Object.keys(fileSystem)
    .filter((path) => path !== directory && path.startsWith(prefix) && !path.slice(prefix.length).includes("/"))
    .sort((a, b) => a.localeCompare(b));
}

function removePath(fileSystem: VirtualFileSystem, target: string) {
  const next = { ...fileSystem };
  Object.keys(next).forEach((path) => {
    if (path === target || path.startsWith(`${target}/`)) delete next[path];
  });
  return next;
}

function formatPackageList(installedPackages: string[]) {
  return installedPackages.length
    ? installedPackages.map((name) => `ii  ${packageLabel(name)}`).join("\n")
    : "(nenhum pacote instalado)";
}

function packageCommand(args: string[], state: TerminalState): { lines: TerminalLine[]; state: TerminalState } {
  const [action, ...rest] = args;
  const nextState = { ...state, installedPackages: [...state.installedPackages] };

  if (!action || action === "help") {
    return {
      state: nextState,
      lines: [
        line("Uso: pkg <list|search|install|update|remove> [pacote]", "info"),
        line("O catálogo inicial é local e extensível para fontes futuras.", "info"),
      ],
    };
  }

  if (action === "list") {
    const installedOnly = rest.includes("--installed");
    const items = installedOnly
      ? PACKAGE_CATALOG.filter((item) => nextState.installedPackages.includes(item.name))
      : PACKAGE_CATALOG;
    return {
      state: nextState,
      lines: [
        line(installedOnly ? "Pacotes instalados:" : "Catálogo disponível:"),
        ...items.map((item) =>
          line(
            `${nextState.installedPackages.includes(item.name) ? "●" : "○"}  ${item.name.padEnd(10)} ${item.version}  ${item.description}`,
            nextState.installedPackages.includes(item.name) ? "success" : "stdout",
          ),
        ),
      ],
    };
  }

  if (action === "search") {
    const matches = searchPackages(rest.join(" "));
    return {
      state: nextState,
      lines: matches.length
        ? [
            line(`Resultados (${matches.length}):`, "info"),
            ...matches.map((item) => line(`${item.name}  ${item.version}  — ${item.description}`)),
          ]
        : [line("Nenhum pacote encontrado.", "stderr")],
    };
  }

  if (action === "update") {
    const installed = nextState.installedPackages;
    return {
      state: nextState,
      lines: installed.length
        ? [success(`Repositórios sincronizados. ${installed.length} pacote(s) atualizado(s).`)]
        : [line("Nenhum pacote instalado para atualizar.", "info")],
    };
  }

  if (action === "install") {
    const names = rest.filter((item) => !item.startsWith("-"));
    if (!names.length) return { state: nextState, lines: [error("pkg install: informe pelo menos um pacote.")] };
    const lines: TerminalLine[] = [];
    names.forEach((name) => {
      const item = findPackage(name);
      if (!item) {
        lines.push(error(`E: pacote não encontrado: ${name}`));
      } else if (nextState.installedPackages.includes(name)) {
        lines.push(line(`${name} já está instalado (${item.version}).`, "info"));
      } else {
        nextState.installedPackages.push(name);
        lines.push(success(`✓ ${item.name} ${item.version} instalado nesta sessão.`));
      }
    });
    return { state: nextState, lines };
  }

  if (action === "remove") {
    const names = rest.filter((item) => !item.startsWith("-"));
    if (!names.length) return { state: nextState, lines: [error("pkg remove: informe pelo menos um pacote.")] };
    const lines: TerminalLine[] = [];
    names.forEach((name) => {
      if (!nextState.installedPackages.includes(name)) {
        lines.push(error(`E: pacote não está instalado: ${name}`));
      } else if (name === "coreutils") {
        lines.push(error("E: coreutils é protegido pelo runtime do DroidSH."));
      } else {
        nextState.installedPackages = nextState.installedPackages.filter((item) => item !== name);
        lines.push(success(`✓ ${name} removido da sessão.`));
      }
    });
    return { state: nextState, lines };
  }

  return { state: nextState, lines: [error(`pkg: ação desconhecida: ${action}`)] };
}

export function executeCommand(input: string, state: TerminalState, context: CommandContext): CommandResult {
  const tokens = parseCommand(input.trim());
  const [command, ...args] = tokens;
  const baseState: TerminalState = {
    ...state,
    fileSystem: { ...state.fileSystem },
    installedPackages: [...state.installedPackages],
  };

  if (!command) return { lines: [], state: baseState };
  if (command === "clear") return { lines: [], state: baseState, clear: true };

  if (command === "help") {
    return {
      state: baseState,
      lines: [
        line("DroidSH commands", "info"),
        line("  help       mostra esta ajuda"),
        line("  ls         lista arquivos e diretórios"),
        line("  cd         muda o diretório atual"),
        line("  pwd        mostra o diretório atual"),
        line("  mkdir      cria um diretório"),
        line("  touch      cria um arquivo vazio"),
        line("  cat        lê um arquivo"),
        line("  rm         remove um arquivo ou diretório"),
        line("  echo       imprime texto; use > arquivo para salvar"),
        line("  history    mostra os comandos desta sessão"),
        line("  env        mostra variáveis do ambiente"),
        line("  pkg        gerencia o catálogo de pacotes"),
        line("  clear      limpa a saída do terminal"),
        line("", "info"),
        line("Dica: toque em uma linha do histórico para reutilizar o comando.", "info"),
      ],
    };
  }

  if (command === "pwd") return { state: baseState, lines: [line(baseState.cwd, "info")] };
  if (command === "whoami") return { state: baseState, lines: [line(context.user ?? "droid")] };
  if (command === "uname") return { state: baseState, lines: [line(args.includes("-a") ? "DroidSH Android virtual aarch64" : "DroidSH")] };
  if (command === "date") return { state: baseState, lines: [line((context.now ?? new Date()).toLocaleString("pt-BR"), "info")] };

  if (command === "env") {
    return {
      state: baseState,
      lines: Object.entries(baseState.env).map(([key, value]) => line(`${key}=${value}`)),
    };
  }

  if (command === "history") {
    return {
      state: baseState,
      lines: context.history.length
        ? context.history.map((item, index) => line(`${String(index + 1).padStart(3, " ")}  ${item}`))
        : [line("(histórico vazio)", "info")],
    };
  }

  if (command === "ls") {
    const target = resolvePath(args.find((arg) => !arg.startsWith("-")), baseState.cwd);
    const entry = baseState.fileSystem[target];
    if (!entry) return { state: baseState, lines: [error(`ls: não existe: ${target}`)] };
    if (entry.kind === "file") return { state: baseState, lines: [line(basename(target))] };
    return {
      state: baseState,
      lines: [line(childPaths(baseState.fileSystem, target).map((path) => basename(path)).join("  ") || "(vazio)")],
    };
  }

  if (command === "cd") {
    const target = resolvePath(args[0], baseState.cwd);
    const entry = baseState.fileSystem[target];
    if (!entry || entry.kind !== "directory") {
      return { state: baseState, lines: [error(`cd: diretório não encontrado: ${args[0] ?? ""}`)] };
    }
    return { state: { ...baseState, cwd: target }, lines: [] };
  }

  if (command === "mkdir") {
    const path = resolvePath(args.find((arg) => !arg.startsWith("-")), baseState.cwd);
    if (baseState.fileSystem[path]) return { state: baseState, lines: [error(`mkdir: já existe: ${path}`)] };
    const parent = path.slice(0, path.lastIndexOf("/")) || "/";
    if (!baseState.fileSystem[parent] || baseState.fileSystem[parent].kind !== "directory") {
      return { state: baseState, lines: [error(`mkdir: diretório pai não existe: ${parent}`)] };
    }
    baseState.fileSystem[path] = { kind: "directory" };
    return { state: baseState, lines: [success(`diretório criado: ${path}`)] };
  }

  if (command === "touch") {
    const path = resolvePath(args[0], baseState.cwd);
    if (baseState.fileSystem[path]) return { state: baseState, lines: [] };
    const parent = path.slice(0, path.lastIndexOf("/")) || "/";
    if (!baseState.fileSystem[parent] || baseState.fileSystem[parent].kind !== "directory") {
      return { state: baseState, lines: [error(`touch: diretório pai não existe: ${parent}`)] };
    }
    baseState.fileSystem[path] = { kind: "file", content: "" };
    return { state: baseState, lines: [success(`arquivo criado: ${path}`)] };
  }

  if (command === "cat") {
    const path = resolvePath(args[0], baseState.cwd);
    const entry = baseState.fileSystem[path];
    if (!entry) return { state: baseState, lines: [error(`cat: arquivo não encontrado: ${path}`)] };
    if (entry.kind === "directory") return { state: baseState, lines: [error(`cat: é um diretório: ${path}`)] };
    return { state: baseState, lines: [line(entry.content ?? "")] };
  }

  if (command === "rm") {
    const path = resolvePath(args.find((arg) => !arg.startsWith("-")), baseState.cwd);
    if (path === "/" || path === "/home/droid") return { state: baseState, lines: [error("rm: caminho protegido")] };
    if (!baseState.fileSystem[path]) return { state: baseState, lines: [error(`rm: não existe: ${path}`)] };
    baseState.fileSystem = removePath(baseState.fileSystem, path);
    return { state: baseState, lines: [success(`removido: ${path}`)] };
  }

  if (command === "echo") {
    const redirectIndex = args.findIndex((arg) => arg === ">" || arg === ">>");
    if (redirectIndex >= 0) {
      const operator = args[redirectIndex];
      const targetName = args[redirectIndex + 1];
      const path = resolvePath(targetName, baseState.cwd);
      if (!targetName) return { state: baseState, lines: [error("echo: arquivo de destino ausente")] };
      const parent = path.slice(0, path.lastIndexOf("/")) || "/";
      if (!baseState.fileSystem[parent] || baseState.fileSystem[parent].kind !== "directory") {
        return { state: baseState, lines: [error(`echo: diretório pai não existe: ${parent}`)] };
      }
      const content = args.slice(0, redirectIndex).join(" ");
      const previous = baseState.fileSystem[path]?.content ?? "";
      baseState.fileSystem[path] = {
        kind: "file",
        content: operator === ">>" && previous ? `${previous}\n${content}` : content,
      };
      return { state: baseState, lines: [success(`gravado em ${path}`)] };
    }
    return { state: baseState, lines: [line(args.join(" "))] };
  }

  if (command === "pkg") {
    const result = packageCommand(args, baseState);
    return { state: result.state, lines: result.lines };
  }

  return {
    state: baseState,
    lines: [error(`${command}: comando não encontrado. Digite help para ver opções.`)],
  };
}

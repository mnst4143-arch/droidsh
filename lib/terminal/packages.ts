export type PackageDefinition = {
  name: string;
  version: string;
  description: string;
  category: "core" | "network" | "developer" | "media";
};

export const PACKAGE_CATALOG: PackageDefinition[] = [
  {
    name: "bash",
    version: "5.2.37",
    description: "Bourne Again Shell compatível",
    category: "core",
  },
  {
    name: "coreutils",
    version: "9.7",
    description: "Utilitários essenciais de linha de comando",
    category: "core",
  },
  {
    name: "curl",
    version: "8.17.0",
    description: "Transferência de dados com URLs",
    category: "network",
  },
  {
    name: "git",
    version: "2.52.0",
    description: "Sistema distribuído de controle de versão",
    category: "developer",
  },
  {
    name: "nano",
    version: "8.6",
    description: "Editor de texto simples para terminal",
    category: "developer",
  },
  {
    name: "nodejs",
    version: "24.11.0",
    description: "Runtime JavaScript para scripts e ferramentas",
    category: "developer",
  },
  {
    name: "python",
    version: "3.14.0",
    description: "Linguagem Python e interpretador",
    category: "developer",
  },
  {
    name: "ripgrep",
    version: "14.1.1",
    description: "Busca rápida por texto em arquivos",
    category: "developer",
  },
  {
    name: "wget",
    version: "1.25.0",
    description: "Cliente de download via HTTP e HTTPS",
    category: "network",
  },
  {
    name: "ffmpeg",
    version: "8.0",
    description: "Ferramentas para áudio e vídeo",
    category: "media",
  },
];

export function findPackage(name: string) {
  return PACKAGE_CATALOG.find((item) => item.name === name);
}

export function searchPackages(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return PACKAGE_CATALOG;
  return PACKAGE_CATALOG.filter(
    (item) =>
      item.name.includes(normalized) ||
      item.description.toLowerCase().includes(normalized) ||
      item.category.includes(normalized),
  );
}

export function packageLabel(name: string) {
  const item = findPackage(name);
  return item ? `${item.name} ${item.version}` : name;
}

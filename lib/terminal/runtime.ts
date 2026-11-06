import { executeCommand } from "./engine";
import type { TerminalExecutor } from "./types";

/**
 * Adapter do runtime inicial. Um runtime Linux nativo pode substituir esta
 * fábrica sem que a tela do terminal precise conhecer detalhes de execução.
 */
export function createVirtualExecutor(): TerminalExecutor {
  return (input, state, context) => executeCommand(input, state, context);
}

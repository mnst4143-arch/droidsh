import { describe, expect, it } from "vitest";

import { createInitialState, executeCommand } from "../lib/terminal/engine";

describe("DroidSH virtual terminal", () => {
  it("navigates and creates files inside the virtual filesystem", () => {
    let state = createInitialState();
    let result = executeCommand("mkdir projects", state, { history: [] });
    state = result.state;
    expect(state.fileSystem["/home/droid/projects"]?.kind).toBe("directory");

    result = executeCommand("cd projects", state, { history: [] });
    state = result.state;
    expect(state.cwd).toBe("/home/droid/projects");

    result = executeCommand("echo hello > note.txt", state, { history: [] });
    expect(result.state.fileSystem["/home/droid/projects/note.txt"]?.content).toBe("hello");
  });

  it("installs and removes catalog packages", () => {
    let state = createInitialState();
    let result = executeCommand("pkg install git python", state, { history: [] });
    state = result.state;
    expect(state.installedPackages).toContain("git");
    expect(state.installedPackages).toContain("python");

    result = executeCommand("pkg remove git", state, { history: [] });
    expect(result.state.installedPackages).not.toContain("git");
  });

  it("returns clear state without losing session data", () => {
    const state = createInitialState();
    const result = executeCommand("clear", state, { history: [] });
    expect(result.clear).toBe(true);
    expect(result.state.cwd).toBe("/home/droid");
  });

  it("reports invalid commands without throwing", () => {
    const result = executeCommand("does-not-exist", createInitialState(), { history: [] });
    expect(result.lines[0]?.tone).toBe("stderr");
    expect(result.lines[0]?.text).toContain("comando não encontrado");
  });
});

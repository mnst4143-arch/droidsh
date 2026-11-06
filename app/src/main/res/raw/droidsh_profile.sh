#!/data/data/com.termux/files/usr/bin/bash

export DROIDSH_SESSION=1
DROIDSH_STATE="$PREFIX/var/lib/droidsh"
DROIDSH_READY="$DROIDSH_STATE/essentials-ready"
DROIDSH_RUNNING="$DROIDSH_STATE/essentials-running"
mkdir -p "$DROIDSH_STATE"

if [ -z "${DROIDSH_WELCOME_SHOWN:-}" ]; then
    export DROIDSH_WELCOME_SHOWN=1
    printf '\n\033[1;38;5;81m╭─ DROIDSH WORKSPACE\033[0m\n'
    printf '\033[38;5;117m│\033[0m native Android runtime  •  Linux userland  •  Aurora shell\n'
    if [ -f "$DROIDSH_READY" ]; then
        printf '\033[38;5;117m│\033[0m essentials: \033[1;38;5;121mready\033[0m  (node • python • git • nano • clang)\n'
    else
        printf '\033[38;5;117m│\033[0m essentials: \033[1;38;5;221mpreparing in background\033[0m\n'
        printf '\033[38;5;117m│\033[0m run \033[1;38;5;81mdroidsh-status\033[0m to inspect package setup\n'
    fi
    printf '\033[38;5;117m╰─\033[0m type \033[1;38;5;81mhelp\033[0m or \033[1;38;5;81mpkg search <name>\033[0m to explore\n\n'
fi

if [ ! -f "$DROIDSH_READY" ] && [ ! -f "$DROIDSH_RUNNING" ]; then
    touch "$DROIDSH_RUNNING"
    (
        packages="nodejs-lts python nano git curl wget openssh clang make cmake ffmpeg gh"
        for package in $packages; do
            pkg install -y "$package" >/dev/null 2>&1 || true
        done
        touch "$DROIDSH_READY"
        rm -f "$DROIDSH_RUNNING"
    ) >/dev/null 2>&1 &
fi

alias droidsh-status='if [ -f "$DROIDSH_READY" ]; then echo "DroidSH essentials: ready"; else echo "DroidSH essentials: installing in background"; fi'

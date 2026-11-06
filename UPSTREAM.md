# Upstream e licenças

O núcleo Android do DroidSH é derivado de [termux/termux-app](https://github.com/termux/termux-app), commit `8629e63`, sob GPLv3-only. O módulo `termux-shared` possui a licença indicada em seu próprio `LICENSE.md`. Os módulos `terminal-emulator` e `terminal-view` incluem as exceções Apache 2.0 descritas no `LICENSE.md` da aplicação.

O sistema de pacotes e os bootstraps são derivados do ecossistema [termux/termux-packages](https://github.com/termux/termux-packages). O DroidSH mantém os avisos de copyright e licenciamento dos projetos upstream e adiciona apenas o rebranding, a configuração de build, a identidade visual e a documentação desta distribuição.

O namespace `com.termux` está mantido temporariamente para que os bootstraps oficiais e os caminhos do `$PREFIX` funcionem sem recompilação. Antes de trocar para `com.droidsh`, o bootstrap e os pacotes devem ser recompilados para um repositório APT próprio, conforme a documentação oficial de forking do Termux.

# Plano do DroidSH — Terminal Android

## Escopo aprovado

O DroidSH é um aplicativo Android inspirado na categoria de terminais móveis como o Termux, mas com identidade visual e experiência próprias. A primeira entrega oferece uma experiência funcional de linha de comando em um ambiente simulado/isolado no cliente, com arquitetura modular para que uma camada de execução Linux nativa possa substituir o executor inicial futuramente. O catálogo de pacotes é extensível e começa com um conjunto compatível demonstrativo, sem alegar que o app já contém um sistema Linux completo ou todos os pacotes do Termux.

## Abordagem de implementação

- **Stack:** starter fixo Expo Router + React Native + TypeScript + NativeWind, preservando o runtime Expo e os listeners 8081/3000.
- **Shell desacoplado:** `lib/terminal/engine.ts` define parser e executor de comandos, `lib/terminal/types.ts` expõe a interface `TerminalExecutor` e `lib/terminal/runtime.ts` injeta o adapter virtual. A tela conhece apenas o contrato, deixando a futura troca por um runtime Linux nativo isolada.
- **Sistema de arquivos inicial:** sistema de arquivos virtual pequeno, previsível e seguro para a primeira versão. Comandos de navegação e manipulação (`pwd`, `ls`, `cd`, `mkdir`, `touch`, `cat`, `rm`, `echo > arquivo`) operam nele e o estado fica disponível durante a sessão.
- **Persistência:** histórico, preferências e catálogo instalado usam AsyncStorage; dados são versionados por chaves próprias para permitir migração futura.
- **Pacotes:** catálogo tipado em `lib/terminal/packages.ts`, com comandos `pkg list`, `pkg search`, `pkg install`, `pkg update` e `pkg remove`. A camada de catálogo poderá receber repositórios remotos e assinaturas em uma etapa nativa posterior.
- **Interface:** terminal escuro, focado em uma mão, com saída rolável, prompt monoespaçado, chips de comandos frequentes, drawer/modal de pacotes e modal de preferências. O app usa `StyleSheet` para componentes React Native e não depende de DOM.
- **Backend:** o starter mantém o servidor e banco provisionados, mas a experiência do shell inicial não depende deles; isso evita enviar comandos locais para um servidor. A autenticação existente permanece disponível para uma futura sincronização opcional.

## Estrutura principal

- `app/(tabs)/index.tsx`: tela principal do terminal, entrada, saída, sessão e modais.
- `app/(tabs)/_layout.tsx`: configuração da navegação e identidade da aba Terminal.
- `lib/terminal/engine.ts`: parser e implementação do shell virtual.
- `lib/terminal/runtime.ts`: adapter/fábrica do executor, substituível por ponte nativa Android.
- `lib/terminal/packages.ts`: catálogo, estado instalado e operações de pacotes.
- `lib/terminal/storage.ts`: persistência de histórico, preferências e sistema de arquivos virtual.
- `lib/terminal/types.ts`: tipos compartilhados de comandos, linhas de saída, preferências e arquivos.
- `constants/theme.ts` e `lib/_core/theme.ts`: tokens visuais mantidos compatíveis com o starter.
- `assets/images/*`: ícones e splash com a marca DroidSH.
- `tests/`: cobertura unitária do executor e dos fluxos de pacotes.
- `README.md`: instalação, comandos suportados, limites atuais e caminho para integrar runtime Linux nativo.

## Design

### Estilos considerados

1. **Terminal industrial noturno** — 0,07: interface preta, técnica e densa, com acentos de verde fósforo.
2. **Console aurora** — 0,08: superfícies azul-marinho e brilho ciano/menta, com mais respiro e sensação de ferramenta moderna.
3. **Workbench editorial** — 0,06: terminal claro, tipografia forte e blocos de documentação.

### Direção escolhida: Console aurora

- **Movimento de design:** cyber-minimalism utilitário, inspirado em consoles de diagnóstico e painéis de engenharia, sem copiar o Termux.
- **Princípios:** densidade legível; uma ação primária por vez; feedback imediato; detalhes técnicos usados como orientação, não decoração.
- **Filosofia de cor:** azul-marinho quase preto reduz fadiga em sessões longas; ciano indica foco e ação; menta sinaliza sucesso; âmbar é reservado a avisos e falhas.
- **Paradigma de layout:** uma coluna vertical de sessão com cabeçalho de contexto, terminal como superfície dominante e comandos rápidos ancorados acima do teclado; modais laterais/baixos para pacotes e configurações.
- **Elementos assinatura:** marca `>_` dentro de um quadrado aurora; linha de status “session online”; chips de comando como pequenas teclas de hardware.
- **Interação:** tocar em uma linha de comando reutiliza o comando; chips inserem comandos sem executar; Enter envia; deslizar/rolar navega pela saída; histórico sobe e desce pelo teclado.
- **Animação:** cursor com pulso suave; entrada de linha aparece imediatamente; modal de pacote sobe em 180 ms; nenhum efeito contínuo além do cursor para preservar bateria.
- **Tipografia:** `monospace` para tudo que representa shell e saída; sans nativa do sistema para navegação e explicações. Hierarquia curta: marca 18, prompt 14, saída 13, rótulos 11.
- **Essência da marca:** “um terminal móvel direto, seguro para experimentar e pronto para crescer”; personalidade: técnico, calmo, explorável.
- **Voz:** comandos e labels curtos, claros e sem jargão desnecessário. Exemplos: “Digite um comando para começar.” e “Pacote instalado nesta sessão.”
- **Marca:** wordmark compacto `DroidSH` com o `SH` destacado como prompt; o ícone é um cursor `>_` geométrico, sem texto pequeno.
- **Cor proprietária:** aurora cyan `#72F6D0`, usada para foco e estados positivos contra `#07111F`.

## Limites explícitos da primeira entrega

A versão inicial não executa binários Linux arbitrários nem instala APKs/pacotes reais no sistema Android. Ela fornece um shell virtual funcional e uma camada de execução substituível. A integração com runtime Linux nativo, permissões de armazenamento, sandbox de processos, cross-compilação e repositórios assinados deve ser implementada como fase posterior com módulos nativos Android e revisão de segurança.

## Entrega

O código será salvo no checkpoint do projeto e, após a configuração autorizada pelo proprietário, transferido para um novo repositório privado do GitHub conforme o fluxo de conexão do Webdev. O usuário poderá torná-lo público no GitHub; o fluxo gerenciado não sobrescreve um repositório existente.

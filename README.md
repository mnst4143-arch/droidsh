# DroidSH — Terminal Android

DroidSH é um terminal Android inspirado na categoria de ferramentas como o Termux, com identidade visual própria e um shell virtual funcional para explorar comandos, arquivos e pacotes em uma sessão segura. O projeto usa Expo Router, React Native e TypeScript.

> Estado atual: shell virtual local e modular. Esta versão não executa binários Linux arbitrários nem instala pacotes reais no sistema Android. A camada de execução foi isolada para receber um runtime Linux nativo em uma fase posterior.

## Começar

```bash
pnpm install
pnpm db:push
pnpm dev
```

A interface Metro/Web usa a porta `8081` e o servidor do starter usa a porta `3000`. Para verificar o código, rode `pnpm check`, `pnpm lint` e `pnpm test`.

## Comandos disponíveis

A sessão suporta `help`, `ls`, `cd`, `pwd`, `mkdir`, `touch`, `cat`, `rm`, `echo`, `history`, `env`, `whoami`, `uname`, `date`, `clear` e `pkg`. O `pkg` permite `list`, `search`, `install`, `update` e `remove` para o catálogo inicial. O histórico, as preferências e a sessão do sistema de arquivos virtual são persistidos localmente no dispositivo.

## Arquitetura

A tela em `app/(tabs)/index.tsx` é somente uma camada de interação. `lib/terminal/engine.ts` define o contrato e a implementação do shell virtual, `lib/terminal/packages.ts` mantém o catálogo extensível e `lib/terminal/storage.ts` centraliza a persistência. Para integrar um runtime Linux nativo, a próxima implementação deve adicionar uma ponte Android atrás do executor, mantendo a mesma interface de saída e estado usada pela tela.

## Segurança e próximos passos

Um runtime nativo deverá executar processos em sandbox, validar permissões de armazenamento, assinar/verificar repositórios de pacotes, limitar recursos e evitar que comandos escapem do espaço de trabalho do app. Antes de distribuir uma versão com binários reais, também será necessário adicionar testes em dispositivo Android, pipeline de builds APK/AAB e revisão de permissões.

## Contribuição

Abra uma issue descrevendo o comando, pacote ou comportamento desejado. Pull requests devem manter o executor independente da interface, incluir testes para mudanças no shell e explicar qualquer nova permissão nativa.

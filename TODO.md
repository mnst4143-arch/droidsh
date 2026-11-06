# TODO — DroidSH

## Terminal Android funcional

- [x] Entregar um aplicativo Android inspirado no Termux, com identidade visual e experiência próprias.
- [x] Exibir uma interface de terminal com entrada de comandos, saída formatada, rolagem e foco em uso por toque.
- [x] Manter sessões de terminal com estado preservado durante o uso e tratar comandos inválidos e erros com mensagens claras.

## Comandos e sistema de arquivos inicial

- [x] Implementar conjunto inicial de comandos básicos para navegação, manipulação de arquivos e consulta do ambiente disponível.
- [x] Incluir `pwd`, `ls`, `cd`, `mkdir`, `touch`, `cat`, `rm`, `echo`, `clear`, `help`, `whoami`, `uname`, `date` e `env` em um executor modular.
- [x] Manter a camada de execução desacoplada da interface, preparada para integrar um runtime Linux nativo sem reescrever a tela.

## Histórico e interação

- [x] Persistir histórico de comandos com navegação, reutilização e limpeza pelo usuário.
- [x] Permitir tocar em comandos anteriores para reutilizá-los e oferecer comandos rápidos sem execução automática.
- [x] Preservar o estado da sessão durante o uso e mostrar o diretório atual no prompt.

## Gerenciamento de pacotes

- [x] Criar catálogo de pacotes extensível, estruturado para receber novas fontes e pacotes em versões futuras.
- [x] Implementar comandos para listar, buscar, instalar, atualizar e remover pacotes compatíveis com o ambiente inicial.
- [x] Exibir estado instalado e mensagens de sucesso/erro compreensíveis.

## Preferências e identidade

- [x] Permitir personalizar fonte/tamanho do texto, cores, cursor e comportamento de entrada por meio de preferências do terminal.
- [x] Entregar identidade própria com ícone quadrado, splash e paleta “Console aurora”.

## Documentação e entrega

- [x] Documentar instalação, execução, arquitetura, comandos suportados, limites atuais e contribuição.
- [ ] Publicar o código-fonte em um repositório GitHub pertencente ao usuário, sem expor segredos.

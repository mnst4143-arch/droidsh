# DroidSH nativo

O DroidSH agora usa a base nativa Android do projeto Termux, licenciada sob GPLv3, em vez do protótipo Expo com shell virtual. A tela nativa executa processos reais dentro do ambiente Linux do aplicativo e usa o bootstrap/gerenciador de pacotes do ecossistema Termux. Isso permite trabalhar com `bash`, `sh`, `pkg`, `apt`, `nano`, `git`, `curl`, Python, pip, Node.js, npm e os demais pacotes disponíveis nos repositórios Termux.

## Estado da migração

A base nativa foi importada do commit upstream `8629e63` e rebrandeda para DroidSH. O namespace de pacote permanece `com.termux` nesta primeira etapa para manter compatibilidade com os bootstraps oficiais e com o repositório APT existente. Isso significa que o APK DroidSH não deve ser instalado junto com o Termux oficial no mesmo dispositivo.

Para uma identidade de pacote independente (`com.droidsh`) sem perder os pacotes reais, ainda é necessário construir e publicar um bootstrap próprio e um repositório APT próprio para todas as arquiteturas suportadas. O próprio projeto Termux documenta que o nome do pacote customizado exige recompilar os pacotes com o novo `$PREFIX`.

## Compilação

A compilação exige Android Studio ou a toolchain Android equivalente, JDK, Android SDK, NDK e Gradle Wrapper. No Linux, a partir da raiz:

```bash
./gradlew assembleDebug
```

O projeto baixa os bootstraps oficiais e valida seus checksums. Para produção, deve ser configurada uma chave de assinatura própria e gerado um APK/AAB release.

## Licenças e atribuição

O código da aplicação nativa é derivado de `termux/termux-app` e permanece sob GPLv3. As bibliotecas `terminal-view` e `terminal-emulator` têm as exceções/licenças indicadas no arquivo `LICENSE.md`; `termux-shared` possui sua licença própria. As alterações específicas do DroidSH estão identificadas nos arquivos de marca e documentação.

## Próxima etapa necessária

O próximo passo técnico é automatizar a construção do bootstrap e do repositório de pacotes DroidSH em aarch64, arm, x86 e x86_64. Depois disso o namespace poderá deixar de ser `com.termux`, permitindo instalação lado a lado com o Termux oficial sem quebrar shebangs, caminhos do `$PREFIX` ou atualizações do `pkg`.

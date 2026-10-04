# BadgesPlus para BetterDiscord

[🇺🇸 English](README.md) · **🇧🇷 Português**

Plugin para o **[BetterDiscord](https://betterdiscord.app)** que mostra as badges do perfil das pessoas **sem precisar abrir o perfil** e permite **pesquisar membros do servidor por badge**.

> Usa Vesktop ou Vencord? Pegue a versão com instalador automático: **[lirenzzzin/BadgesPlus](https://github.com/lirenzzzin/BadgesPlus)**

- Badges logo depois do nome, **no chat e na lista de membros**
- Pesquisador de badges: encontre quem tem **Nitro Opala**, **Apoiador Inicial**, **Impulso 24 meses**, **HypeSquad**... e mande mensagem direto
- 29 configurações: tamanho, espaçamento, limite, ordem, quais badges mostrar, velocidade de carregamento e mais
- **Português e inglês**: segue o idioma do Discord, ou escolha nas configurações

---

## Instalação

1. Baixe o **[`BadgesPlus.plugin.js`](https://raw.githubusercontent.com/lirenzzzin/BadgesPlus-BetterDiscord/main/BadgesPlus.plugin.js)** (botão direito no link → *Salvar link como...*).
2. No Discord, vá em **Configurações de usuário → BetterDiscord → Plugins → Abrir pasta de plugins** (*Open Plugins Folder*).
3. Coloque o `BadgesPlus.plugin.js` dentro dessa pasta.
4. De volta em **Plugins**, ative o **BadgesPlus**.

A pasta de plugins normalmente fica em:

| Sistema | Pasta |
|---|---|
| Windows | `%appdata%\BetterDiscord\plugins` |
| macOS | `~/Library/Application Support/BetterDiscord/plugins` |
| Linux | `~/.config/BetterDiscord/plugins` |

### Atualizar

Baixe o `BadgesPlus.plugin.js` de novo e substitua o arquivo antigo na pasta de plugins. O BetterDiscord recarrega sozinho.

### Desinstalar

Desative o plugin em **Plugins** e apague o `BadgesPlus.plugin.js` da pasta de plugins.

---

## Como usar

### Badges ao lado do nome

Depois de ativar o plugin, as badges aparecem sozinhas no chat e na lista de membros. Passe o mouse em cima para ver o nome.

- Badges como **HypeSquad, Caçador de Bugs, Apoiador Inicial e Desenvolvedor Ativo** aparecem na hora.
- **Nitro e Impulso** só existem no perfil completo da pessoa. O plugin carrega os perfis em segundo plano, um de cada vez, começando por quem está na tela. Por isso elas vão aparecendo aos poucos.

### Pesquisador de badges

1. Entre em um canal de qualquer servidor.
2. Clique no **ícone de Nitro** na barra do canal, ao lado de fixados e lista de membros.
3. Aparecem botões com todas as badges do servidor e quantas pessoas têm cada uma.
4. Clique numa badge para selecionar. Ela fica com **contorno verde** e aparece a lista de quem tem essa badge.
5. Selecione várias para combinar. Por padrão aparece só quem tem **todas**; dá para trocar para **qualquer uma** nas configurações.
6. Em cada pessoa do resultado:
   - clique no **nome ou na foto** para abrir o perfil;
   - clique no **balão de conversa** para abrir a DM com ela.

**Dicas**

- O Discord só carrega parte dos membros de servidores grandes. O pesquisador mostra "X membros carregados de Y". Rolar a lista de membros carrega mais gente.
- O link **"Carregar badges de N membros"** busca o perfil de quem falta, para encontrar Nitro e Impulso. Você vê quantos faltam e pode clicar em **Parar** a qualquer momento.

---

## Configurações

Em **Configurações de usuário → BetterDiscord → Plugins → BadgesPlus** (ícone de engrenagem). Tudo muda na hora, sem reiniciar.

| Grupo | Opções |
|---|---|
| **Idioma** | Automático (segue o Discord) · English · Português |
| **Onde mostrar** | No chat · Na lista de membros · Nas suas próprias badges · Em bots |
| **Aparência** | Tamanho no chat · Tamanho na lista de membros · Espaço entre badges · Máximo de badges por pessoa · Mostrar "+N" quando passar do máximo · Ordem (igual ao Discord / Nitro primeiro / Nitro por último) · Texto ao passar o mouse (nome curto ou texto do Discord) |
| **Quais badges** | Nitro · Impulso · HypeSquad · Programas do Discord (Funcionário, Parceiro, Caçador de Bugs, Apoiador Inicial, Desenvolvedores...) · Nome antigo · Missões e Orbs · Outras |
| **Carregamento** | Carregar perfis automaticamente · Velocidade (Rápido 0,5s / Normal 1s / Seguro 2s / Muito seguro 4s) · Carregar perfil de bots |
| **Pesquisador** | Mostrar o botão · Combinar badges (todas / qualquer uma) · Carregar badges ao abrir · Botão de mensagem · Fechar o pesquisador ao abrir DM · Incluir bots · Máximo de resultados |

O painel de configurações aparece no idioma escolhido em **Idioma**. Depois de trocar, feche e abra o painel de novo.

---

## Problemas comuns

**O plugin não aparece na lista de plugins**
- Confira se o arquivo se chama exatamente `BadgesPlus.plugin.js` (o Windows às vezes coloca `.txt` ou `(1)` no nome ao baixar).
- Confira se ele está na própria pasta de plugins, e não numa subpasta.

**O botão de Nitro não aparece na barra do canal**
- Ele só aparece dentro de servidores, não em DMs.
- Confira se **"Botão de pesquisar badges"** está ligado nas configurações do plugin.

**As badges ou o botão pararam de aparecer depois de uma atualização do Discord**
- O Discord às vezes muda o layout. Abra o console (`Ctrl+Shift+I`), procure erros com "BadgesPlus" e [abra uma issue](https://github.com/lirenzzzin/BadgesPlus-BetterDiscord/issues).

**As badges de Nitro/Impulso demoram para aparecer**
- É normal: o Discord entrega um perfil por vez. Se o Discord pedir para ir mais devagar, o plugin desacelera sozinho. Se demorar demais, use a velocidade **Normal**.

---

## Aviso

Mods de cliente como o BetterDiscord vão contra os Termos de Serviço do Discord. Use por sua conta e risco. O plugin carrega perfis de forma lenta, respeita os limites do Discord e **nunca envia mensagens automaticamente**: o botão de mensagem só abre a conversa.

## Licença

[GPL-3.0](LICENSE).

THE HISTORY OF GREAT TOBIAS — JOGAR + NOME

Envie todos os arquivos deste ZIP para a raiz do GitHub Pages.

FLUXO
- CONTINUAR HISTÓRIA foi removido.
- CRIAR NOVA HISTÓRIA virou JOGAR e ficou exatamente na mesma posição.
- JOGAR: se já houver save local, abre jogo.html; senão, abre nome.html.
- nome.html pede o nome.
- Se o nome estiver ocupado, propõe Nome_1, Nome_2, ... até Nome_99999.
- Ao confirmar, cria o save e entra no jogo.

IMPORTANTE: GitHub Pages não possui banco de dados. O pacote vem com backend-config.js em mode: "local" para o fluxo funcionar durante o desenvolvimento. Nesse modo, a disponibilidade de nomes só é compartilhada dentro do mesmo navegador.

Para nomes realmente globais entre todos os jogadores:
1. crie um projeto Supabase;
2. execute SUPABASE_SETUP.sql;
3. em backend-config.js troque mode para "supabase";
4. preencha supabaseUrl e supabaseAnonKey;
5. nunca use a service_role key no site.

O save é armazenado em localStorage com a chave tobias_save_v1.


============================================================
ATUALIZAÇÃO — 06/09/2026 — INTERFACE / CONFIGURAÇÕES
============================================================

PÁGINA PRINCIPAL
- O botão JOGAR continua exatamente no mesmo local.
- JOGAR agora usa novamente o visual amarelo/dourado.
- Correção adicionada para Android/iPhone ao voltar pelo botão físico/gesto:
  o vídeo é retomado via pageshow (BFCache), focus e visibilitychange.

PRIMEIRA PÁGINA DO JOGO
- Continua com a área de publicidade separada no topo.
- Toda a interface do jogo fica SOMENTE dentro da área abaixo do anúncio.
- O botão ⚙ ocupa a mesma posição do antigo botão de música da introdução.
- O fundo atual ainda usa o vídeo de Tobias apenas como placeholder visual
  enquanto a primeira área real do jogo é desenvolvida.

CONFIGURAÇÕES
- Slider de volume da música: 0–100%.
- Mute/desmute rápido da música.
- Slider de volume dos efeitos de áudio: 0–100%.
- Mute/desmute rápido dos efeitos.
- As configurações de áudio são salvas no navegador em:
    tobias_audio_settings_v1
- O botão JOGAR fecha o painel e volta ao jogo.

DELETAR PROGRESSO
- Primeira confirmação: aviso explícito de perda irreversível.
- Segunda confirmação: aviso final, propositalmente mais cômico.
- NÃO em qualquer etapa retorna ao painel.
- SIM na segunda etapa apaga o progresso do navegador e retorna à index.html.
- location.replace() impede que o botão voltar reabra imediatamente
  a tela de jogo recém-deletada.

ARQUIVOS NOVOS
- jogo.js


============================================================
3 CORREÇÕES — 06/09/2026
============================================================

1. VÍDEO DA INDEX AO VOLTAR PELO BOTÃO DO CELULAR
--------------------------------------------------
Agora, se a index for restaurada por uma navegação Back/Forward
(BFCache ou navigation.type = back_forward), a página faz uma recarga
normal UMA ÚNICA VEZ. Isso reconstrói o elemento de vídeo e evita o
estado visual congelado observado em alguns navegadores móveis.

2. APAGAR SAVE LIBERA O NOME
-----------------------------
Antes de apagar o save:
  TobiasNameRegistry.release(nome)

Em modo local, o nome é removido de:
  tobias_registered_names_v1

Exemplo:
  Tobias registrado -> apaga progresso -> Tobias volta a ser sugerido.

Se futuramente mode = "supabase", execute novamente SUPABASE_SETUP.sql,
pois foi adicionada a RPC release_username().

3. JOGO SEM VÍDEO DE FUNDO
---------------------------
jogo.html não contém mais tobias_intro.mp4.
O nome do jogador e o cenário provisório também não aparecem.
A área fica vazia por enquanto e mantém apenas o botão de configurações
e seus painéis, sempre abaixo da área de publicidade.


============================================================
INTERFACE — IDENTIDADE + 4 MENUS + INVENTÁRIO
============================================================

IDENTIDADE
----------
O nome do jogador voltou a aparecer no canto superior esquerdo da área
do jogo, exatamente como identificação do save ativo.

TOBIAS LIBERADO
---------------
Foi adicionada uma migração local de uma única execução para remover o
registro de teste antigo "Tobias" que havia ficado preso em:
  tobias_registered_names_v1

Essa migração NÃO apaga o save atual.
Ela serve apenas para corrigir o nome preso desta fase de desenvolvimento.

MENU LATERAL
------------
De baixo para cima:
1. Configurações
2. Descobertas (livro)
3. Equipamentos (armadura)
4. Inventário (bolsa)

Descobertas e Equipamentos possuem apenas título + botão Fechar por enquanto.

INVENTÁRIO
----------
- 100 slots
- 4 colunas x 25 linhas
- slots quadrados
- máximo 9.999 unidades do MESMO item por stack
- itens idênticos são empilhados automaticamente
- se a pilha chegar a 9.999, a próxima quantidade usa um novo slot
- o painel possui scroll interno, sem mover a página do navegador

ITENS DE TESTE
--------------
1. Espada de Metal
   Tipo: Equipamento
   Equipável: sim
   Quantidade inicial: 1

2. Pedra de Refino
   Tipo: Material de refino
   Equipável: não
   Quantidade inicial: 1

DETALHE DO ITEM
---------------
Ao tocar em um item:
- ícone grande
- nome
- tipo
- descrição
- informação de fabricação
- quantidade

Equipamento:
- Equipar
- Descartar

Item não equipável:
- Descartar

Descartar pede confirmação e exclui o stack selecionado.


============================================================
ATUALIZAÇÃO — MÚSICA / HISTÓRICO / INVENTÁRIO
============================================================

1. MÚSICA NA TELA "QUAL É O SEU NOME?"
----------------------------------------
A mesma trilha agora toca também em nome.html.

A posição atual da música é salva em:
  sessionStorage -> tobias_music_position_v1

Ao trocar da introdução para a criação do nome, nome.html retoma a música
aproximadamente do ponto em que ela estava. Volume e mute continuam usando:
  localStorage -> tobias_audio_settings_v1

Como são páginas HTML diferentes, pode existir uma pausa mínima durante a
troca de documento, mas a música não reinicia do começo.

2. NOME.HTML NÃO PODE SER REABERTA APÓS CRIAR O PERSONAGEM
------------------------------------------------------------
Ao entrar no jogo depois de registrar o nome:
  window.location.replace("jogo.html")

Isso remove nome.html do histórico.

Fluxo:
  index -> nome -> jogo

Histórico final:
  index -> jogo

Portanto, apertar Voltar no jogo leva à página inicial, nunca novamente à
tela de criação de nome.

Se nome.html for aberta manualmente quando já existe save, ela redireciona
automaticamente para index.html.

3. EQUIPAMENTOS
---------------
O ícone foi redesenhado para mostrar claramente:
  elmo medieval + espada.

4. INVENTÁRIO
-------------
Removido da interface:
  "100 SLOTS · MÁX. 9.999 POR SLOT"

As regras continuam existindo internamente.

5. DESCARTAR ITEM
-----------------
O aviso agora mostra a quantidade total do item.

Descartar remove TODAS as unidades daquele item exato do inventário, mesmo
que no futuro existam várias pilhas do mesmo item.

Exemplo:
  200 Pedras de Refino -> Descartar -> as 200 são apagadas.


============================================================
AJUSTES DE INTERFACE
============================================================

DESCARTAR ITEM
--------------
A confirmação agora diz apenas:
  "Ao confirmar, todas as unidades desse item serão descartadas.
   Você tem certeza?"

A mensagem inferior permanece:
  "Ele será perdido para sempre."

A quantidade possuída não é mais exibida nessa confirmação.

EQUIPAMENTOS
------------
O ícone foi simplificado para uma espada medieval.
Ele usa agora exatamente o mesmo fundo, proporção, cor e estilo dos outros
botões laterais.

CONFIGURAÇÕES
-------------
- Removido o subtítulo "ÁUDIO DO JOGO".
- O botão "JOGAR" foi renomeado para "FECHAR".
- "FECHAR" fica isolado no rodapé, como nos outros menus.
- "DELETAR PROGRESSO" foi movido para cima, deixando espaço visual entre
  ele e o botão FECHAR.


============================================================
ATUALIZAÇÃO — AÇÕES / ESPADA / SOM DE INTERFACE
============================================================

DETALHE DO ITEM
---------------
- DESCARTAR fica sempre à esquerda.
- EQUIPAR aparece sempre à direita quando o item é equipável.
- Itens não equipáveis mantêm DESCARTAR no lado esquerdo.

ÍCONE EQUIPAMENTOS
------------------
Novo ícone: espada medieval larga, simétrica e vertical.
O botão usa exatamente o mesmo círculo, cor e proporção dos outros menus.

CONFIGURAÇÕES
-------------
DELETAR PROGRESSO foi deslocado um pouco para baixo para ficar melhor
centralizado no grande espaço existente entre os controles de áudio e
o botão FECHAR.

SOM DE INTERFACE
----------------
Arquivo novo:
  ui_click.mp3

É um som curto e suave de confirmação de interface.
Toca somente ao interagir com controles reais:
- botões
- links clicáveis
- abrir/fechar menus
- confirmar/cancelar ações

Não toca em toques aleatórios na área vazia da tela.

O som respeita:
  sfxVolume
  sfxMuted
das Configurações.

Os sliders não repetem o som durante o arraste.


============================================================
GLOBAL CHAT
============================================================

A speech-bubble button was added in the lower-left corner of the game area,
symmetric to Settings.

GLOBAL MODE
-----------
To test chat between two different phones, backend-config.js MUST use:

  mode: "supabase"
  supabaseUrl: "YOUR SUPABASE PROJECT URL"
  supabaseAnonKey: "YOUR SUPABASE ANON/PUBLIC KEY"

Then run the updated SUPABASE_SETUP.sql in Supabase SQL Editor.

The chat:
- uses the current player name on every message;
- keeps the newest 1,000 messages;
- deletes older messages automatically when new ones arrive;
- refreshes every 2 seconds while open;
- does NOT delete messages when a player deletes their character/save.

LOCAL MODE
----------
If backend-config.js remains mode: "local", the chat interface works, but
messages exist only on that one browser/device.

SECURITY
--------
This is a prototype without account authentication. Names are unique in the
game flow, but browser identity is not cryptographically protected yet.


============================================================
UPDATE — REALTIME CHAT + MUSIC ONLY ON TITLE PAGE
============================================================

CHAT
----
The old 2-second polling system was removed.

New behavior:
1. Load newest 1,000 messages once when Chat opens.
2. Subscribe to INSERT events through Supabase Realtime.
3. New messages appear immediately on every connected device.
4. No repeated download of the full chat history.

MUSIC
-----
tobias_theme.mp3 now plays ONLY on index.html.

No background music is played on:
- nome.html
- jogo.html

UI click sound remains active.

The Music control in Settings still stores the title-page music
volume/mute preference for the next time the player returns to index.html.


============================================================
MUSIC ADJUSTMENT
============================================================

Background music now plays on:
- index.html
- nome.html

Background music does NOT play on:
- jogo.html

nome.html restores the soundtrack position saved by index.html using:
  sessionStorage -> tobias_music_position_v1

Volume and mute preferences continue to use:
  localStorage -> tobias_audio_settings_v1

UI click effects remain active on all interfaces.


============================================================
CHAT — MOBILE UX UPDATE
============================================================

1. HEADER
---------
The visible chat header now contains only:
  CHAT

Technical Realtime status remains hidden from the visual interface.

2. CHAT BUTTON
--------------
The chat control is now inside a dedicated lower-left menu container.
It exactly mirrors the horizontal/vertical anchor of Settings:
  left: 3%
  bottom: 2.2%

The icon is a clear speech bubble with three dots.

3. NO AUTOMATIC KEYBOARD
------------------------
Opening Chat no longer calls focus() on the message field.

The player can open Chat and simply read messages without the keyboard
appearing.

The keyboard opens only when the player explicitly taps the message field.

4. MOBILE KEYBOARD LAYOUT
-------------------------
When the message input receives focus:
- VisualViewport height is measured.
- page-shell is resized to the visible area above the keyboard.
- the advertising area remains visible.
- CHAT remains visible in a compact header.
- the message history receives all remaining flexible space.
- the message field remains visible.
- ENVIAR remains visible.
- FECHAR remains visible.
- the input uses 16px text while focused to prevent iOS auto-zoom.

THE HISTORY OF GREAT TOBIAS — QUARTO HD JOGÁVEL

Esta versão usa a arte HD gerada do quarto como o próprio cenário do jogo.

Navegação:
- point-and-click / toque para andar;
- o Tobias calcula uma rota e contorna os principais móveis;
- clicar em uma área ocupada leva o personagem ao ponto livre mais próximo;
- a câmera acompanha o personagem;
- o quarto mantém aproximadamente duas telas de largura por duas de altura;
- ao chegar à porta inferior, abre proximo-comodo.html.

Visual:
- quarto_tobias_hd.png é o cenário renderizado em alta qualidade;
- móveis e decoração NÃO são mais desenhados por primitivas de Canvas;
- o personagem continua provisório para teste de navegação, conforme a especificação inicial.

Envie TODOS os arquivos deste ZIP para a raiz do repositório GitHub Pages, substituindo os arquivos de mesmo nome.

UPDATE — PRÓXIMO CÔMODO COM HUD ATIVO
- proximo-comodo.html agora mantém o mesmo HUD da página principal do jogo.
- Chat, Inventário, Equipamentos, Descobertas e Configurações permanecem utilizáveis.
- O botão VOLTAR AO QUARTO continua disponível no centro da página.
- O mundo/câmera do quarto não roda em segundo plano nesta página.


UPDATE — colisões e retorno ao quarto
- colisões substituídas por polígonos ajustados ao pé real dos móveis;
- tapete e áreas de chão livres permanecem caminháveis;
- retorno do cômodo em construção reposiciona Tobias acima da porta, evitando loop;
- fallback de retorno também usa sessionStorage;
- velocidade de caminhada aumentada em 20% (0.19 -> 0.228);
- usa quarto_tobias_hd.png e tobias_player_sprite_hd.png da última versão visual.


UPDATE — PIXEL COLLISION / DEPTH / WALKING
- room_walkable_mask.png: mapa de colisão por pixel; branco = caminhável, preto = bloqueado.
- Objetos do cenário são redesenhados em primeiro plano quando Tobias passa atrás deles.
- Sem sombra artificial embaixo do personagem.
- Pequena animação de caminhada (oscilação/bounce/squash) aplicada ao sprite HD aprovado.
- Dois passos de madeira originais: tobias_footstep_wood_1.ogg e tobias_footstep_wood_2.ogg.
- Velocidade mantida em +20% (0.228 vs 0.19).
- Retorno do cômodo em construção reaparece acima da zona de saída para evitar loop.

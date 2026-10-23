# Sasudoku

Sudoku em português com React, Vite e Motion. Foco em celular, paleta de papel e verde, tipografia arredondada, sons sintetizados e feedback visual expressivo.

## Rodar

Requer Node.js 22.12+ ou 24+. Instale as dependências uma vez:

```sh
npm install
npm run dev
```

Abra http://127.0.0.1:5173. Vite atualiza os componentes durante a edição. Para testar no celular na mesma rede Wi-Fi, use `http://IP-DO-COMPUTADOR:5173`. O firewall do Windows pode precisar liberar a conexão local.

```sh
npm test
npm run build
npm run preview
```

O build de produção fica em `dist/` e pode ser publicado em hospedagem estática. `public/` contém apenas recursos estáticos, como o favicon; a aplicação React fica em `src/`.

## Funcionalidades

- 6×6 (blocos de 3 colunas × 2 linhas) e 9×9 (blocos de 3×3).
- Quatro níveis: Fácil, Médio, Difícil e Impossível.
- Geração aleatória em Web Worker, com verificação de solução única a cada remoção de pista.
- Seleção de casas relacionadas e números iguais, validação imediata, lápis, apagar, desfazer e dicas sem limite.
- Anotações removidas dos pares quando um número correto é colocado.
- Cronômetro, pausa ao sair da aba e salvamento local automático. Reabrir uma partida a deixa pausada. Histórico de desfazer disponível durante a sessão.
- Salvamentos da primeira versão continuam compatíveis (`sasudoku:v1`), no mesmo navegador e endereço de origem. `localhost` e `127.0.0.1` têm armazenamentos separados.
- Sons opcionais usando Web Audio, feedback de conclusão de linhas, colunas e blocos e tela de vitória.
- Teclado: setas, números, Backspace/Delete, N e Ctrl/Cmd + Z. Movimento reduzido respeitado.
- Escolha de animações: seguir o sistema (padrão), completas ou suaves. A preferência fica salva e permite experimentar os efeitos sem alterar as configurações do dispositivo.

Os níveis usam metas de quantidade de pistas; o gerador pode preservar mais pistas para garantir unicidade. Isso ainda não é uma classificação por técnicas de resolução humana. “Impossível” é o nome do nível mais alto: todas as partidas têm solução.

## Estrutura React

- `src/App.jsx`: composição da tela e atalhos de teclado.
- `src/components/Board.jsx`: casas, pausa e vitória com Motion e AnimatePresence.
- `src/components/FeedbackLayer.jsx`: pops, ondas e partículas declarativas em Motion. Editar este componente permite ajustar referências de animação sem alterar as regras do jogo.
- `src/components/GameControls.jsx`: teclado numérico e ferramentas.
- `src/components/Settings.jsx`: tamanho, dificuldade e confirmação de nova partida.
- `src/hooks/useSudoku.js`: ciclo de vida do worker, cronômetro e persistência, com limpeza no unmount e suporte ao StrictMode.
- `src/hooks/useSound.js`: síntese de áudio e ciclo de vida do AudioContext.
- `src/game/state.js`: reducer puro com estado, histórico e eventos de feedback; as jogadas não manipulam o DOM.
- `src/game/storage.js`: validação e compatibilidade dos saves.
- `src/game/engine.js`: regras, solucionador e gerador independentes do React.
- `src/game/generator.js`: entrada do Web Worker, empacotada pelo Vite.
- `src/style.css`: identidade visual e adaptação mobile/desktop.
- `tests/`: regras, unicidade, jogadas, notas, desfazer, bloqueios e compatibilidade de saves.

Killer Sudoku exigirá regras e gerador próprios; o motor permanece separado dos componentes.

## Design e revisão

Aplicadas as skills `emil-design-eng`, `animate` e `mobile-native` de [Emil Kowalski](https://github.com/emilkowalski/skills). A direção pedida é expressiva, inclusive no teclado: impacto em 200–250 ms, pops e celebrações em 500–650 ms com atraso por distância. Motion usa transform e opacidade, sem movimentar o layout do tabuleiro. `useReducedMotion` e `MotionConfig` respeitam a preferência do sistema, substituindo movimento por opacidade e removendo partículas. Pausar, desfazer ou começar outra partida desmonta os efeitos; timers, listeners e workers são limpos nos hooks.

Antes de fechar a primeira etapa, verificar em um celular real: conforto dos alvos, sons, zoom, orientação horizontal, barras do navegador e safe areas. Emulação desktop não substitui essa revisão.

Nenhum commit é feito pelo agente. Sugestão após revisar a migração: `refactor: migrate sudoku to React with Motion`.

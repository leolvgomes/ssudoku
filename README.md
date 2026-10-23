# Sasudoku

Sudoku em português, pensado primeiro para celular. Uma interface de papel e tinta, sons sintetizados suaves e movimentos discretos.

## Rodar

Requer Node.js 22 ou superior. Não precisa instalar dependências.

```sh
npm run dev
```

Abra http://localhost:5173. Para testar no celular na mesma rede Wi-Fi, use `http://IP-DO-COMPUTADOR:5173`. O firewall do Windows pode precisar liberar a conexão local.

```sh
npm test
```

## Primeira versão

- 6×6 (blocos de 3 colunas × 2 linhas) e 9×9 (blocos de 3×3).
- Quatro níveis: Fácil, Médio, Difícil e Impossível.
- Geração aleatória em Web Worker, com verificação de solução única a cada remoção de pista.
- Seleção de casas relacionadas e números iguais, validação imediata, lápis, apagar, desfazer e dicas sem limite.
- Anotações removidas dos pares quando um número correto é colocado.
- Cronômetro, pausa ao sair da aba e salvamento local automático. Reabrir uma partida a deixa pausada. Histórico de desfazer disponível durante a sessão.
- Sons opcionais usando Web Audio, feedback de conclusão de linhas, colunas e blocos e tela de vitória.
- Teclado: setas, números, Backspace/Delete, N e Ctrl/Cmd + Z. Movimento reduzido respeitado.

Os níveis usam metas de quantidade de pistas; o gerador pode preservar mais pistas para garantir unicidade. Isso ainda não é uma classificação por técnicas de resolução humana. “Impossível” é o nome do nível mais alto: todas as partidas têm solução.

## Estrutura

- `public/engine.js`: regras, solucionador e gerador independentes da interface.
- `public/generator.js`: geração fora da thread principal.
- `public/app.js`: interação, áudio, persistência e estado da partida.
- `public/style.css`: identidade visual e adaptação mobile/desktop.
- `server.mjs`: servidor de desenvolvimento sem dependências.
- `tests/engine.test.mjs`: geração dos dois tamanhos em todos os níveis, unicidade e regras dos blocos.

O conteúdo de `public/` pode ser servido por qualquer hospedagem estática com suporte a módulos e Web Workers. Killer Sudoku exigirá regras e gerador próprios; a separação do motor permite acrescentá-los sem misturar a lógica atual com a interface.

## Design e revisão

Aplicadas as skills `emil-design-eng`, `animate` e `mobile-native` de [Emil Kowalski](https://github.com/emilkowalski/skills). Animações com propósito: feedback de pressão em 120 ms, entrada de tabuleiro em 250 ms e conclusão por opacidade. Interações de teclado não iniciam animações de entrada ou conclusão de unidades.

Antes de fechar a primeira etapa, verificar em um celular real: conforto dos alvos, sons, zoom, orientação horizontal, barras do navegador e safe areas. Emulação desktop não substitui essa revisão.

Nenhum commit é feito pelo agente. Sugestão de primeiro commit após revisão: `feat: add responsive sudoku game with unique puzzles`.

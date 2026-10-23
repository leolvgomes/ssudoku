import { config, peers, completedUnits, LEVELS, countSolutions } from './engine.js';

const $ = id => document.getElementById(id);
const paths = {
  sound: '<path d="m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  muted: '<path d="m11 5-6 4H2v6h3l6 4zM16 9l5 6m0-6-5 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3m0 3h.01"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  undo: '<path d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14"/>',
  erase: '<path d="m14 3 7 7-11 11H6l-4-4zM8 11l7 7M10 21h12"/>',
  notes: '<path d="m16 3 5 5-12 12-6 1 1-6zM13 6l5 5M3 21h18"/>',
  hint: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
for (const [id, label] of [['undo','Desfazer'],['erase','Apagar'],['notes','Anotar'],['hint','Dica']]) $(id).innerHTML = `${icon(id)}<span>${label}${id === 'notes' ? '<em id="notes-badge" hidden>ON</em>' : ''}</span>`;
$('help').innerHTML = icon('help');
let game = null, selected = -1, pencil = false, paused = false, loading = false, finished = false;
let elapsed = 0, lastTick = performance.now(), history = [], draftSize = 9, sound = false, audio;
let cells = [], numberKeys = [], hints = 0;
const storageKey = 'sasudoku:v1';
function message(text) { $('message').textContent = text; }
function save() {
  if (!game) return;
  try { localStorage.setItem(storageKey, JSON.stringify({ game, elapsed, history: history.slice(-100), hints, sound })); }
  catch { document.querySelector('.autosave').textContent = 'O navegador não permitiu salvar esta partida.'; }
}
function tone(kind = 'tap', value = 1) {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    void audio.resume();
    const frequencies = kind === 'win' ? [523,659,784,1047] : kind === 'unit' ? [523,659,784] : [kind === 'error' ? 155 : 300 + value * 32];
    frequencies.forEach((frequency, n) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime + n * .09;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.055, start + .008); gain.gain.exponentialRampToValueAtTime(.001, start + .18);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + .2);
    });
  } catch { /* Audio is optional; gameplay remains available. */ }
}
function updateSound() { $('sound').innerHTML = icon(sound ? 'sound' : 'muted'); $('sound').setAttribute('aria-label', sound ? 'Desativar sons' : 'Ativar sons'); $('sound').setAttribute('aria-pressed', sound); $('sound-note').innerHTML = `${sound ? 'Sons ativados' : 'Experimentar o som'} <span aria-hidden="true">↗</span>`; }
function toggleSound() { sound = !sound; updateSound(); tone('unit'); save(); }
$('sound').onclick = toggleSound; $('sound-note').onclick = toggleSound;
$('help').onclick = () => { const open = $('help-panel').hidden; $('help-panel').hidden = !open; $('help').setAttribute('aria-expanded', open); };
function showOverlay(title, text, action, symbol = 'Ⅱ') {
  $('overlay-title').textContent = title; $('overlay-text').textContent = text; $('resume').textContent = action; $('resume').hidden = !action; $('overlay-icon').textContent = symbol;
  $('board-overlay').hidden = false; $('board').classList.add('obscured');
}
function setPaused(value) {
  if (!game || loading || finished) return;
  paused = value; lastTick = performance.now();
  $('pause').innerHTML = icon(paused ? 'play' : 'pause'); $('pause').setAttribute('aria-label', paused ? 'Continuar partida' : 'Pausar partida');
  if (paused) showOverlay('Uma pausa faz bem.', 'Seu jogo espera por você.', 'Continuar partida');
  else { $('board-overlay').hidden = true; $('board').classList.remove('obscured'); }
  render(); save();
}
$('pause').onclick = () => setPaused(!paused);
$('resume').onclick = () => finished ? startGame() : setPaused(false);
function buildBoard() {
  const { size } = game, { boxRows, boxCols } = config(size);
  $('board').replaceChildren(); cells = [];
  $('board').style.setProperty('--size', size); $('board').dataset.size = size;
  $('board').setAttribute('aria-rowcount', size); $('board').setAttribute('aria-colcount', size);
  for (let r = 0; r < size; r++) {
    const row = document.createElement('div'); row.setAttribute('role', 'row'); row.style.display = 'contents'; $('board').append(row);
    for (let c = 0; c < size; c++) {
      const i = r * size + c, cell = document.createElement('button'); cell.className = 'cell'; cell.setAttribute('role','gridcell');
      cell.dataset.index = i; cell.dataset.borders = `${(c + 1) % boxCols === 0 ? ' box-right' : ''}${(r + 1) % boxRows === 0 ? ' box-bottom' : ''}${c === size - 1 ? ' last-col' : ''}${r === size - 1 ? ' last-row' : ''}`;
      cell.onclick = () => { if (paused || loading || finished) return; selected = i; render(); };
      cell.onfocus = () => { if (selected !== i) { selected = i; render(); } };
      cells.push(cell); row.append(cell);
    }
  }
  $('number-pad').replaceChildren(); numberKeys = []; $('number-pad').style.setProperty('--size', size);
  for (let value = 1; value <= size; value++) { const key = document.createElement('button'); key.className = 'number-key'; key.onclick = () => enter(value); numberKeys.push(key); $('number-pad').append(key); }
}
function render() {
  if (!game) return;
  const { size, board, puzzle, solution, notes } = game;
  const related = new Set(selected >= 0 ? peers(selected, size) : []), selectedValue = board[selected];
  cells.forEach((cell, i) => {
    const value = board[i];
    cell.className = 'cell' + cell.dataset.borders + (related.has(i) ? ' related' : '') + (selectedValue && value === selectedValue ? ' same' : '') + (i === selected ? ' selected' : '') + (value && !puzzle[i] ? ' entered' : '') + (value && value !== solution[i] ? ' error' : '');
    cell.replaceChildren();
    if (value) cell.textContent = value;
    else if (notes[i].length) {
      const grid = document.createElement('span'); grid.className = 'notes-grid'; grid.setAttribute('aria-hidden','true');
      for (let n = 1; n <= size; n++) { const note = document.createElement('span'); note.textContent = notes[i].includes(n) ? n : ''; grid.append(note); } cell.append(grid);
    }
    cell.tabIndex = i === selected ? 0 : -1;
    cell.setAttribute('aria-selected', i === selected);
    cell.setAttribute('aria-readonly', Boolean(puzzle[i]));
    cell.setAttribute('aria-label', `Linha ${Math.floor(i / size) + 1}, coluna ${i % size + 1}, ${value ? value + (puzzle[i] ? ', fixo' : value !== solution[i] ? ', incorreto' : '') : 'vazia' + (notes[i].length ? ', anotações ' + notes[i].join(', ') : '')}`);
  });
  numberKeys.forEach((key, i) => { const remaining = size - board.filter((v, j) => v === i + 1 && v === solution[j]).length; key.innerHTML = `${i + 1}<small>${remaining}</small>`; key.setAttribute('aria-label', `Número ${i + 1}, ${remaining} restantes`); key.disabled = paused || loading || finished; });
  const filled = board.filter((v,i) => v && v === solution[i]).length;
  $('progress-label').textContent = `${filled} de ${size * size} casas preenchidas`;
  $('notes').setAttribute('aria-pressed', pencil); $('notes-badge').hidden = !pencil;
  $('note-status').textContent = pencil ? 'LÁPIS ATIVO · ANOTE POSSIBILIDADES' : 'CADA CASA, UMA POSSIBILIDADE';
  $('undo').disabled = !history.length || paused || loading || finished;
  for (const id of ['erase','notes','hint']) $(id).disabled = paused || loading || finished;
  $('pause').disabled = loading || finished;
}
function snapshot() { history.push({ board: [...game.board], notes: game.notes.map(n => [...n]) }); if (history.length > 100) history.shift(); }
function enter(value, keyboard = false, isHint = false) {
  if (!game || paused || loading || finished) return;
  const i = selected;
  if (i < 0 || game.puzzle[i]) { message('Escolha uma casa vazia para começar.'); return; }
  if (pencil && value && !isHint) {
    if (game.board[i]) return;
    snapshot(); const notes = game.notes[i]; game.notes[i] = notes.includes(value) ? notes.filter(n => n !== value) : [...notes,value].sort(); render(); save(); tone('tap',value); return;
  }
  if (game.board[i] === value) return;
  const before = new Set(completedUnits(game.board, game.solution, game.size).map(unit => unit.join(',')));
  snapshot(); game.board[i] = value; game.notes[i] = [];
  if (value && value === game.solution[i]) for (const peer of peers(i,game.size)) game.notes[peer] = game.notes[peer].filter(n => n !== value);
  const wrong = value && value !== game.solution[i];
  message(wrong ? 'Esse número ainda não se encaixa. Você pode tentar outro.' : value ? isHint ? 'Uma ajudinha. Agora é com você.' : 'Um passo de cada vez.' : 'Espaço para uma nova ideia.');
  render();
  const newUnits = completedUnits(game.board, game.solution, game.size).filter(unit => !before.has(unit.join(',')));
  if (!keyboard && newUnits.length) for (const index of new Set(newUnits.flat())) cells[index].classList.add('celebrated');
  if (game.board.every((v,j) => v === game.solution[j])) {
    finished = true; showOverlay('Tudo no seu lugar.', `Você concluiu em ${formatTime(elapsed)}${hints ? `, com ${hints} dica${hints > 1 ? 's' : ''}` : ', sem dicas'}. Que tal guardar essa sensação?`, 'Mais uma partida', '✳');
    message('Conseguiu. Respire e aproveite.'); tone('win'); render();
  } else tone(wrong ? 'error' : newUnits.length ? 'unit' : 'tap',value);
  save();
}
$('erase').onclick = () => { if (game && !game.puzzle[selected] && game.notes[selected]?.length && !game.board[selected]) { snapshot(); game.notes[selected] = []; render(); save(); } else enter(0); };
$('notes').onclick = () => { pencil = !pencil; render(); message(pencil ? 'Lápis ativo. Anote as possibilidades.' : 'Lápis guardado. Hora de preencher.'); };
$('undo').onclick = () => { if (!history.length || paused || loading || finished) return; const previous = history.pop(); game.board = previous.board; game.notes = previous.notes; render(); save(); message('Um passo atrás também faz parte.'); };
$('hint').onclick = () => {
  if (!game || paused || loading || finished) return;
  if (selected < 0 || game.puzzle[selected] || game.board[selected] === game.solution[selected]) selected = game.board.findIndex((v,i) => v !== game.solution[i]);
  if (selected >= 0) { hints++; enter(game.solution[selected],false,true); }
};
function formatTime(seconds) { seconds = Math.floor(seconds); return `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`; }
setInterval(() => { const now = performance.now(); if (game && !paused && !loading && !finished && !document.hidden) elapsed += (now - lastTick) / 1000; lastTick = now; $('clock').textContent = formatTime(elapsed); }, 250);
setInterval(save,5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (game && !finished && !loading) setPaused(true); save(); } lastTick = performance.now(); });
window.addEventListener('pagehide',save);
document.addEventListener('pointerdown',() => document.body.classList.remove('keyboard-input'));
document.addEventListener('keydown', event => {
  document.body.classList.add('keyboard-input');
  if (!game || paused || loading || finished || event.altKey || event.target.closest('select, input, textarea') || (event.target.closest('button') && !event.target.closest('#board') && ['Enter',' '].includes(event.key))) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); $('undo').click(); return; }
  if (event.ctrlKey || event.metaKey) return;
  const offsets = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: game.size, ArrowUp: -game.size };
  if (event.key in offsets) { event.preventDefault(); selected = (Math.max(0,selected) + offsets[event.key] + game.board.length) % game.board.length; render(); cells[selected].focus({preventScroll:true}); }
  else if (/^[1-9]$/.test(event.key) && Number(event.key) <= game.size) { event.preventDefault(); enter(Number(event.key),true); }
  else if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') { event.preventDefault(); $('erase').click(); }
  else if (event.key.toLowerCase() === 'n') { event.preventDefault(); $('notes').click(); }
});
document.querySelectorAll('[data-size]').forEach(button => button.onclick = () => { draftSize = Number(button.dataset.size); document.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed',b === button)); });
$('new-game').onclick = () => {
  if (game && !finished) { $('confirm-new').hidden = false; $('confirm-start').focus(); }
  else startGame();
};
$('cancel-new').onclick = () => { $('confirm-new').hidden = true; $('new-game').focus(); };
$('confirm-start').onclick = startGame;
function startGame() {
  if (loading) return;
  loading = true; $('new-game').disabled = true; $('confirm-new').hidden = true;
  showOverlay('Preparando seu momento.', 'Criando uma partida com solução única…', '', '▦');
  if (game) render();
  const worker = new Worker('/generator.js', {type:'module'});
  function fail() { worker.terminate(); loading = false; $('new-game').disabled = false; if (game) { paused = true; setPaused(true); } else { showOverlay('Vamos tentar de novo?', 'Não foi possível gerar o tabuleiro.', '', '↻'); } message('Não foi possível criar a partida. Toque em Novo jogo para tentar novamente.'); }
  worker.onerror = fail;
  worker.onmessage = ({ data }) => {
    worker.terminate(); if (data.error) { fail(); return; }
    game = { ...data.game, board: [...data.game.puzzle], notes: data.game.puzzle.map(() => []) };
    elapsed = 0; hints = 0; lastTick = performance.now(); history = []; selected = game.puzzle.findIndex(v => !v); pencil = false; paused = false; finished = false; loading = false;
    $('clock').textContent = '00:00'; $('new-game').disabled = false; $('game-title').textContent = `Clássico ${game.size}×${game.size}`; $('level-label').textContent = LEVELS[game.difficulty];
    $('board-overlay').hidden = true; $('board').classList.remove('obscured'); $('pause').innerHTML = icon('pause'); $('pause').setAttribute('aria-label','Pausar partida');
    buildBoard(); render(); $('board').classList.remove('deal'); void $('board').offsetWidth; if (!document.body.classList.contains('keyboard-input')) $('board').classList.add('deal'); message('Um novo começo. Encontre seu ritmo.'); save();
  };
  worker.postMessage({size:draftSize,difficulty:$('difficulty').value});
}
function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey)); if (!saved) return false;
    const g = saved.game, size = g.size; config(size);
    const validArray = a => Array.isArray(a) && a.length === size * size && a.every(n => Number.isInteger(n) && n >= 0 && n <= size);
    if (!(g.difficulty in LEVELS) || !validArray(g.puzzle) || !validArray(g.board) || !validArray(g.solution) || g.solution.includes(0) || countSolutions(g.solution,size,1).count !== 1 || g.puzzle.some((v,i) => v && (v !== g.solution[i] || v !== g.board[i])) || countSolutions(g.puzzle,size).count !== 1 || !Array.isArray(g.notes) || g.notes.length !== size * size || !g.notes.every(n => Array.isArray(n) && n.every(v => Number.isInteger(v) && v > 0 && v <= size))) return false;
    game = g; elapsed = Number.isFinite(saved.elapsed) ? Math.max(0,saved.elapsed) : 0; hints = Number.isInteger(saved.hints) ? Math.max(0,saved.hints) : 0; sound = saved.sound === true;
    history = []; selected = g.puzzle.findIndex(v => !v); draftSize = size; $('difficulty').value = g.difficulty;
    document.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed',Number(b.dataset.size) === size));
    $('game-title').textContent = `Clássico ${size}×${size}`; $('level-label').textContent = LEVELS[g.difficulty]; $('clock').textContent = formatTime(elapsed); buildBoard();
    finished = g.board.every((v,i) => v === g.solution[i]);
    if (finished) showOverlay('Tudo no seu lugar.', `Partida concluída em ${formatTime(elapsed)}.`, 'Mais uma partida', '✳');
    else { paused = false; setPaused(true); }
    render(); message('Sua partida está aqui, do jeitinho que você deixou.'); return true;
  } catch { return false; }
}
if (!restore()) startGame();
updateSound();

import { useCallback, useEffect, useRef, useState } from 'react';
import Board from './components/Board.jsx';
import GameControls from './components/GameControls.jsx';
import Icon from './components/Icon.jsx';
import Settings from './components/Settings.jsx';
import { GameMotionProvider } from './components/GameMotion.jsx';
import { useSudoku } from './hooks/useSudoku.js';
import { useSound } from './hooks/useSound.js';
import { formatTime } from './game/state.js';
import { LEVELS } from './game/engine.js';

export default function App() {
  const {state,dispatch,startGame,saveFailed} = useSudoku();
  const {game,selected,paused,loading,finished,pencil,elapsed,hints,sound,feedback} = state;
  const [help,setHelp] = useState(false), [keyboard,setKeyboard] = useState(false);
  const latest = useRef(state);
  useEffect(() => { latest.current = state; }, [state]);
  useSound(sound,feedback);
  const replay = useCallback(() => startGame(game.size,game.difficulty), [startGame,game?.size,game?.difficulty]);
  useEffect(() => {
    const pointer = () => setKeyboard(false);
    const keydown = event => {
      setKeyboard(true);
      const current = latest.current, {game,selected} = current;
      if (!game || current.paused || current.loading || current.finished || event.altKey || event.target.closest('select,input,textarea') || (event.target.closest('button') && !event.target.closest('#board') && ['Enter',' '].includes(event.key))) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); dispatch({type:'UNDO'}); return; }
      if (event.ctrlKey || event.metaKey) return;
      const offsets = {ArrowRight:1,ArrowLeft:-1,ArrowDown:game.size,ArrowUp:-game.size};
      if (event.key in offsets) {
        event.preventDefault();
        const index = (Math.max(0,selected)+offsets[event.key]+game.board.length)%game.board.length;
        dispatch({type:'SELECT',index});
        requestAnimationFrame(() => document.querySelector(`#board [data-index="${index}"]`)?.focus({preventScroll:true}));
      } else if (/^[1-9]$/.test(event.key) && Number(event.key) <= game.size) { event.preventDefault(); dispatch({type:'ENTER',value:Number(event.key)}); }
      else if (['Backspace','Delete','0'].includes(event.key)) { event.preventDefault(); dispatch({type:'ERASE'}); }
      else if (event.key.toLowerCase() === 'n') { event.preventDefault(); dispatch({type:'PENCIL'}); }
    };
    document.addEventListener('pointerdown',pointer); document.addEventListener('keydown',keydown);
    return () => { document.removeEventListener('pointerdown',pointer); document.removeEventListener('keydown',keydown); };
  }, [dispatch]);
  const filled = game?.board.filter((v,i) => v && v === game.solution[i]).length || 0;
  return <GameMotionProvider preference={state.motionPreference}><div className={`app${keyboard ? ' keyboard-input' : ''}`}>
    <header className="header">
      <a className="brand" href="/" aria-label="Sasudoku, início"><span className="brand-symbol" aria-hidden="true">▦</span> sasudoku<span className="brand-dot">.</span></a>
      <div className="header-right"><span className="quiet-label">UM POUCO DE CALMA, UM POUCO DE LÓGICA.</span>
        <button id="sound" className="icon-button" aria-label={sound ? 'Desativar sons' : 'Ativar sons'} aria-pressed={sound} onClick={() => dispatch({type:'SOUND'})}><Icon name={sound ? 'sound' : 'muted'} /></button>
        <button id="help" className="icon-button" aria-label="Como jogar" aria-expanded={help} onClick={() => setHelp(!help)}><Icon name="help" /></button>
      </div>
    </header>
    <main>
      <section className="intro"><div><div className="eyebrow"><span /> SEU MOMENTO DE FOCO</div><h1>Um número de cada vez.</h1><p>Sem pressa. Só você e a próxima possibilidade.</p></div><div className="intro-note">Clássico na lógica.<br />Surpresa em cada acerto.<span aria-hidden="true">↙</span></div></section>
      {help && <section id="help-panel" className="help-panel"><strong>Um lugar para cada número.</strong><p>Preencha cada linha, coluna e bloco sem repetir números. No 6×6, use 1 a 6 em blocos de 3 colunas × 2 linhas. No 9×9, use 1 a 9 em blocos de 3×3. Selecione uma casa e um número. Use o lápis para testar possibilidades.</p><p>No teclado: setas para navegar, números para preencher, Backspace para apagar, N para anotar e Ctrl/Cmd + Z para desfazer. Tab entra e sai do tabuleiro.</p></section>}
      <div className="game-layout">
        <section className="play-area" aria-label="Partida de Sudoku">
          <div className="game-meta"><div><span className="live-dot" /><strong id="game-title">Clássico {game?.size || 9}×{game?.size || 9}</strong><span className="meta-separator">/</span><span id="level-label">{LEVELS[game?.difficulty || 'easy']}</span></div><div className="timer"><span id="clock">{formatTime(elapsed)}</span><button id="pause" className="icon-button small" disabled={!game || loading || finished} aria-label={paused ? 'Continuar partida' : 'Pausar partida'} onClick={() => dispatch({type:'PAUSE',value:!paused})}><Icon name={paused ? 'play' : 'pause'} /></button></div></div>
          <Board game={game} selected={selected} paused={paused} loading={loading} finished={finished} feedback={feedback} elapsed={finished ? elapsed : 0} hints={hints} dispatch={dispatch} onNewGame={replay} />
          <div className="board-caption"><span id="progress-label">{game ? `${filled} de ${game.size*game.size} casas preenchidas` : 'Preparando seu tabuleiro…'}</span><span id="note-status">{pencil ? 'LÁPIS ATIVO · ANOTE POSSIBILIDADES' : 'CADA CASA, UMA POSSIBILIDADE'}</span></div>
          <GameControls state={state} dispatch={dispatch} />
          <div id="message" role="status" aria-live="polite" className="message">{state.message}</div>
        </section>
        <Settings state={state} dispatch={dispatch} startGame={startGame} saveFailed={saveFailed} />
      </div>
    </main>
    <footer><span>Feito para exercitar a mente. E desacelerar.</span><span>SUDOKU, SIMPLES ASSIM.</span></footer>
  </div></GameMotionProvider>;
}

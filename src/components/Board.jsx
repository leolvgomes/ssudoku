import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useGameMotion } from './GameMotion.jsx';
import { config, peers } from '../game/engine.js';
import { formatTime } from '../game/state.js';
import FeedbackLayer, { easeOut } from './FeedbackLayer.jsx';

function Cell({ game, index, selected, related, selectedValue, event, dispatch, disabled }) {
  const reduced = useGameMotion();
  const { size, puzzle, board, notes, solution } = game;
  const { boxRows, boxCols } = config(size);
  const row = Math.floor(index/size), col = index%size, value = board[index];
  const wrong = Boolean(value && value !== solution[index]);
  const classes = ['cell', (col+1)%boxCols === 0 && 'box-right', (row+1)%boxRows === 0 && 'box-bottom', col === size-1 && 'last-col', row === size-1 && 'last-row', related && 'related', value && value === selectedValue && 'same', selected && 'selected', value && !puzzle[index] && 'entered', wrong && 'error'].filter(Boolean).join(' ');
  const pop = event?.index === index;
  const label = `Linha ${row+1}, coluna ${col+1}, ${value ? value + (puzzle[index] ? ', fixo' : wrong ? ', incorreto' : '') : 'vazia' + (notes[index].length ? ', anotações ' + notes[index].join(', ') : '')}`;
  return <button className={classes} role="gridcell" data-index={index} tabIndex={selected ? 0 : -1}
    aria-selected={selected} aria-readonly={Boolean(puzzle[index])} aria-label={label}
    onClick={() => !disabled && dispatch({type:'SELECT',index})} onFocus={() => !disabled && !selected && dispatch({type:'SELECT',index})}>
    {value ? <motion.span key={`${value}-${pop ? event.id : 'static'}`} className="digit" initial={false}
      animate={pop ? reduced ? {opacity:[.45,1]} : {transform:['scale(.9)','scale(1.35)','scale(1)'],opacity:[.5,1,1]} : {opacity:1,transform:'scale(1)'}}
      transition={{duration:.25,ease:easeOut}}>{value}</motion.span> : notes[index].length > 0 ? <span className="notes-grid" aria-hidden="true">
        {Array.from({length:size},(_,n) => <span key={n}>{notes[index].includes(n+1) ? n+1 : ''}</span>)}
      </span> : null}
  </button>;
}

export default memo(function Board({ game, selected, paused, loading, finished, feedback, elapsed, hints, dispatch, onNewGame }) {
  const reduced = useGameMotion();
  const [showWin,setShowWin] = useState(finished && !feedback?.win);
  useEffect(() => {
    if (!finished) { setShowWin(false); return; }
    if (!feedback?.win) { setShowWin(true); return; }
    const timeout = setTimeout(() => setShowWin(true),reduced ? 200 : 1100);
    return () => clearTimeout(timeout);
  }, [finished,feedback,reduced]);
  const overlay = loading ? {title:'Preparando seu momento.',text:'Criando uma partida com solução única…',symbol:'▦'}
    : showWin && finished ? {title:'Tudo no seu lugar.',text:`Você concluiu em ${formatTime(elapsed)}${hints ? `, com ${hints} dica${hints > 1 ? 's' : ''}` : ', sem dicas'}. Que tal guardar essa sensação?`,symbol:'✳',action:'Mais uma partida'}
    : paused ? {title:'Uma pausa faz bem.',text:'Seu jogo espera por você.',symbol:'Ⅱ',action:'Continuar partida'}
    : !game ? {title:'Vamos tentar de novo?',text:'Toque em Novo jogo para criar o tabuleiro.',symbol:'↻'} : null;
  const related = new Set(game && selected >= 0 ? peers(selected,game.size) : []);
  const activeEvent = paused || loading ? null : feedback;
  const impact = activeEvent && !reduced ? activeEvent.wrong ? ['translateX(0)','translateX(-4px)','translateX(4px)','translateX(-2px)','translateX(0)'] : ['translateY(0)','translateY(2px) scale(.996)','translateY(-1px)','translateY(0)'] : 'translateY(0)';
  return <motion.div className="board-wrap" animate={{transform:impact}} transition={{duration:.25,ease:easeOut}}>
    <div id="board" className={`board${overlay ? ' obscured' : ''}`} role="grid" aria-label="Tabuleiro de Sudoku" aria-rowcount={game?.size} aria-colcount={game?.size} data-size={game?.size} style={{'--size':game?.size || 9}}>
      {game && Array.from({length:game.size},(_,row) => <div key={row} role="row" style={{display:'contents'}}>
        {Array.from({length:game.size},(_,col) => {
          const index = row*game.size+col;
          return <Cell key={index} game={game} index={index} selected={index === selected} related={related.has(index)} selectedValue={game.board[selected]} event={activeEvent} dispatch={dispatch} disabled={paused || loading || finished} />;
        })}
      </div>)}
    </div>
    <AnimatePresence initial={false}>
      {overlay && <motion.div key="overlay" id="board-overlay" className="board-overlay"
        initial={{opacity:0,transform:reduced ? 'scale(1)' : 'scale(.97)'}} animate={{opacity:1,transform:'scale(1)'}} exit={{opacity:0,transform:reduced ? 'scale(1)' : 'scale(.97)'}} transition={{duration:.2,ease:easeOut}}>
        <span id="overlay-icon" className="overlay-icon">{overlay.symbol}</span>
        <h2 id="overlay-title">{overlay.title}</h2><p id="overlay-text">{overlay.text}</p>
        {overlay.action && <button id="resume" className="primary" onClick={() => finished ? onNewGame() : dispatch({type:'PAUSE',value:false})}>{overlay.action}</button>}
      </motion.div>}
    </AnimatePresence>
    {activeEvent && game && <FeedbackLayer key={activeEvent.id} event={activeEvent} game={game} />}
  </motion.div>;
});

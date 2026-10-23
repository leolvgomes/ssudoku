import { useState } from 'react';
import { LEVELS } from '../game/engine.js';

export default function Settings({ state, dispatch, startGame, saveFailed }) {
  const [size,setSize] = useState(state.game?.size || 9);
  const [difficulty,setDifficulty] = useState(state.game?.difficulty || 'easy');
  const [confirm,setConfirm] = useState(false);
  function start() { setConfirm(false); startGame(size,difficulty); }
  return <aside className="sidebar">
    <section className="settings">
      <div className="section-heading"><span className="eyebrow">DO SEU JEITO</span><span className="tiny-grid" aria-hidden="true">▦</span></div>
      <h2>Uma nova perspectiva.</h2><p>Escolha seu próximo desafio.</p><span className="field-label">TABULEIRO</span>
      <div className="segmented" role="group" aria-label="Tamanho do próximo tabuleiro">
        {[6,9].map(n => <button key={n} data-size={n} disabled={state.loading} aria-pressed={size === n} onClick={() => setSize(n)}>{n} × {n}<span>{n === 6 ? 'Um respiro' : 'O clássico'}</span></button>)}
      </div>
      <label className="field-label" htmlFor="difficulty">DIFICULDADE</label>
      <select id="difficulty" disabled={state.loading} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
        {Object.entries(LEVELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <div className="motion-settings">
        <label className="field-label" htmlFor="motion-preference">ANIMAÇÕES</label>
        <select id="motion-preference" value={state.motionPreference} onChange={e => dispatch({type:'MOTION',value:e.target.value})}>
          <option value="system">Seguir o sistema</option><option value="full">Completas</option><option value="reduced">Suaves</option>
        </select>
      </div>
      <button id="new-game" className="primary" disabled={state.loading} onClick={() => state.game && !state.finished ? setConfirm(true) : start()}>Novo jogo <span aria-hidden="true">↗</span></button>
      {confirm && <div id="confirm-new" className="confirm-new"><p>Começar de novo? A partida atual será substituída.</p><button id="cancel-new" onClick={() => setConfirm(false)}>Continuar atual</button><button id="confirm-start" className="primary" onClick={start}>Começar</button></div>}
      <span className="unique-note">Uma partida inédita. Uma solução única.</span>
    </section>
    <section className="little-note"><span className="note-spark" aria-hidden="true">✳</span><h3>Menos ruído.<br />Mais “consegui”.</h3><p>Ative o som para ouvir cada peça se encaixar.</p><button id="sound-note" onClick={() => dispatch({type:'SOUND'})}>{state.sound ? 'Sons ativados' : 'Experimentar o som'} <span aria-hidden="true">↗</span></button></section>
    <div className="autosave"><span />{saveFailed ? 'O navegador não permitiu salvar esta partida.' : 'Seu progresso fica salvo neste navegador.'}</div>
  </aside>;
}

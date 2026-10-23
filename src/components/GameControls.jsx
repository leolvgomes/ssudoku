import Icon from './Icon.jsx';

export default function GameControls({ state, dispatch }) {
  const { game, paused, loading, finished, pencil, history } = state;
  const disabled = !game || paused || loading || finished;
  return <>
    <div id="number-pad" className="number-pad" aria-label="Escolher número" style={{'--size':game?.size || 9}}>
      {game && Array.from({length:game.size},(_,n) => {
        const value = n+1, remaining = game.size-game.board.filter((v,i) => v === value && v === game.solution[i]).length;
        return <button key={value} className={`number-key${remaining === 0 ? ' complete' : ''}`} disabled={disabled} aria-label={`Número ${value}, ${remaining} restantes`} onClick={() => dispatch({type:'ENTER',value})}>
          {value}<small>{remaining === 0 ? '✓' : remaining}</small>
        </button>;
      })}
    </div>
    <div className="tools">
      {[['undo','Desfazer','UNDO'],['erase','Apagar','ERASE'],['notes','Anotar','PENCIL'],['hint','Dica','HINT']].map(([id,label,type]) => <button key={id} id={id} disabled={disabled || id === 'undo' && !history.length} aria-pressed={id === 'notes' ? pencil : undefined} onClick={() => dispatch({type})}>
        <Icon name={id} /><span>{label}{id === 'notes' && pencil && <em id="notes-badge">ON</em>}</span>
      </button>)}
    </div>
  </>;
}

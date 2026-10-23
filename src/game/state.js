import { completedUnits, peers } from './engine.js';

export const initialState = {
  game: null, selected: -1, pencil: false, paused: false, loading: false,
  finished: false, elapsed: 0, hints: 0, sound: false, motionPreference: 'system', history: [],
  message: 'Encontre seu ritmo. O resto vem.', feedback: null, feedbackId: 0,
};
export const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const blocked = state => !state.game || state.paused || state.loading || state.finished;
const snapshot = state => [...state.history, { board: state.game.board, notes: state.game.notes }].slice(-100);

function enter(state, value, index = state.selected, hint = false) {
  if (blocked(state) || index < 0 || index >= state.game.board.length || state.game.puzzle[index]) return state;
  const { game } = state;
  if (!Number.isInteger(value) || value < 0 || value > game.size) return state;
  const notes = game.notes.map(n => [...n]);
  if (state.pencil && value && !hint) {
    if (game.board[index]) return state;
    notes[index] = notes[index].includes(value) ? notes[index].filter(n => n !== value) : [...notes[index], value].sort();
    return { ...state, game: { ...game, notes }, history: snapshot(state), feedback: null };
  }
  if (game.board[index] === value && (value || !notes[index].length)) return state;
  const board = [...game.board]; board[index] = value; notes[index] = [];
  const wrong = Boolean(value && value !== game.solution[index]);
  if (value && !wrong) for (const peer of peers(index, game.size)) notes[peer] = notes[peer].filter(n => n !== value);
  const before = new Set(completedUnits(game.board, game.solution, game.size).map(unit => unit.join(',')));
  const units = completedUnits(board, game.solution, game.size).filter(unit => !before.has(unit.join(',')));
  const countValue = values => values.filter((v, i) => v === value && v === game.solution[i]).length;
  const numberComplete = Boolean(value && !wrong && countValue(game.board) < game.size && countValue(board) === game.size);
  const finished = board.every((v, i) => v === game.solution[i]);
  let message = wrong ? 'Esse número ainda não se encaixa. Você pode tentar outro.' : value ? hint ? 'Uma ajudinha. Agora é com você.' : 'Um passo de cada vez.' : 'Espaço para uma nova ideia.';
  if (units.length) message = 'Encaixou. Uma parte do desafio concluída!';
  if (numberComplete) message = `Todos os ${value} no lugar. Mais uma conquista!`;
  if (finished) message = 'Conseguiu. Essa é a sensação.';
  const feedbackId = state.feedbackId + 1;
  return {
    ...state, game: { ...game, board, notes }, selected: index,
    hints: state.hints + Number(hint), history: snapshot(state), finished, message, feedbackId,
    feedback: value ? { id: feedbackId, index, value, wrong, units, numberComplete, win: finished } : null,
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'GENERATE': return { ...state, loading: true, feedback: null };
    case 'GENERATED': {
      const game = { ...action.game, board: [...action.game.puzzle], notes: action.game.puzzle.map(() => []) };
      return { ...initialState, sound: state.sound, motionPreference: state.motionPreference, game, selected: game.puzzle.findIndex(v => !v), message: 'Um novo começo. Encontre seu ritmo.' };
    }
    case 'GENERATION_FAILED': return { ...state, loading: false, paused: Boolean(state.game), message: 'Não foi possível criar a partida. Toque em Novo jogo para tentar novamente.' };
    case 'SELECT': return blocked(state) ? state : { ...state, selected: action.index };
    case 'ENTER': return enter(state, action.value);
    case 'ERASE': return enter(state, 0);
    case 'HINT': {
      if (blocked(state)) return state;
      let index = state.selected;
      if (index < 0 || state.game.puzzle[index] || state.game.board[index] === state.game.solution[index]) index = state.game.board.findIndex((v,i) => v !== state.game.solution[i]);
      return index >= 0 ? enter(state, state.game.solution[index], index, true) : state;
    }
    case 'PENCIL': return blocked(state) ? state : { ...state, pencil: !state.pencil, message: !state.pencil ? 'Lápis ativo. Anote as possibilidades.' : 'Lápis guardado. Hora de preencher.' };
    case 'UNDO': {
      if (blocked(state) || !state.history.length) return state;
      return { ...state, game: { ...state.game, ...state.history.at(-1) }, history: state.history.slice(0,-1), feedback: null, message: 'Um passo atrás também faz parte.' };
    }
    case 'PAUSE': return !state.game || state.loading || state.finished ? state : { ...state, paused: action.value, feedback: null };
    case 'SOUND': return { ...state, sound: !state.sound };
    case 'MOTION': return ['system','full','reduced'].includes(action.value) ? { ...state, motionPreference: action.value, feedback: null } : state;
    case 'TICK': return blocked(state) ? state : { ...state, elapsed: state.elapsed + action.seconds };
    default: return state;
  }
}

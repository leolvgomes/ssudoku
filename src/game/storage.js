import { config, countSolutions, LEVELS } from './engine.js';
import { initialState } from './state.js';

export const storageKey = 'sasudoku:v1';
// The original save format stays compatible across the React migration.
export function restoreState(raw) {
  try {
    const saved = JSON.parse(raw);
    if (!saved) return initialState;
    const g = saved.game, size = g.size; config(size);
    const valid = a => Array.isArray(a) && a.length === size * size && a.every(n => Number.isInteger(n) && n >= 0 && n <= size);
    if (!(g.difficulty in LEVELS) || !valid(g.puzzle) || !valid(g.board) || !valid(g.solution) || g.solution.includes(0) || countSolutions(g.solution,size,1).count !== 1 || g.puzzle.some((v,i) => v && (v !== g.solution[i] || v !== g.board[i])) || countSolutions(g.puzzle,size).count !== 1 || !Array.isArray(g.notes) || g.notes.length !== size * size || !g.notes.every(n => Array.isArray(n) && n.every(v => Number.isInteger(v) && v > 0 && v <= size))) return initialState;
    const finished = g.board.every((v,i) => v === g.solution[i]);
    return {
      ...initialState, game: g, paused: !finished, finished,
      selected: g.puzzle.findIndex(v => !v),
      elapsed: Number.isFinite(saved.elapsed) ? Math.max(0,saved.elapsed) : 0,
      hints: Number.isInteger(saved.hints) ? Math.max(0,saved.hints) : 0,
      sound: saved.sound === true,
      motionPreference: ['system','full','reduced'].includes(saved.motionPreference) ? saved.motionPreference : 'system',
      message: 'Sua partida está aqui, do jeitinho que você deixou.',
    };
  } catch { return initialState; }
}
export function serializeState(state) {
  return JSON.stringify({ game: state.game, elapsed: state.elapsed, hints: state.hints, sound: state.sound, motionPreference: state.motionPreference });
}

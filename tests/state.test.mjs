import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, peers } from '../src/game/engine.js';
import { gameReducer, initialState } from '../src/game/state.js';
import { restoreState, serializeState } from '../src/game/storage.js';

const start = () => gameReducer(initialState,{type:'GENERATED',game:generate(6,'easy')});
test('pencil, erase and undo preserve immutable board snapshots', () => {
  let state = start(), original = state.game;
  state = gameReducer(state,{type:'PENCIL'});
  state = gameReducer(state,{type:'ENTER',value:2});
  assert.deepEqual(state.game.notes[state.selected],[2]);
  assert.deepEqual(original.notes[state.selected],[]);
  state = gameReducer(state,{type:'ERASE'});
  assert.deepEqual(state.game.notes[state.selected],[]);
  state = gameReducer(state,{type:'UNDO'});
  assert.deepEqual(state.game.notes[state.selected],[2]);
  state = gameReducer(state,{type:'UNDO'});
  assert.deepEqual(state.game.notes[state.selected],[]);
});
test('hints fill a value while pencil is active and remove matching peer notes; undo restores them', () => {
  let state = start();
  const i = state.game.board.findIndex((v,index) => !v && peers(index,6).some(j => !state.game.board[j]));
  state = gameReducer(state,{type:'SELECT',index:i});
  const value = state.game.solution[i];
  const peer = peers(i,6).find(j => !state.game.board[j]);
  assert.notEqual(peer,undefined);
  state = gameReducer(state,{type:'SELECT',index:peer});
  state = gameReducer(state,{type:'PENCIL'});
  state = gameReducer(state,{type:'ENTER',value});
  state = gameReducer(state,{type:'SELECT',index:i});
  state = gameReducer(state,{type:'HINT'});
  assert.equal(state.game.board[i],value); assert.equal(state.hints,1);
  assert.deepEqual(state.game.notes[peer],[]);
  state = gameReducer(state,{type:'UNDO'});
  assert.equal(state.game.board[i],0); assert.deepEqual(state.game.notes[peer],[value]);
});
test('fixed clues, pauses, loading and finished games reject edits', () => {
  const state = start();
  const fixed = state.game.puzzle.findIndex(Boolean);
  const selected = gameReducer(state,{type:'SELECT',index:fixed});
  assert.equal(gameReducer(selected,{type:'ENTER',value:1}),selected);
  for (const flag of ['paused','loading','finished']) {
    const blocked = {...state,[flag]:true};
    for (const action of [{type:'ENTER',value:1},{type:'HINT'},{type:'ERASE'},{type:'PENCIL'},{type:'TICK',seconds:2}]) assert.equal(gameReducer(blocked,action),blocked);
  }
});
test('completion emits number, unit and victory feedback atomically', () => {
  let state = start();
  const i = state.selected;
  state = {...state,game:{...state.game,board:state.game.solution.map((v,j) => j === i ? 0 : v)}};
  state = gameReducer(state,{type:'ENTER',value:state.game.solution[i]});
  assert.equal(state.finished,true); assert.equal(state.feedback.win,true);
  assert.equal(state.feedback.numberComplete,true); assert.equal(state.feedback.units.length,3);
});
test('incorrect values are marked without completion and can be undone', () => {
  let state = start();
  const original = state.game.board;
  state = gameReducer(state,{type:'ENTER',value:state.game.solution[state.selected] % 6 + 1});
  assert.equal(state.feedback.wrong,true); assert.equal(state.feedback.numberComplete,false);
  state = gameReducer(state,{type:'UNDO'}); assert.deepEqual(state.game.board,original); assert.equal(state.feedback,null);
});
test('original save format restores board, notes, sound and time, paused', () => {
  let state = start();
  state = gameReducer(state,{type:'PENCIL'});
  state = gameReducer(state,{type:'ENTER',value:3});
  state = {...state,sound:true,elapsed:73,hints:2};
  const restored = restoreState(serializeState(state));
  assert.deepEqual(restored.game,state.game); assert.equal(restored.paused,true);
  assert.equal(restored.sound,true); assert.equal(restored.elapsed,73); assert.equal(restored.hints,2);
  assert.deepEqual(restored.history,[]);
});
test('corrupt storage falls back safely and completed saves stay completed', () => {
  assert.equal(restoreState('{'),initialState);
  assert.equal(restoreState(JSON.stringify({game:{size:6}})),initialState);
  let state = start();
  const corrupt = {...state,game:{...state.game,board:[...state.game.board]}};
  const fixed = corrupt.game.puzzle.findIndex(Boolean); corrupt.game.board[fixed] = 0;
  assert.equal(restoreState(serializeState(corrupt)),initialState);
  state = {...state,game:{...state.game,board:state.game.solution}};
  const restored = restoreState(serializeState(state));
  assert.equal(restored.finished,true); assert.equal(restored.paused,false);
});
test('animation preference survives saves and new games and invalid values are rejected', () => {
  let state = gameReducer(start(),{type:'MOTION',value:'full'});
  assert.equal(restoreState(serializeState(state)).motionPreference,'full');
  state = gameReducer(state,{type:'GENERATED',game:generate(6,'easy')});
  assert.equal(state.motionPreference,'full');
  assert.equal(gameReducer(state,{type:'MOTION',value:'invalid'}),state);
  const legacy = JSON.parse(serializeState(state)); delete legacy.motionPreference;
  assert.equal(restoreState(JSON.stringify(legacy)).motionPreference,'system');
});

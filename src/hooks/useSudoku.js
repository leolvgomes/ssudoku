import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { gameReducer, initialState } from '../game/state.js';
import { restoreState, serializeState, storageKey } from '../game/storage.js';

export function useSudoku() {
  const [state, dispatch] = useReducer(gameReducer, null, () => {
    try { const restored = restoreState(localStorage.getItem(storageKey)); return { ...restored, loading: !restored.game }; }
    catch { return { ...initialState, loading: true }; }
  });
  const latest = useRef(state), workerRef = useRef(null);
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => { latest.current = state; }, [state]);
  const startGame = useCallback((size, difficulty) => {
    workerRef.current?.terminate();
    dispatch({ type: 'GENERATE' });
    try {
      const worker = new Worker(new URL('../game/generator.js', import.meta.url), { type: 'module' });
      workerRef.current = worker;
      const fail = () => {
        if (workerRef.current !== worker) return;
        worker.terminate(); workerRef.current = null; dispatch({ type: 'GENERATION_FAILED' });
      };
      worker.onerror = fail;
      worker.onmessage = ({ data }) => {
        if (workerRef.current !== worker) return;
        if (data.error) { fail(); return; }
        worker.terminate(); workerRef.current = null;
        dispatch({ type: 'GENERATED', game: data.game });
      };
      worker.postMessage({ size, difficulty });
    } catch { dispatch({ type: 'GENERATION_FAILED' }); }
  }, []);
  useEffect(() => {
    if (!latest.current.game) startGame(9, 'easy');
    return () => { workerRef.current?.terminate(); workerRef.current = null; };
  }, [startGame]);
  useEffect(() => {
    const save = () => {
      if (!latest.current.game) return;
      try { localStorage.setItem(storageKey, serializeState(latest.current)); setSaveFailed(false); }
      catch { setSaveFailed(true); }
    };
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(), seconds = (now - previous) / 1000; previous = now;
      if (!document.hidden) dispatch({ type: 'TICK', seconds });
    }, 250);
    const autosave = setInterval(save, 5000);
    const visibility = () => {
      previous = performance.now();
      if (document.hidden) { dispatch({ type: 'PAUSE', value: true }); save(); }
    };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', visibility);
    return () => { clearInterval(timer); clearInterval(autosave); window.removeEventListener('pagehide',save); document.removeEventListener('visibilitychange',visibility); };
  }, []);
  useEffect(() => {
    if (!state.game) return;
    try { localStorage.setItem(storageKey, serializeState(state)); setSaveFailed(false); }
    catch { setSaveFailed(true); }
  }, [state.game, state.sound, state.motionPreference, state.hints, state.finished, state.paused]);
  return { state, dispatch, startGame, saveFailed };
}

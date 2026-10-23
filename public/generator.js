import { generate } from './engine.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ game: generate(data.size, data.difficulty) }); }
  catch { self.postMessage({ error: 'Não foi possível criar a partida. Tente novamente.' }); }
};

export const LEVELS = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil', expert: 'Impossível' };
export function config(size) {
  if (size !== 6 && size !== 9) throw new Error('Tamanho inválido');
  return { size, boxRows: size === 6 ? 2 : 3, boxCols: 3 };
}
export function peers(index, size) {
  const { boxRows, boxCols } = config(size);
  const row = Math.floor(index / size), col = index % size;
  const result = new Set();
  for (let n = 0; n < size; n++) { result.add(row * size + n); result.add(n * size + col); }
  for (let r = 0; r < boxRows; r++) for (let c = 0; c < boxCols; c++) result.add((row - row % boxRows + r) * size + col - col % boxCols + c);
  result.delete(index);
  return [...result];
}
function shuffled(values, random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
export function countSolutions(input, size, limit = 2, random = null) {
  config(size);
  if (input.length !== size * size || input.some(v => !Number.isInteger(v) || v < 0 || v > size)) return { count: 0, solution: null };
  const board = [...input], neighbors = board.map((_, i) => peers(i, size));
  if (board.some((v, i) => v && neighbors[i].some(j => board[j] === v))) return { count: 0, solution: null };
  let count = 0, solution = null;
  function visit() {
    let index = -1, options = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i]) continue;
      const used = new Set(neighbors[i].map(j => board[j]));
      const available = Array.from({ length: size }, (_, n) => n + 1).filter(v => !used.has(v));
      if (!available.length) return;
      if (index === -1 || available.length < options.length) { index = i; options = available; }
      if (options.length === 1) break;
    }
    if (index === -1) { count++; solution ??= [...board]; return; }
    for (const value of random ? shuffled(options, random) : options) {
      board[index] = value; visit();
      if (count >= limit) break;
    }
    board[index] = 0;
  }
  visit();
  return { count, solution };
}
export function generate(size = 9, difficulty = 'easy', random = Math.random) {
  config(size);
  if (!(difficulty in LEVELS)) throw new Error('Dificuldade inválida');
  const { solution } = countSolutions(Array(size * size).fill(0), size, 1, random);
  const puzzle = [...solution];
  const ratios = size === 9 ? { easy: .53, medium: .43, hard: .34, expert: .28 } : { easy: .55, medium: .44, hard: .34, expert: .28 };
  const target = Math.ceil(size * size * ratios[difficulty]);
  let clues = puzzle.length;
  for (const index of shuffled(puzzle.keys(), random)) {
    if (clues <= target) break;
    const old = puzzle[index]; puzzle[index] = 0;
    if (countSolutions(puzzle, size).count !== 1) puzzle[index] = old;
    else clues--;
  }
  return { size, difficulty, puzzle, solution };
}
export function completedUnits(board, solution, size) {
  const { boxRows, boxCols } = config(size), units = [];
  for (let i = 0; i < size; i++) {
    units.push(Array.from({ length: size }, (_, n) => i * size + n));
    units.push(Array.from({ length: size }, (_, n) => n * size + i));
  }
  for (let r = 0; r < size; r += boxRows) for (let c = 0; c < size; c += boxCols) {
    units.push(Array.from({ length: size }, (_, n) => (r + Math.floor(n / boxCols)) * size + c + n % boxCols));
  }
  return units.filter(unit => unit.every(i => board[i] === solution[i]));
}

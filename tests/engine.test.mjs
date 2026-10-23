import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, countSolutions, peers, completedUnits, LEVELS } from '../src/game/engine.js';

function seeded(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
for (const size of [6,9]) for (const difficulty of Object.keys(LEVELS)) {
  test(`${size}×${size} ${difficulty}: valid puzzle, preserved clues and one solution`, () => {
    for (let seed = 1; seed <= 4; seed++) {
      const { puzzle, solution } = generate(size,difficulty,seeded(seed));
      assert.equal(solution.length,size * size);
      for (let i = 0; i < solution.length; i++) {
        assert.ok(solution[i] >= 1 && solution[i] <= size);
        assert.ok(peers(i,size).every(j => solution[i] !== solution[j]));
        if (puzzle[i]) assert.equal(puzzle[i],solution[i]);
      }
      const result = countSolutions(puzzle,size);
      assert.equal(result.count,1); assert.deepEqual(result.solution,solution);
      assert.ok(puzzle.includes(0));
      assert.equal(completedUnits(solution,solution,size).length, size * 3);
      assert.equal(completedUnits(Array(size * size).fill(0),solution,size).length,0);
    }
  });
}
test('solver rejects duplicate clues and invalid values',() => {
  const board = Array(36).fill(0); board[0] = board[1] = 1;
  assert.equal(countSolutions(board,6).count,0);
  board[1] = 7; assert.equal(countSolutions(board,6).count,0);
  assert.equal(countSolutions([],6).count,0);
  assert.throws(() => generate(4));
});
test('6×6 blocks have two rows and three columns',() => {
  const related = peers(0,6);
  assert.ok(related.includes(8)); assert.ok(!related.includes(9)); assert.ok(!related.includes(14));
});
test('random seeds generate different boards',() => {
  assert.notDeepEqual(generate(9,'easy',seeded(1)).puzzle,generate(9,'easy',seeded(2)).puzzle);
});

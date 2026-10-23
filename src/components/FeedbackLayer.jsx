import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useGameMotion } from './GameMotion.jsx';

export const easeOut = [.23, 1, .32, 1];

function Burst({ x, y, count, distance, delay, seed }) {
  return Array.from({ length: count }, (_, n) => {
    const angle = n / count * Math.PI * 2, reach = distance * (.65 + ((n * 17 + seed * 13) % 35) / 100);
    const dx = Math.cos(angle) * reach, dy = Math.sin(angle) * reach;
    return <motion.span key={n} className={`spark ${n % 3 === 0 ? 'spark-star' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, backgroundColor: ['#8da879','#cd885f','#d7ba79','#57795c'][n % 4] }}
      initial={{ opacity: 0, transform: 'translate(-50%, -50%) scale(.9)' }}
      animate={{ opacity: [0,1,0], transform: [
        'translate(-50%, -50%) scale(.9)',
        `translate(calc(-50% + ${dx * .35}px), calc(-50% + ${dy * .35}px)) rotate(45deg)`,
        `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 24}px)) rotate(160deg) scale(.9)`,
      ] }} transition={{ duration: .65, delay, times: [0,.2,1], ease: easeOut }} />;
  });
}

export default function FeedbackLayer({ event, game }) {
  const reduced = useGameMotion();
  const [active, setActive] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => setActive(false), 1900);
    return () => clearTimeout(timeout);
  }, []);
  if (!event || !active) return null;
  const { size, board, solution } = game;
  const tiles = new Map();
  const bursts = [];
  const center = index => ({ x: (index % size + .5) / size * 100, y: (Math.floor(index / size) + .5) / size * 100 });
  const burst = (index, count, distance, delay = 0) => bursts.push({ ...center(index), count, distance, delay });
  if (event.win) {
    board.forEach((value,index) => tiles.set(index, { value, type:'wave', delay:(Math.floor(index / size) + index % size) * .04 }));
    for (const [x,y] of [[20,25],[80,30],[50,55],[25,80],[80,75]]) bursts.push({x,y,count:22,distance:120,delay:.25+(x+y)*.0022});
    bursts.push({x:20,y:35,count:24,distance:120,delay:1.1},{x:80,y:35,count:24,distance:120,delay:1.1});
  } else {
    if (!event.wrong) burst(event.index,5,26);
    for (const index of new Set(event.units.flat())) {
      const distance = Math.abs(Math.floor(index / size) - Math.floor(event.index / size)) + Math.abs(index % size - event.index % size);
      tiles.set(index,{value:board[index],type:'wave',delay:distance*.04});
    }
    for (const unit of event.units) burst(unit[Math.floor(unit.length / 2)],12,75,.16);
    if (event.numberComplete) {
      const indices = board.flatMap((v,i) => v === event.value && v === solution[i] ? [i] : []);
      indices.forEach((index,n) => tiles.set(index,{value:event.value,type:'number',delay:n*.04}));
      burst(indices[Math.floor(indices.length / 2)],18,95,.12);
    }
  }
  return <div className="effects-layer" aria-hidden="true">
    {[...tiles].map(([index,tile]) => <motion.span key={index} className={`effect-tile effect-${tile.type}`}
      style={{ left:`calc(${index % size / size * 100}% + 3px)`, top:`calc(${Math.floor(index / size) / size * 100}% + 3px)`, width:`calc(${100 / size}% - 6px)`, height:`calc(${100 / size}% - 6px)`, fontSize:size === 6 ? 36 : undefined }}
      initial={{ opacity:0, transform:reduced ? 'scale(1)' : 'translateY(0) scale(.96)' }}
      animate={reduced ? {opacity:[0,.8,0]} : {opacity:[0,1,0],transform:['translateY(0) scale(.96)',`translateY(-${tile.type === 'number' ? 12 : 7}px) scale(${tile.type === 'number' ? 1.3 : 1.16})`,'translateY(0) scale(1)']}}
      transition={{ duration:reduced ? .2 : .5, delay:reduced ? 0 : tile.delay, times:[0,.35,1], ease:easeOut }}>
      {tile.value}
    </motion.span>)}
    {!reduced && bursts.map((props,n) => <Burst key={n} {...props} seed={event.id+n} />)}
  </div>;
}

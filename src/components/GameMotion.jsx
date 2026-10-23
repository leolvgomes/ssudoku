import { createContext, useContext } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';

const MotionPreference = createContext('system');
export function GameMotionProvider({ preference, children }) {
  return <MotionPreference.Provider value={preference}>
    <MotionConfig reducedMotion={preference === 'full' ? 'never' : preference === 'reduced' ? 'always' : 'user'}>{children}</MotionConfig>
  </MotionPreference.Provider>;
}
export function useGameMotion() {
  const systemReduced = useReducedMotion(), preference = useContext(MotionPreference);
  return preference === 'full' ? false : preference === 'reduced' ? true : systemReduced;
}

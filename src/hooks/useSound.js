import { useEffect, useRef } from 'react';

export function useSound(sound, feedback) {
  const audio = useRef(null), previousSound = useRef(sound), lastFeedback = useRef(null);
  useEffect(() => {
    const toggled = sound && !previousSound.current;
    previousSound.current = sound;
    if (!sound || (!toggled && (!feedback || feedback === lastFeedback.current))) return;
    lastFeedback.current = feedback;
    try {
      audio.current ??= new (window.AudioContext || window.webkitAudioContext)();
      const context = audio.current; void context.resume();
      const frequencies = feedback?.win ? [523,659,784,1047] : toggled || feedback?.units.length || feedback?.numberComplete ? [523,659,784] : [feedback?.wrong ? 155 : 300 + (feedback?.value || 1)*32];
      frequencies.forEach((frequency,n) => {
        const oscillator = context.createOscillator(), gain = context.createGain(), start = context.currentTime + n*.09;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0,start); gain.gain.linearRampToValueAtTime(.055,start+.008); gain.gain.exponentialRampToValueAtTime(.001,start+.18);
        oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start+.2);
      });
    } catch { /* Audio is optional. */ }
  }, [sound, feedback]);
  useEffect(() => () => { void audio.current?.close(); audio.current = null; }, []);
}

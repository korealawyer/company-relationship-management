import confetti from 'canvas-confetti';
import { useState, useCallback } from 'react';

export function useCelebration() {
  const [isCelebrationActive, setIsCelebrationActive] = useState(false);

  const triggerCelebration = useCallback(() => {
    setIsCelebrationActive(true);

    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#c9a84c', '#e8c87a', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        disableForReducedMotion: true,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const closeCelebration = useCallback(() => {
    setIsCelebrationActive(false);
  }, []);

  return {
    isCelebrationActive,
    triggerCelebration,
    closeCelebration,
  };
}

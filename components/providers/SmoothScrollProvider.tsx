'use client';

import { ReactLenis } from 'lenis/react';
import { useEffect, useState } from 'react';

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [isTv, setIsTv] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.userAgent.includes('VouxaTV')) {
      setIsTv(true);
    }
  }, []);

  if (isTv) {
    return <>{children}</>;
  }

  return (
    <ReactLenis 
      root 
      options={{
        lerp: 0.08, // Smooth linear interpolation for guaranteed 60fps
        duration: 1.5,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 2.0,
      }}
    >
      {children}
    </ReactLenis>
  );
}

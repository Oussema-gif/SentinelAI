import { useEffect, useState } from "react";

import "./LightningFlash.css";

interface LightningFlashProps {
  active: boolean;
  critical: boolean;
  reducedMotion?: boolean;
}

export function LightningFlash({
  active,
  critical,
  reducedMotion = false,
}: LightningFlashProps) {
  const [flashIndex, setFlashIndex] = useState(0);

  useEffect(() => {
    if (!active || !critical || reducedMotion) {
      setFlashIndex(0);
      return;
    }

    const firstFlash = window.setTimeout(() => {
      setFlashIndex(1);
    }, 420);

    const secondFlash = window.setTimeout(() => {
      setFlashIndex(2);
    }, 1_180);

    const clearFlash = window.setTimeout(() => {
      setFlashIndex(0);
    }, 1_520);

    return () => {
      window.clearTimeout(firstFlash);
      window.clearTimeout(secondFlash);
      window.clearTimeout(clearFlash);
    };
  }, [active, critical, reducedMotion]);

  if (!active || !critical || reducedMotion || flashIndex === 0) {
    return null;
  }

  return (
    <div
      className={`lightning-flash lightning-flash--${flashIndex}`}
      aria-hidden="true"
    >
      <svg
        className="lightning-flash__svg"
        viewBox="0 0 300 300"
        role="presentation"
      >
        <path
          className="lightning-flash__bolt lightning-flash__bolt--primary"
          d="M155 55 L120 145 L145 139 L128 226 L186 126 L157 133 Z"
        />

        <path
          className="lightning-flash__bolt lightning-flash__bolt--secondary"
          d="M92 121 L76 156 L88 153 L81 187 L108 143 L95 147 Z"
        />
      </svg>
    </div>
  );
}
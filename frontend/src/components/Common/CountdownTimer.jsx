/**
 * Countdown display component.
 *
 * Shows a live remaining-time label until a reset timestamp is reached, then
 * fires an optional expiration callback for limit/usage UI refreshes.
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Render a live countdown until the provided reset timestamp expires.
 *
 * @returns {JSX.Element} Rendered UI.
 */
export default function CountdownTimer({ targetTimestamp, onExpire, isWarning = false }) {
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetTimestamp - Date.now()));

  useEffect(() => {
    hasExpiredRef.current = false;

    const tick = () => {
      const next = Math.max(0, targetTimestamp - Date.now());
      setTimeLeft(next);

      if (next <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current?.(); 
      }
    };

    const interval = setInterval(tick, 1000);
    tick();

    return () => clearInterval(interval);
  }, [targetTimestamp]); 

  if (timeLeft <= 0) {
    return <span className="font-bold text-rose-500">Expired</span>;
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  if (hours > 0) {
    return (
      <span className="font-mono tracking-tight">
        {hours}h {minutes}m {seconds.toString().padStart(2, '0')}s
      </span>
    );
  }

  return (
    <span className={`font-mono font-bold ${isWarning ? 'text-rose-500' : 'text-blue-500'}`}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}

CountdownTimer.propTypes = {
  targetTimestamp: PropTypes.number.isRequired,
  onExpire: PropTypes.func,
  isWarning: PropTypes.bool,
};
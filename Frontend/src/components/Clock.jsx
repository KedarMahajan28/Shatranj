import React from 'react';
import styles from './Clock.module.css';

function formatTime(ms) {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Clock({ label, timeMs, isActive, isLow }) {
  const formatted = formatTime(timeMs);
  const low = timeMs <= 30_000; // last 30 seconds

  return (
    <div className={`${styles.clock} ${isActive ? styles.active : ''} ${low ? styles.low : ''}`}>
      <div className={styles.label}>{label}</div>
      <div className={styles.time}>{formatted}</div>
      {isActive && <div className={styles.activePip} />}
    </div>
  );
}

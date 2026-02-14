import React, { useEffect, useRef } from 'react';
import styles from './MoveHistory.module.css';

export default function MoveHistory({ moves }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves]);

  // Pair moves into (white, black) rows
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ n: Math.floor(i / 2) + 1, white: moves[i], black: moves[i + 1] });
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>Move History</div>
      <div className={styles.list}>
        {pairs.length === 0 && (
          <span className={styles.empty}>No moves yet</span>
        )}
        {pairs.map(({ n, white, black }) => (
          <div key={n} className={styles.row}>
            <span className={styles.num}>{n}.</span>
            <span className={`${styles.move} ${styles.white}`}>{white}</span>
            <span className={`${styles.move} ${styles.black}`}>{black ?? ''}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

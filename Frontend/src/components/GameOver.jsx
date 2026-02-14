import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GameOver.module.css';

const REASON_LABELS = {
  checkmate: 'by Checkmate',
  timeout:   'on Time',
  resign:    'by Resignation',
  draw:      'by Agreement',
};

export default function GameOver({ result, playerColor }) {
  const navigate = useNavigate();
  if (!result) return null;

  const { winner, reason } = result;
  const isDraw = winner === 'draw';
  const iWon  = !isDraw && winner === playerColor;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={`${styles.crest} ${isDraw ? styles.draw : iWon ? styles.win : styles.loss}`}>
          {isDraw ? '½' : iWon ? '♔' : '♚'}
        </div>

        <h2 className={styles.title}>
          {isDraw ? 'Draw' : iWon ? 'Victory' : 'Defeat'}
        </h2>

        <p className={styles.sub}>
          {isDraw
            ? `Game drawn ${REASON_LABELS[reason] ?? ''}`
            : `${winner === 'white' ? 'White' : 'Black'} wins ${REASON_LABELS[reason] ?? ''}`}
        </p>

        <div className={styles.actions}>
          <button className={styles.home} onClick={() => navigate('/')}>
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

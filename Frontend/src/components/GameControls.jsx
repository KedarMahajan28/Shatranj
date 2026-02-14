import React from 'react';
import styles from './GameControls.module.css';

export default function GameControls({
  onResign,
  onOfferDraw,
  onRespondDraw,
  drawOffer,
  playerColor,
  disabled,
  status,
}) {
  const incomingDraw = drawOffer && drawOffer !== playerColor;
  const outgoingDraw = drawOffer === playerColor;

  if (status === 'finished') return null;

  return (
    <div className={styles.controls}>
      {incomingDraw ? (
        <div className={styles.drawOffer}>
          <p className={styles.offerText}>Draw offered</p>
          <div className={styles.drawButtons}>
            <button
              className={`${styles.btn} ${styles.accept}`}
              onClick={() => onRespondDraw(true)}
            >
              Accept
            </button>
            <button
              className={`${styles.btn} ${styles.decline}`}
              onClick={() => onRespondDraw(false)}
            >
              Decline
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            className={`${styles.btn} ${styles.draw} ${outgoingDraw ? styles.pending : ''}`}
            onClick={onOfferDraw}
            disabled={disabled || outgoingDraw}
          >
            {outgoingDraw ? 'Draw offered…' : 'Offer Draw'}
          </button>
          <button
            className={`${styles.btn} ${styles.resign}`}
            onClick={() => {
              if (window.confirm('Are you sure you want to resign?')) onResign();
            }}
            disabled={disabled}
          >
            Resign
          </button>
        </>
      )}
    </div>
  );
}

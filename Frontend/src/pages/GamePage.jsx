import React, { useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../hooks/useGame';
import ChessBoard from '../components/ChessBoard';
import Clock from '../components/Clock';
import MoveHistory from '../components/MoveHistory';
import GameControls from '../components/GameControls';
import GameOver from '../components/GameOver';
import styles from './GamePage.module.css';

export default function GamePage() {
  const { gameId }           = useParams();
  const [searchParams]       = useSearchParams();
  const isSpectator          = searchParams.get('spectate') === 'true';
  const { user }             = useAuth();
  const navigate             = useNavigate();

  const { state, makeMove, resign, offerDraw, respondDraw } = useGame(gameId, user?._id);
  const {
    fen, turn, timers, moveHistory, status,
    gameInfo, drawOffer, gameOver, lastMove, check, error,
  } = state;

  // Determine which color this user is playing
  const playerColor = useMemo(() => {
    if (!gameInfo || !user) return 'white';
    const isWhite = gameInfo.whitePlayer?._id?.toString() === user._id?.toString() ||
                    gameInfo.whitePlayer?.toString() === user._id?.toString();
    return isWhite ? 'white' : 'black';
  }, [gameInfo, user]);

  // Disable board interaction when it's not the player's turn or game isn't active
  const boardDisabled = isSpectator || status !== 'active' || turn !== playerColor;

  // Opponent info
  const opponent = playerColor === 'white' ? gameInfo?.blackPlayer : gameInfo?.whitePlayer;
  const self     = playerColor === 'white' ? gameInfo?.whitePlayer : gameInfo?.blackPlayer;

  // For board display: opponent clock is shown on top, player's on bottom
  const topColor    = playerColor === 'white' ? 'black' : 'white';
  const bottomColor = playerColor;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Board
        </button>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>♔</span>
          <span className={styles.brandName}>Shatranj</span>
        </div>
        <div className={styles.gameId}>
          <span className={styles.gameIdLabel}>Game</span>
          <code className={styles.gameIdVal} title="Share this ID">{gameId}</code>
        </div>
      </header>

      {/* Main layout */}
      <main className={styles.main}>
        {/* Left panel: clocks + board + clocks */}
        <section className={styles.boardSection}>
          {/* Opponent clock (top) */}
          <div className={styles.clockRow}>
            <Clock
              label={opponent?.username ?? (topColor === 'white' ? 'White' : 'Black')}
              timeMs={timers[topColor]}
              isActive={status === 'active' && turn === topColor}
            />
          </div>

          {/* Board */}
          <div className={styles.boardContainer}>
            {!fen ? (
              <div className={styles.waiting}>
                <div className={styles.waitingSpinner} />
                <p>Waiting for opponent…</p>
                <p className={styles.shareHint}>
                  Share Game ID: <code>{gameId}</code>
                </p>
              </div>
            ) : (
              <ChessBoard
                fen={fen}
                playerColor={playerColor}
                onMove={makeMove}
                lastMove={lastMove}
                disabled={boardDisabled}
                check={check}
              />
            )}
          </div>

          {/* Player clock (bottom) */}
          <div className={styles.clockRow}>
            <Clock
              label={self?.username ?? (bottomColor === 'white' ? 'White' : 'Black')}
              timeMs={timers[bottomColor]}
              isActive={status === 'active' && turn === bottomColor}
            />
          </div>
        </section>

        {/* Right panel: info + moves + controls */}
        <aside className={styles.sidebar}>
          {/* Status badge */}
          <div className={`${styles.statusBadge} ${styles[status]}`}>
            <span className={styles.statusDot} />
            {status === 'waiting' && 'Waiting for opponent'}
            {status === 'active'  && (turn === playerColor ? 'Your turn' : "Opponent's turn")}
            {status === 'finished' && 'Game finished'}
            {isSpectator && ' (Spectating)'}
          </div>

          {/* Error toast */}
          {error && <div className={styles.errorToast}>{error}</div>}

          {/* Move history */}
          <div className={styles.historyWrapper}>
            <MoveHistory moves={moveHistory} />
          </div>

          {/* Controls */}
          {!isSpectator && (
            <GameControls
              onResign={resign}
              onOfferDraw={offerDraw}
              onRespondDraw={respondDraw}
              drawOffer={drawOffer}
              playerColor={playerColor}
              disabled={boardDisabled}
              status={status}
            />
          )}
        </aside>
      </main>

      {/* Game over overlay */}
      {gameOver && <GameOver result={gameOver} playerColor={playerColor} />}
    </div>
  );
}

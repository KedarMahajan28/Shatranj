import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createGame, joinGame } from '../utils/api';
import styles from './HomePage.module.css';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function HomePage() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const [gameId, setGameId] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState('');

  const handleCreate = async () => {
    setError(''); setLoading('create');
    try {
      const res = await createGame(INITIAL_FEN);
      const id = res.data.data._id;
      navigate(`/game/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create game');
    } finally {
      setLoading('');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!gameId.trim()) return;
    setError(''); setLoading('join');
    try {
      await joinGame(gameId.trim());
      navigate(`/game/${gameId.trim()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join game');
    } finally {
      setLoading('');
    }
  };

  const handleSpectate = async (e) => {
    e.preventDefault();
    if (!gameId.trim()) return;
    navigate(`/game/${gameId.trim()}?spectate=true`);
  };

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>♔</span>
          <span className={styles.brandName}>Shatranj</span>
        </div>
        <div className={styles.userBar}>
          <div className={styles.userInfo}>
            <span className={styles.username}>{user?.username}</span>
            <span className={styles.rating}>{user?.rating ?? 1200} ELO</span>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.boardDecor} aria-hidden>
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className={`${styles.cell} ${(Math.floor(i/8) + i) % 2 === 0 ? styles.cellLight : styles.cellDark}`}
              />
            ))}
          </div>
          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle}>Play Chess</h2>
            <p className={styles.heroSub}>
              10-minute games. Real-time. No delay.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          {[
            { label: 'Games Played', val: user?.gamesPlayed ?? 0 },
            { label: 'Wins',         val: user?.wins ?? 0 },
            { label: 'Losses',       val: user?.losses ?? 0 },
            { label: 'Draws',        val: user?.draws ?? 0 },
          ].map(s => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statVal}>{s.val}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className={styles.cards}>
          {/* Create */}
          <div className={styles.card}>
            <div className={styles.cardIcon}>♟</div>
            <h3 className={styles.cardTitle}>New Game</h3>
            <p className={styles.cardDesc}>
              Create a new game and share the Game ID with your opponent.
            </p>
            <button
              className={`${styles.primaryBtn}`}
              onClick={handleCreate}
              disabled={loading === 'create'}
            >
              {loading === 'create' ? <span className={styles.spinner} /> : 'Create Game'}
            </button>
          </div>

          {/* Join / Spectate */}
          <div className={styles.card}>
            <div className={styles.cardIcon}>⚔</div>
            <h3 className={styles.cardTitle}>Join a Game</h3>
            <p className={styles.cardDesc}>
              Enter a Game ID to join as a player or spectator.
            </p>
            <form className={styles.joinForm} onSubmit={handleJoin}>
              <input
                type="text"
                placeholder="Paste Game ID…"
                value={gameId}
                onChange={e => setGameId(e.target.value)}
              />
              <div className={styles.joinButtons}>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={loading === 'join' || !gameId.trim()}
                >
                  {loading === 'join' ? <span className={styles.spinner} /> : 'Join'}
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleSpectate}
                  disabled={!gameId.trim()}
                >
                  Watch
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </main>
    </div>
  );
}

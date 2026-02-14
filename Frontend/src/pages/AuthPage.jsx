import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [form, setForm]       = useState({ username: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register }   = useAuth();
  const navigate              = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register({ username: form.username, email: form.email, password: form.password });
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Decorative corner pieces */}
      <div className={styles.cornerTL} />
      <div className={styles.cornerBR} />

      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>♔</span>
          <h1 className={styles.logoText}>Shatranj</h1>
        </div>
        <p className={styles.tagline}>The Ancient Game. Reimagined.</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        <form className={styles.form} onSubmit={handle}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                type="text"
                placeholder="Your chess handle"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                minLength={3}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              mode === 'login' ? 'Enter the Board' : 'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

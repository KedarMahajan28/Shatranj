import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { getMyRatings } from '../utils/api';
import styles from './ProfilePage.module.css';

const OUTCOME_COLORS = ['#4ade80', '#f87171', '#94a3b8'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
        return (
            <div className={styles.tooltip}>
                <span className={styles.tooltipLabel}>{payload[0].payload.game}</span>
                <span className={styles.tooltipValue}>{payload[0].value} ELO</span>
            </div>
        );
    }
    return null;
};
// ────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [ratings, setRatings] = useState([]);
    const [loadingRatings, setLoadingRatings] = useState(true);

    useEffect(() => {
        const loadRatings = async () => {
            try {
                const res = await getMyRatings();
                setRatings(Array.isArray(res?.data?.data) ? res.data.data : []);
            } catch {
                setRatings([]);
            } finally {
                setLoadingRatings(false);
            }
        };
        loadRatings();
    }, []);

    const gamesPlayed = user?.gamesPlayed ?? 0;
    const gamesWon = user?.wins ?? 0;
    const gamesLost = user?.losses ?? 0;
    const gamesDrawn = user?.draws ?? 0;
    const winRate     = gamesPlayed ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : 0;
    const rating      = user?.rating ?? 1200;

    const pieData = [
        { name: 'Won',  value: gamesWon   },
        { name: 'Lost', value: gamesLost  },
        { name: 'Draw', value: gamesDrawn },
    ];

    const ratingHistory = useMemo(() => {
        const chronological = [...ratings].reverse();
        return chronological.map((item, index) => ({
            game: `G${index + 1}`,
            rating: item.after,
            gameId: item.gameId?._id,
            change: item.change,
            result: item.result,
            endedAt: item.gameId?.endedAt || item.createdAt
        }));
    }, [ratings]);

    const pastGames = useMemo(() => {
        return ratings.map((item) => {
            const game = item.gameId;
            const isWhite = game?.whitePlayer?._id === user?._id;
            const opponent = isWhite ? game?.blackPlayer?.username : game?.whitePlayer?.username;

            return {
                id: item._id,
                gameId: game?._id,
                opponent: opponent || 'Unknown',
                result: item.result,
                change: item.change,
                after: item.after,
                reason: game?.resultReason || 'game',
                date: game?.endedAt || item.createdAt
            };
        });
    }, [ratings, user?._id]);

    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : 'GU';

    return (
        <div className={styles.page}>
            {/* ── Navigation Header ── */}
            <header className={styles.header}>
                <button 
                    className={styles.backBtn} 
                    onClick={() => navigate('/')}
                    aria-label="Back to Home"
                >
                    ← Back
                </button>
                <div className={styles.brand}>
                    <span className={styles.brandIcon}>♔</span>
                    <span className={styles.pageTitle}>Profile</span>
                </div>
            </header>

            {/* ── Background decoration ── */}
            <div className={styles.bgGlow} />

            {/* ── Header card ── */}
            <header className={styles.hero}>
                <div className={styles.avatarWrap}>
                    <div className={styles.avatarRing}>
                        <div className={styles.avatar}>{initials}</div>
                    </div>
                    <div className={styles.onlineDot} />
                </div>

                <div className={styles.heroInfo}>
                    <h1 className={styles.username}>{user?.username ?? 'Guest User'}</h1>
                    <p className={styles.email}>{user?.email ?? 'guest@example.com'}</p>

                    <div className={styles.ratingBadge}>
                        <span className={styles.ratingLabel}>ELO</span>
                        <span className={styles.ratingValue}>{rating}</span>
                    </div>
                </div>

                <button
                    className={styles.logoutBtn}
                    onClick={() => { logout(); navigate('/auth'); }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                </button>
            </header>

            {/* ── Stat pills ── */}
            <div className={styles.statsRow}>
                {[
                    { label: 'Played', value: gamesPlayed, accent: '#e2e8f0' },
                    { label: 'Won',    value: gamesWon,    accent: '#4ade80' },
                    { label: 'Lost',   value: gamesLost,   accent: '#f87171' },
                    { label: 'Win %',  value: `${winRate}%`, accent: '#facc15' },
                ].map(({ label, value, accent }) => (
                    <div className={styles.statCard} key={label}>
                        <span className={styles.statValue} style={{ color: accent }}>{value}</span>
                        <span className={styles.statLabel}>{label}</span>
                    </div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <nav className={styles.tabs}>
                {['overview', 'history', 'past games'].map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </nav>

            {/* ── Tab content ── */}
            <div className={styles.content}>

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className={styles.grid}>

                        {/* Rating Area Chart */}
                        <div className={styles.chartCard}>
                            <h2 className={styles.chartTitle}>Rating Progression</h2>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={ratingHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}   />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="game" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="rating" stroke="#818cf8" strokeWidth={2} fill="url(#ratingGrad)" dot={{ r: 3, fill: '#818cf8' }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Win/Loss/Draw Pie */}
                        <div className={styles.chartCard}>
                            <h2 className={styles.chartTitle}>Game Outcomes</h2>
                            <div className={styles.pieWrap}>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                                            dataKey="value" paddingAngle={3} strokeWidth={0}>
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={OUTCOME_COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className={styles.legend}>
                                    {pieData.map((d, i) => (
                                        <div className={styles.legendItem} key={d.name}>
                                            <span className={styles.legendDot} style={{ background: OUTCOME_COLORS[i] }} />
                                            <span>{d.name}</span>
                                            <span className={styles.legendCount}>{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* HISTORY (Rating chart full-width) */}
                {activeTab === 'history' && (
                    <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
                        <h2 className={styles.chartTitle}>Full Rating History</h2>
                        {loadingRatings ? (
                            <p className={styles.emptyText}>Loading rating history...</p>
                        ) : ratingHistory.length === 0 ? (
                            <p className={styles.emptyText}>No rating history yet. Finish some games to see the graph.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={ratingHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="ratingGrad2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}    />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="game" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="rating" stroke="#818cf8" strokeWidth={2.5} fill="url(#ratingGrad2)" dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#a5b4fc' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                        <div className={styles.historyMeta}>
                            <span>Peak: <strong style={{ color: '#a5b4fc' }}>{ratingHistory.length ? Math.max(...ratingHistory.map(r => r.rating)) : rating} ELO</strong></span>
                            <span>Current: <strong style={{ color: '#4ade80' }}>{rating} ELO</strong></span>
                            <span>Games tracked: <strong>{ratingHistory.length}</strong></span>
                        </div>
                    </div>
                )}

                {/* Past Games */}
                {activeTab === 'past games' && (
                    <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
                        <h2 className={styles.chartTitle}>Past Games</h2>
                        {loadingRatings ? (
                            <p className={styles.emptyText}>Loading games...</p>
                        ) : pastGames.length === 0 ? (
                            <p className={styles.emptyText}>No past games yet.</p>
                        ) : (
                            <div className={styles.gamesList}>
                                {pastGames.map((game) => (
                                    <div className={styles.gameRow} key={game.id}>
                                        <div>
                                            <p className={styles.gameOpponent}>vs {game.opponent}</p>
                                            <p className={styles.gameMeta}>{new Date(game.date).toLocaleString()} - {game.reason}</p>
                                        </div>
                                        <div className={styles.gameResultWrap}>
                                            <span
                                                className={styles.resultBadge}
                                                data-result={game.result}
                                            >
                                                {game.result.toUpperCase()}
                                            </span>
                                            <span className={game.change >= 0 ? styles.positiveChange : styles.negativeChange}>
                                                {game.change >= 0 ? '+' : ''}{game.change}
                                            </span>
                                            <span className={styles.afterRating}>{game.after} ELO</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
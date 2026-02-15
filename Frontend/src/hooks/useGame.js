import { useEffect, useRef, useReducer, useCallback } from 'react';
import { Chess } from 'chess.js';
import { getSocket } from '../utils/socket';
import { joinGame as apiJoinGame } from '../utils/api';

// State shape
const INITIAL_STATE = {
  chess:       null,      // Chess.js instance (not serialisable – handled via ref)
  fen:         '',
  turn:        'white',
  timers:      { white: 600_000, black: 600_000 },
  moveHistory: [],
  status:      'waiting', // waiting | active | finished
  gameInfo:    null,      // { whitePlayer, blackPlayer }
  drawOffer:   null,      // null | 'white' | 'black'
  gameOver:    null,      // { winner, reason, fen, moves }
  lastMove:    null,      // { from, to } for highlighting
  check:       false,
  connected:   false,
  error:       null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, connected: true, error: null };
    case 'GAME_STATE': {
      const chess = new Chess(action.payload.fen);
      return {
        ...state,
        fen:         action.payload.fen,
        turn:        action.payload.turn,
        timers:      action.payload.timers ?? state.timers,
        moveHistory: action.payload.moveHistory ?? [],
        status:      action.payload.status ?? state.status,
        gameInfo:    { whitePlayer: action.payload.whitePlayer, blackPlayer: action.payload.blackPlayer },
        drawOffer:   action.payload.drawOffer ?? null,
        check:       chess.inCheck(),
        chess,
      };
    }
    case 'MOVE_PLAYED': {
      const chess = new Chess(action.payload.fen);
      return {
        ...state,
        fen:         action.payload.fen,
        turn:        action.payload.turn,
        timers:      action.payload.timers ?? state.timers,
        moveHistory: action.payload.moveHistory ?? state.moveHistory,
        lastMove:    { from: action.payload.move.from, to: action.payload.move.to },
        check:       chess.inCheck(),
        drawOffer:   null,
        chess,
      };
    }
    case 'CLOCK_UPDATE':
      return { ...state, timers: action.payload };
    case 'GAME_OVER':
      return { ...state, status: 'finished', gameOver: action.payload };
    case 'DRAW_OFFERED':
      return { ...state, drawOffer: action.payload.offeredBy };
    case 'DRAW_DECLINED':
      return { ...state, drawOffer: null };
    case 'PLAYER_JOINED':
      return { ...state, status: 'active' };
    case 'ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    default:
      return state;
  }
}

// ── Hook 
export function useGame(gameId, userId) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const socketRef = useRef(null);

  // Join the game room via HTTP first, then via socket
  useEffect(() => {
    if (!gameId || !userId) return;

    const socket = getSocket();
    socketRef.current = socket;

    // ── Socket event listeners 

    socket.on('connect', () => dispatch({ type: 'CONNECTED' }));
    if (socket.connected) dispatch({ type: 'CONNECTED' });

    socket.on('gameState', payload => {
      dispatch({ type: 'GAME_STATE', payload });
    });

    socket.on('movePlayed', payload => {
      dispatch({ type: 'MOVE_PLAYED', payload });
    });

    socket.on('clockUpdate', payload => {
      dispatch({ type: 'CLOCK_UPDATE', payload });
    });

    socket.on('gameOver', payload => {
      dispatch({ type: 'GAME_OVER', payload });
    });

    socket.on('drawOffered', payload => {
      dispatch({ type: 'DRAW_OFFERED', payload });
    });

    socket.on('drawDeclined', () => {
      dispatch({ type: 'DRAW_DECLINED' });
    });

    socket.on('playerJoined', () => {
      dispatch({ type: 'PLAYER_JOINED' });
    });

    socket.on('moveError', ({ message }) => {
      dispatch({ type: 'ERROR', payload: message });
      setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 3000);
    });

    socket.on('error', ({ message }) => {
      dispatch({ type: 'ERROR', payload: message });
      setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 3000);
    });

    // Announce we've joined
    socket.emit('joinGame', { gameId });

    return () => {
      socket.emit('leaveGame');
      socket.off('connect');
      socket.off('gameState');
      socket.off('movePlayed');
      socket.off('clockUpdate');
      socket.off('gameOver');
      socket.off('drawOffered');
      socket.off('drawDeclined');
      socket.off('playerJoined');
      socket.off('moveError');
      socket.off('error');
    };
  }, [gameId, userId]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const makeMove = useCallback((from, to, promotion) => {
    if (!socketRef.current) return;
    socketRef.current.emit('makeMove', { gameId, from, to, promotion });
  }, [gameId]);

  const resign = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('resign', { gameId });
  }, [gameId]);

  const offerDraw = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('offerDraw', { gameId });
  }, [gameId]);

  const respondDraw = useCallback((accept) => {
    if (!socketRef.current) return;
    socketRef.current.emit('respondDraw', { gameId, accept });
  }, [gameId]);

  return { state, makeMove, resign, offerDraw, respondDraw };
}

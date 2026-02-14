import React, { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import styles from './ChessBoard.module.css';

// Unicode piece map
const PIECES = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = [8,7,6,5,4,3,2,1];

function squareToCoords(square) {
  const file = FILES.indexOf(square[0]);
  const rank = parseInt(square[1]) - 1;
  return { file, rank };
}

function coordsToSquare(file, rank) {
  return FILES[file] + (rank + 1);
}

export default function ChessBoard({ fen, playerColor, onMove, lastMove, disabled, check }) {
  const [selected, setSelected]   = useState(null); // square string or null
  const [legalDots, setLegalDots] = useState([]);   // legal destination squares

  const chess = useMemo(() => new Chess(fen), [fen]);

  const flipped = playerColor === 'black';
  const displayFiles = flipped ? [...FILES].reverse() : FILES;
  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;

  const handleSquareClick = useCallback((square) => {
    if (disabled) return;

    const piece = chess.get(square);
    const isMyPiece = piece && piece.color === (playerColor === 'white' ? 'w' : 'b');
    const isMyTurn = chess.turn() === (playerColor === 'white' ? 'w' : 'b');

    if (selected) {
      if (legalDots.includes(square)) {
        // Determine if promotion is needed
        const movingPiece = chess.get(selected);
        let promotion;
        if (
          movingPiece?.type === 'p' &&
          ((playerColor === 'white' && square[1] === '8') ||
           (playerColor === 'black' && square[1] === '1'))
        ) {
          promotion = 'q'; // auto-promote to queen
        }
        onMove(selected, square, promotion);
        setSelected(null);
        setLegalDots([]);
      } else if (isMyPiece && isMyTurn) {
        // Re-select another own piece
        const moves = chess.moves({ square, verbose: true });
        setSelected(square);
        setLegalDots(moves.map(m => m.to));
      } else {
        setSelected(null);
        setLegalDots([]);
      }
    } else {
      if (isMyPiece && isMyTurn) {
        const moves = chess.moves({ square, verbose: true });
        setSelected(square);
        setLegalDots(moves.map(m => m.to));
      }
    }
  }, [chess, selected, legalDots, playerColor, onMove, disabled]);

  // Render pieces
  const renderSquare = (file, rank) => {
    const square = coordsToSquare(file, rank);
    const isDark  = (file + rank) % 2 === 0;
    const piece   = chess.get(square);
    const pieceKey = piece ? (piece.color + piece.type.toUpperCase()) : null;

    const isSelected  = selected === square;
    const isLegal     = legalDots.includes(square);
    const isLastFrom  = lastMove?.from === square;
    const isLastTo    = lastMove?.to === square;
    const isKingCheck = check && piece?.type === 'k' &&
      piece.color === chess.turn() && square === chess.board().flat().find(
        sq => sq?.type === 'k' && sq.color === chess.turn()
      )?.square;

    let squareClass = `${styles.square} ${isDark ? styles.dark : styles.light}`;
    if (isSelected) squareClass += ` ${styles.selected}`;
    if (isLastFrom || isLastTo) squareClass += ` ${styles.lastMove}`;

    return (
      <div
        key={square}
        className={squareClass}
        onClick={() => handleSquareClick(square)}
        data-square={square}
      >
        {isLegal && (
          <div className={`${styles.legalDot} ${piece ? styles.legalCapture : ''}`} />
        )}
        {piece && (
          <span className={`${styles.piece} ${isKingCheck ? styles.inCheck : ''}`}>
            {PIECES[pieceKey]}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.boardWrapper}>
      {/* Rank labels */}
      <div className={styles.rankLabels}>
        {displayRanks.map(rank => (
          <span key={rank} className={styles.label}>{rank}</span>
        ))}
      </div>

      <div className={styles.board}>
        {displayRanks.map(rank =>
          displayFiles.map(file =>
            renderSquare(FILES.indexOf(file), rank - 1)
          )
        )}
      </div>

      {/* File labels */}
      <div className={styles.fileLabels}>
        {displayFiles.map(file => (
          <span key={file} className={styles.label}>{file}</span>
        ))}
      </div>
    </div>
  );
}

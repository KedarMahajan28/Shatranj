import { Chess } from "chess.js";
import { Game } from "../models/game.model.js";
import {User} from "../models/user.model.js"
import {Rating} from "../models/rating.model.js"


const activeSessions = new Map();

const TIME_LIMIT_MS = 10 * 60 * 1000; // 10 minutes
const TICK_MS = 1000; // timer resolution

//helpers
function calculateElo(ratingA, ratingB, scoreA, k = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  return Math.round(ratingA + k * (scoreA - expectedA));
}

function createSession(gameId, fen) {
  return {
    chess: new Chess(fen),
    timers: { white: TIME_LIMIT_MS, black: TIME_LIMIT_MS },
    intervals: { white: null, black: null },
    drawOffer: null, // "white" | "black" | null
    playerSockets: new Map(), // userId → socketId
    lastTickAt: null,
  };
}

function clearTick(session, color) {
  if (session.intervals[color]) {
    clearInterval(session.intervals[color]);
    session.intervals[color] = null;
  }
}

function startTick(io, gameId, session, color) {
  clearTick(session, color);
  session.lastTickAt = Date.now();

  session.intervals[color] = setInterval(() => {
    const elapsed = Date.now() - session.lastTickAt;
    session.lastTickAt = Date.now();
    session.timers[color] -= elapsed;

    // Emit a clock update to the room every second
    io.to(gameId).emit("clockUpdate", {
      white: session.timers.white,
      black: session.timers.black,
    });

    if (session.timers[color] <= 0) {
      session.timers[color] = 0;
      clearTick(session, color);
      handleGameEnd(io, gameId, session, color === "white" ? "black" : "white", "timeout");
    }
  }, TICK_MS);
}

async function handleGameEnd(io, gameId, session, winner, reason) {
  clearTick(session, "white");
  clearTick(session, "black");

  const finalFen = session.chess.fen();
  const moveHistory = session.chess.history();

  try {
    const game = await Game.findById(gameId);
    if (!game || game.status === "finished") return;

    game.status = "finished";
    game.currentFEN = finalFen;
    game.moveHistory = moveHistory;
    game.winner = winner;
    game.resultReason = reason;
    game.endedAt = new Date();

    await game.save();

    const whiteId = game.whitePlayer;
    const blackId = game.blackPlayer;

    // ── UPDATE STATS + RATINGS
const whiteUser = await User.findById(whiteId).select("rating");
const blackUser = await User.findById(blackId).select("rating");

const whiteRating = whiteUser.rating ?? 1200;
const blackRating = blackUser.rating ?? 1200;

if (winner === "draw") {
  const newWhiteRating = calculateElo(whiteRating, blackRating, 0.5);
  const newBlackRating = calculateElo(blackRating, whiteRating, 0.5);

  await User.updateMany(
    { _id: { $in: [whiteId, blackId] } },
    {
      $inc: {
        gamesPlayed: 1,
        draws: 1
      }
    }
  );

  await User.findByIdAndUpdate(whiteId, { rating: newWhiteRating });
  await User.findByIdAndUpdate(blackId, { rating: newBlackRating });

} else {
  const winnerId = winner === "white" ? whiteId : blackId;
  const loserId  = winner === "white" ? blackId : whiteId;

  const winnerRating = winner === "white" ? whiteRating : blackRating;
  const loserRating  = winner === "white" ? blackRating : whiteRating;

  const newWinnerRating = calculateElo(winnerRating, loserRating, 1);
  const newLoserRating  = calculateElo(loserRating, winnerRating, 0);

  await User.findByIdAndUpdate(winnerId, {
    $inc: {
      gamesPlayed: 1,
      wins: 1
    },
    $set: { rating: newWinnerRating }
  });

  await User.findByIdAndUpdate(loserId, {
    $inc: {
      gamesPlayed: 1,
      losses: 1
    },
    $set: { rating: newLoserRating }
  });
}


    
    



  } catch (err) {
    console.error("[socket] Failed to finalize game:", err.message);
  }

  io.to(gameId).emit("gameOver", {
    winner,
    reason,
    fen: finalFen,
    moves: moveHistory,
    timers: session.timers
  });

  activeSessions.delete(gameId);
}


//  socket handler

const gameSocket = (io, socket) => {
  // joinGame 
  socket.on("joinGame", async ({ gameId }) => {
    try {
      const game = await Game.findById(gameId)
        .populate("whitePlayer", "username rating")
        .populate("blackPlayer", "username rating");

      if (!game) {
        return socket.emit("error", { message: "Game not found" });
      }

      socket.join(gameId);
      socket.gameId = gameId;

      // Track which socket belongs to which player
      if (!activeSessions.has(gameId)) {
        // Initialise in-memory session on first join
        const session = createSession(gameId, game.currentFEN);
        activeSessions.set(gameId, session);
      }

      const session = activeSessions.get(gameId);
      session.playerSockets.set(socket.user._id.toString(), socket.id);

      // Send the full current state to the joining client
      socket.emit("gameState", {
        fen: session.chess.fen(),
        turn: session.chess.turn() === "w" ? "white" : "black",
        timers: session.timers,
        moveHistory: session.chess.history(),
        status: game.status,
        whitePlayer: game.whitePlayer,
        blackPlayer: game.blackPlayer,
        drawOffer: session.drawOffer,
      });

      io.to(gameId).emit("playerJoined", {
        userId: socket.user._id,
        username: socket.user.username,
        gameId,
      });

      // Start clocks only once both players are in the room and game is active
      if (game.status === "active") {
        const currentTurn = session.chess.turn() === "w" ? "white" : "black";
        if (!session.intervals[currentTurn]) {
          startTick(io, gameId, session, currentTurn);
        }
      }
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  //  makeMove 
  socket.on("makeMove", async ({ gameId, from, to, promotion }) => {
    try {
      const session = activeSessions.get(gameId);
      if (!session) return socket.emit("moveError", { message: "Session not found" });

      const chess = session.chess;
      const currentTurn = chess.turn() === "w" ? "white" : "black";

      // Authorization: only the player whose turn it is may move
      const game = await Game.findById(gameId);
      if (!game) return socket.emit("moveError", { message: "Game not found" });
      if (game.status !== "active") return socket.emit("moveError", { message: "Game is not active" });

      const isWhite = game.whitePlayer.toString() === socket.user._id.toString();
      const isBlack = game.blackPlayer?.toString() === socket.user._id.toString();

      if (!isWhite && !isBlack) return socket.emit("moveError", { message: "You are not a player in this game" });
      if (isWhite && currentTurn !== "white") return socket.emit("moveError", { message: "Not your turn" });
      if (isBlack && currentTurn !== "black") return socket.emit("moveError", { message: "Not your turn" });

      // Attempt the move
      const move = chess.move({ from, to, promotion: promotion || "q" });
      if (!move) return socket.emit("moveError", { message: "Illegal move" });

      // Cancel any pending draw offer on a move
      session.drawOffer = null;

      // Switch clocks
      clearTick(session, currentTurn);
      const nextTurn = chess.turn() === "w" ? "white" : "black";

      // Update FEN in DB 
      await Game.findByIdAndUpdate(gameId, { currentFEN: chess.fen() });

      // Broadcast the move to everyone in the room
      io.to(gameId).emit("movePlayed", {
        move,
        fen: chess.fen(),
        turn: nextTurn,
        timers: session.timers,
        moveHistory: chess.history(),
      });

      // Check terminal conditions
      if (chess.isCheckmate()) {
        return handleGameEnd(io, gameId, session, currentTurn, "checkmate");
      }
      if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
        return handleGameEnd(io, gameId, session, "draw", "draw");
      }

      // Game continues – start the next player's clock
      startTick(io, gameId, session, nextTurn);
    } catch (err) {
      socket.emit("moveError", { message: err.message });
    }
  });

  //  resign 
  socket.on("resign", async ({ gameId }) => {
    try {
      const session = activeSessions.get(gameId);
      if (!session) return;

      const game = await Game.findById(gameId);
      if (!game || game.status !== "active") return;

      const isWhite = game.whitePlayer.toString() === socket.user._id.toString();
      const isBlack = game.blackPlayer?.toString() === socket.user._id.toString();
      if (!isWhite && !isBlack) return;

      const winner = isWhite ? "black" : "white";
      await handleGameEnd(io, gameId, session, winner, "resign");
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  //  offerDraw
  socket.on("offerDraw", async ({ gameId }) => {
    try {
      const session = activeSessions.get(gameId);
      if (!session) return;

      const game = await Game.findById(gameId);
      if (!game || game.status !== "active") return;

      const isWhite = game.whitePlayer.toString() === socket.user._id.toString();
      const isBlack = game.blackPlayer?.toString() === socket.user._id.toString();
      if (!isWhite && !isBlack) return;
      if (session.drawOffer) return socket.emit("error", { message: "Draw already offered" });

      const offerer = isWhite ? "white" : "black";
      session.drawOffer = offerer;

      io.to(gameId).emit("drawOffered", { offeredBy: offerer });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  //  respondDraw 
  socket.on("respondDraw", async ({ gameId, accept }) => {
    try {
      const session = activeSessions.get(gameId);
      if (!session || !session.drawOffer) return;

      const game = await Game.findById(gameId);
      if (!game || game.status !== "active") return;

      const isWhite = game.whitePlayer.toString() === socket.user._id.toString();
      const isBlack = game.blackPlayer?.toString() === socket.user._id.toString();
      if (!isWhite && !isBlack) return;

      // The responder must be the opposite side of the offerer
      const responder = isWhite ? "white" : "black";
      if (responder === session.drawOffer) return socket.emit("error", { message: "Cannot respond to your own draw offer" });

      if (accept) {
        await handleGameEnd(io, gameId, session, "draw", "draw");
      } else {
        session.drawOffer = null;
        io.to(gameId).emit("drawDeclined");
      }
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  //  addSpectator 
  socket.on("addSpectator", ({ gameId }) => {
    socket.join(gameId);
    io.to(gameId).emit("spectatorJoined", { userId: socket.user._id });

    const session = activeSessions.get(gameId);
    if (session) {
      socket.emit("gameState", {
        fen: session.chess.fen(),
        turn: session.chess.turn() === "w" ? "white" : "black",
        timers: session.timers,
        moveHistory: session.chess.history(),
        drawOffer: session.drawOffer,
      });
    }
  });

  // leaveGame 
  socket.on("leaveGame", () => {
    if (!socket.gameId) return;
    socket.leave(socket.gameId);
    io.to(socket.gameId).emit("playerLeft", { userId: socket.user._id });
    socket.gameId = null;
  });

  // disconnect 
  socket.on("disconnect", async () => {
    if (!socket.gameId) return;
    io.to(socket.gameId).emit("playerDisconnected", { userId: socket.user._id });

    const session = activeSessions.get(socket.gameId);
    if (session) {
      session.playerSockets.delete(socket.user._id.toString());
    }

    await Game.findByIdAndUpdate(socket.gameId, { lastSeen: new Date() }).catch(() => {});
  });
};

export { gameSocket, activeSessions };

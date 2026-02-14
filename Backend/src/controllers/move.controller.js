import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { ApiError } from "../utils/apiError.js"
import { Move } from "../models/move.model.js"
import { Game } from "../models/game.model.js"
import { Chess } from "chess.js"

const makeMove = asyncHandler(async (req, res) => {
  const { gameId } = req.params
  const { from, to, promotion, timeTaken } = req.body

  if (!from || !to) {
    throw new ApiError(400, "Move coordinates are required")
  }

  const game = await Game.findById(gameId)

  if (!game) {
    throw new ApiError(404, "Game not found")
  }

  if (game.status !== "active") {
    throw new ApiError(400, "Game is not active")
  }

  const isWhite = game.whitePlayer.toString() === req.user._id.toString()
  const isBlack = game.blackPlayer?.toString() === req.user._id.toString()

  if (!isWhite && !isBlack) {
    throw new ApiError(403, "You are not a player in this game")
  }

  const chess = new Chess(game.currentFEN)

  if (
    (chess.turn() === "w" && !isWhite) ||
    (chess.turn() === "b" && !isBlack)
  ) {
    throw new ApiError(400, "Not your turn")
  }

  const moveResult = chess.move({
    from,
    to,
    promotion
  })

  if (!moveResult) {
    throw new ApiError(400, "Illegal move")
  }

  const moveCount = await Move.countDocuments({ gameId })

  const move = await Move.create({
    gameId,
    player: req.user._id,
    from,
    to,
    piece: moveResult.piece,
    moveNumber: moveCount + 1,
    fenAfterMove: chess.fen(),
    timeTaken
  })

  game.currentFEN = chess.fen()
  game.turn = chess.turn() === "w" ? "white" : "black"

  if (chess.isGameOver()) {
    game.status = "finished"
    game.endedAt = new Date()

    if (chess.isCheckmate()) {
      game.winner = chess.turn() === "w" ? "black" : "white"
      game.resultReason = "checkmate"
    } else {
      game.winner = "draw"
      game.resultReason = "draw"
    }
  }

  await game.save()

  return res
    .status(200)
    .json(new ApiResponse(200, move, "Move played successfully"))
})

const getMovesByGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params

  const moves = await Move.find({ gameId })
    .sort({ moveNumber: 1 })
    .populate("player", "username")

  return res
    .status(200)
    .json(new ApiResponse(200, moves, "Moves fetched successfully"))
})

export {
  makeMove,
  getMovesByGame
}

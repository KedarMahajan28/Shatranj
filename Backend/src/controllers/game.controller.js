import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { ApiError } from "../utils/apiError.js"
import { Game } from "../models/game.model.js"
import { Chess } from "chess.js"

const createGame = asyncHandler(async (req, res) => {
  const { initialFEN } = req.body

  if (!initialFEN) {
    throw new ApiError(400, "Initial FEN is required")
  }

  const game = await Game.create({
    whitePlayer: req.user._id,
    currentFEN: initialFEN
  })

  return res
    .status(201)
    .json(new ApiResponse(201, game, "Game created successfully"))
})

const joinGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params

  const game = await Game.findById(gameId)

  if (!game) {
    throw new ApiError(404, "Game not found")
  }

  if (game.blackPlayer) {
    throw new ApiError(400, "Game already has two players")
  }

  if (game.whitePlayer.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot join your own game")
  }

  game.blackPlayer = req.user._id
  game.status = "active"
  game.startedAt = new Date()

  await game.save()

  return res
    .status(200)
    .json(new ApiResponse(200, game, "Joined game successfully"))
})

const getGameById = asyncHandler(async (req, res) => {
  const { gameId } = req.params

  const game = await Game.findById(gameId)
    .populate("whitePlayer", "username")
    .populate("blackPlayer", "username")
    .populate("spectators", "username")

  if (!game) {
    throw new ApiError(404, "Game not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, game, "Game fetched successfully"))
})



const resignGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params

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

  game.status = "finished"
  game.endedAt = new Date()
  game.resultReason = "resign"
  game.winner = isWhite ? "black" : "white"

  await game.save()

  return res
    .status(200)
    .json(new ApiResponse(200, game, "Game resigned"))
})

const finishGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params
  const { winner, reason } = req.body

  const game = await Game.findById(gameId)

  if (!game) {
    throw new ApiError(404, "Game not found")
  }

  game.status = "finished"
  game.winner = winner
  game.resultReason = reason
  game.endedAt = new Date()

  await game.save()

  return res
    .status(200)
    .json(new ApiResponse(200, game, "Game finished"))
})

const addSpectator = asyncHandler(async (req, res) => {
  const { gameId } = req.params

  const game = await Game.findById(gameId)

  if (!game) {
    throw new ApiError(404, "Game not found")
  }

  if (game.spectators.includes(req.user._id)) {
    throw new ApiError(400, "Already spectating this game")
  }

  game.spectators.push(req.user._id)
  await game.save()

  return res
    .status(200)
    .json(new ApiResponse(200, game, "Spectator added"))
})

const offerDraw = asyncHandler(async (req, res) => {
  const { gameId } = req.params

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

  if (game.drawOffer?.offeredBy) {
    throw new ApiError(400, "Draw already offered")
  }

  game.drawOffer = {
    offeredBy: req.user._id,
    offeredAt: new Date()
  }

  await game.save()

  return res
    .status(200)
    .json(new ApiResponse(200, game, "Draw offered successfully"))
})



export {
  createGame,
  joinGame,
  getGameById,
  resignGame,
  finishGame,
  addSpectator,
  offerDraw

 
}

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { Rating } from "../models/rating.model.js"
import { Game } from "../models/game.model.js"
import { User } from "../models/user.model.js"

const calculateRatingChange = (result) => {
  if (result === "win") return 10
  if (result === "loss") return -10
  return 0
}

const saveRating = asyncHandler(async (req, res) => {
  const {  result } = req.body
  const {gameId} = req.params

  if (!gameId || !result) {
    throw new ApiError(400, "Game ID and result are required")
  }

  const game = await Game.findById(gameId)

  if (!game) {
    throw new ApiError(404, "Game not found")
  }

  if (game.status !== "finished") {
    throw new ApiError(400, "Game is not finished")
  }

  const change = calculateRatingChange(result)

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $inc: { rating: change } },
    { new: false }
  )

  if (!updatedUser) {
    throw new ApiError(404, "User not found")
  }

  const before = updatedUser.rating
  const after = before + change

  const rating = await Rating.create({
    userId: updatedUser._id,
    gameId,
    before,
    after,
    change,
    result
  })

  return res
    .status(201)
    .json(new ApiResponse(201, rating, "Rating updated successfully"))
})

const getRatingsByUser = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: "gameId",
      populate: [
        { path: "whitePlayer", select: "username" },
        { path: "blackPlayer", select: "username" }
      ]
    })

  return res
    .status(200)
    .json(new ApiResponse(200, ratings, "Ratings fetched successfully"))
})

const getRatingsByGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params

  const ratings = await Rating.find({ gameId })
    .populate("userId", "username")

  return res
    .status(200)
    .json(new ApiResponse(200, ratings, "Game ratings fetched successfully"))
})

export {
  saveRating,
  getRatingsByUser,
  getRatingsByGame
}

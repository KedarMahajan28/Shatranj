import { Router } from "express"
import { verifyJwt } from "../middleware/auth.middleware.js"
import {
  createGame,
  joinGame,
  getGameById,
  resignGame,
  finishGame,
  addSpectator,
  offerDraw,
  
} from "../controllers/game.controller.js"

const router = Router()

router.route("/create").post(verifyJwt, createGame)

router.route("/:gameId/join").post(verifyJwt, joinGame)

router.route("/:gameId").get( getGameById)


router.route("/:gameId/resign").post(verifyJwt, resignGame)

router.route("/:gameId/finish").post(verifyJwt, finishGame)

router.route("/:gameId/spectate").post(verifyJwt, addSpectator)

router.route("/:gameId/offer-draw").post(verifyJwt,offerDraw)

export default router

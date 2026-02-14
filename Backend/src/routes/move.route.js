import { Router } from "express"
import { verifyJwt } from "../middleware/auth.middleware.js"
import {
  makeMove,
  getMovesByGame
} from "../controllers/move.controller.js"

const router = Router()

router.route("/:gameId/move").post(verifyJwt, makeMove)

router.route("/:gameId/moves").get(verifyJwt, getMovesByGame)

export default router

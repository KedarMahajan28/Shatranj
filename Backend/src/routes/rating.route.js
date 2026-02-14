
import { Router } from "express"
import { verifyJwt } from "../middleware/auth.middleware.js"
import {
  saveRating,
  getRatingsByUser,
  getRatingsByGame
} from "../controllers/rating.controller.js"

const router = Router()

router.route("/save").post(verifyJwt, saveRating)

router.route("/me").get(verifyJwt, getRatingsByUser)

router.route("/game/:gameId").get(verifyJwt, getRatingsByGame)

export default router
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {Router} from 'express'
import {verifyJwt} from "../middleware/auth.middleware.js"

const router  = Router()

router.route("/register").post(registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJwt,logoutUser)

router.route("/refresh-accestoken").post(verifyJwt,refreshAccessToken)

router.route("/me").get(verifyJwt,getCurrentUser)



export default router
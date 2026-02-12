import path from "path"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { ApiError } from "../utils/apiError.js"
import jwt from "jsonwebtoken"
import { validateHeaderName } from "http"
import { User } from "../models/user.model.js"

const generateAccessandRefreshTokens = async (userId)=>{
    try{
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken();
     
      const refreshToken = user.generateRefreshToken();
      

      console.log(accessToken,refreshToken)
      user.refreshToken = refreshToken
      await user.save({validateBeforeSave : false})
    return {accessToken, refreshToken}
    }

    catch(error){
      throw new ApiError(500,"Acess/Refresh Token generation failed")
    }
  }

  const registerUser = (async (req,res)=>{
        const {username,email,password} = req.body

  if ([ email, username, password].some(
    field => !field || field.trim() === ""
  )) {
    throw new ApiError(400, "All fields are required");
  }
    const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    console.log(existedUser)
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create({
    username,
    email,
    password
  })
  user.status = "online"
  await user.save()

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );


   return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );


  })

  export {registerUser}
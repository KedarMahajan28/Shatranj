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

  const registerUser = asyncHandler(async (req,res)=>{
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
  
  const loginUser = asyncHandler(async (req,res)=>{
  // data from req

  // username/email & password verificaton
  // find user
  //password check
  //access and refresh token generate
  //send cookies

  const {email,username,password} = req.body;

  if(!username && !email){
    throw new ApiError(400,"Username or email is required");
  }

  const user = await User.findOne({
    $or:[
      {username} , {email}
    ]
  })

  if(!user){
    throw new ApiError(404,"User not found")

  }

const isPassValid =   await user.isPasswordCorrect(password)

if(!isPassValid){
    throw new ApiError(401,"Invalid password")


  }
  const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)

  
  const LoggedinUser = await User.findById(user._id).select("-password -refreshToken")

  const options ={
    httpOnly : true,
    secure : true
  }


  

  return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200, LoggedinUser, accessToken,refreshToken, "User logged in successfully"))


  
})


const logoutUser = asyncHandler(async (req,res)=>{
     await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            refreshToken: undefined
          }
        },{
          returnDocument: "after" 
        }
      )

      return res
             .status(200)
             .clearCookie("accessToken")
              .clearCookie("refreshToken")
              .json(new ApiResponse(200, null, "User logged out successfully"))
    })



const refreshAccessToken = asyncHandler(async (req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(400,"Refresh token is required")
  }

  try{
  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

 const user = await  User.findById(decodedToken._id)
  if(!user){
    throw new ApiError(404,"User not found")
  }
  if(user.refreshToken !== incomingRefreshToken){
    throw new ApiError(401,"Refresh token is expired")
  }

  const options={
    httpOnly : true,
    secure : true
  }

const {accessToken,refreshToken} =  await generateAccessandRefreshTokens(user._id)
  return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200, null, accessToken ,refreshToken, "Access token refreshed successfully"))
  }
  catch(error){
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{

  const {currentPassword, newPassword} = req.body
  
  const user = await User.findById(req.user?._id)

 const isPassCorrect =  await user.isPasswordCorrect(currentPassword)

  if(!isPassCorrect){
    throw new ApiError(401,"Current password is incorrect")
  }
  user.password = newPassword
  await user.save({
    validateBeforeSave : false
  })

  return res
            .status(200)
            .json(new ApiResponse(200, null, "Password changed successfully")) 


  
})

const getCurrentUser = asyncHandler(async (req,res)=>{

  return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

  export {registerUser,loginUser,logoutUser,refreshAccessToken,getCurrentUser,changeCurrentPassword}
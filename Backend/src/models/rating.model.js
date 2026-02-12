import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true
    },
    before: {
      type: Number,
      required: true
    },
    after: {
      type: Number,
      required: true
    },
    change: {
      type: Number,
      required: true
    },
    result: {
      type: String,
      enum: ["win", "loss", "draw"],
      required: true
    }
  },
  { timestamps: true }
);

export const Rating = mongoose.model("Rating", ratingSchema);

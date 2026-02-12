import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    whitePlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    blackPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    spectators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    currentFEN: {
      type: String,
      required: true
    },
    moveHistory: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ["waiting", "active", "finished"],
      default: "waiting"
    },
    turn: {
      type: String,
      enum: ["white", "black"],
      default: "white"
    },
    winner: {
      type: String,
      enum: ["white", "black", "draw", null],
      default: null
    },
    resultReason: {
      type: String,
      enum: ["checkmate", "resign", "timeout", "draw", null],
      default: null
    },
    startedAt: {
      type: Date
    },
    endedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const Game = mongoose.model("Game", gameSchema);

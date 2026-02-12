import mongoose from "mongoose";

const moveSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    piece: {
      type: String,
      required: true
    },
    moveNumber: {
      type: Number,
      required: true
    },
    fenAfterMove: {
      type: String,
      required: true
    },
    timeTaken: {
      type: Number
    }
  },
  { timestamps: true }
);

export const Move = mongoose.model("Move", moveSchema);

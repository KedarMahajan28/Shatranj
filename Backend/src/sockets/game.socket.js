import { makeMove } from "../controllers/move.controller.js"
import { Game } from "../models/game.model.js"

const gameSocket = (io, socket) => {
  socket.on("joinGame", async ({ gameId }) => {
    socket.join(gameId)

    socket.gameId = gameId

    io.to(gameId).emit("playerJoined", {
      userId: socket.user._id,
      gameId
    })
  })

  socket.on("leaveGame", () => {
    if (!socket.gameId) return

    socket.leave(socket.gameId)

    io.to(socket.gameId).emit("playerLeft", {
      userId: socket.user._id
    })

    socket.gameId = null
  })

  socket.on("makeMove", async (data) => {
    try {
      const req = {
        params: { gameId: data.gameId },
        body: data,
        user: socket.user
      }

      let responseData

      const res = {
        status: () => ({
          json: (payload) => {
            responseData = payload.data
          }
        })
      }

      await makeMove(req, res)

      io.to(data.gameId).emit("movePlayed", responseData)
    } catch (error) {
      socket.emit("moveError", {
        message: error.message
      })
    }
  })

  socket.on("addSpectator", async ({ gameId }) => {
    socket.join(gameId)

    io.to(gameId).emit("spectatorJoined", {
      userId: socket.user._id
    })
  })

  socket.on("disconnect", async () => {
    if (!socket.gameId) return

    io.to(socket.gameId).emit("playerDisconnected", {
      userId: socket.user._id
    })

    await Game.findByIdAndUpdate(socket.gameId, {
      lastSeen: new Date()
    })
  })
}

export { gameSocket }

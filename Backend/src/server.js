import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import connectDB from './db/index.js';
import { gameSocket } from './sockets/game.socket.js';
import jwt from 'jsonwebtoken';
import { User } from './models/user.model.js';

connectDB().then(() => {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // ── Socket auth middleware 
  io.use(async (socket, next) => {
    try {
      // Read token from cookie (set by Express login route)
      const cookie = socket.handshake.headers.cookie ?? '';
      const match  = cookie.match(/accessToken=([^;]+)/);
      const token  = match?.[1] ?? socket.handshake.auth?.token;

      if (!token) return next(new Error('Unauthorized'));

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user    = await User.findById(decoded._id).select('-password -refreshToken');
      if (!user) return next(new Error('Unauthorized'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });


  io.on('connection', (socket) => {
    gameSocket(io, socket);
  });

  server.listen(process.env.PORT || 8000, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}).catch(console.error);
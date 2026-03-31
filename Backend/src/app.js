import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// middlewares
app.set('trust proxy', 1);

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

import userRouter from './routes/user.route.js';
import gameRouter from './routes/game.route.js';
import moveRouter from './routes/move.route.js';
import ratingRouter from './routes/rating.route.js';

app.use("/api/v1/users", userRouter);
app.use("/api/v1/games", gameRouter);
app.use("/api/v1/moves", moveRouter);
app.use("/api/v1/rating", ratingRouter);

// optional health check
app.get("/", (req, res) => {
    res.send("API is running...");
});

export { app };
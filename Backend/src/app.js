import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname setup (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// middlewares
app.set('trust proxy', 1); // Render proxy support

app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));


import userRouter from './routes/user.route.js';
import gameRouter from './routes/game.route.js';
import moveRouter from './routes/move.route.js';
import ratingRouter from './routes/rating.route.js';

app.use("/api/v1/users", userRouter);
app.use("/api/v1/games", gameRouter);
app.use("/api/v1/moves", moveRouter);
app.use("/api/v1/rating", ratingRouter);


const frontendPath = path.resolve(__dirname, '../Frontend');

app.use(express.static(frontendPath));

app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Handle 404 explicitly before catch-all
// app.use('/*', (req, res) => {
//     res.sendFile(path.join(frontendPath, 'index.html'));
// });
//app.get('/*', (req, res) => { res.sendFile(path.join(frontendPath, 'index.html')); });
export {app};
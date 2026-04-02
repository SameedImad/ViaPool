import dotenv from "dotenv"
import { connectDB } from "./db/index.js";
import { app } from './app.js'
import http from 'http';
import { initializeSocket } from './socket/index.js';
import { logger } from "./utils/logger.js";

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        const server = http.createServer(app);
        const io = initializeSocket(server);
        app.set("io", io);

        server.listen(process.env.PORT || 5000, () => {
            const port = process.env.PORT || 5000;
            logger.info("Server started", { url: `http://localhost:${port}` });
        })
    })
    .catch((err) => {
        logger.error("MongoDB boot connection failed", err);
    })

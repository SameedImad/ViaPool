import dotenv from "dotenv"
import { connectDB } from "./db/index.js";
import { app } from './app.js'
import http from 'http';
import { initializeSocket } from './socket/index.js';

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        const server = http.createServer(app);
        initializeSocket(server);

        server.listen(process.env.PORT || 5000, () => {
            console.log(`Server is running at http://localhost:${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);

const allowedOrigins = [
    "https://videoconfirencefrontend-ihwx.onrender.com",
    "http://localhost:3000"
];

connectToSocket(server);

app.set("port", (process.env.PORT || 8000));

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"] 
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
    // CRITICAL FIX: Using environment variable for secure connection
    const connectionDb = await mongoose.connect(process.env.MONGO_URI); 
    
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
    server.listen(app.get("port"), () => {
        console.log("Listening on port 8000");
    });
}

start();
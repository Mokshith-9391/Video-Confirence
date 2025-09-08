import express from "express";
import {createServer} from "node:http";
import mongoose from "mongoose";
import {connectToSocket} from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
connectToSocket(server);

app.set("port", (process.env.PORT || 8000));

app.use(cors({
    origin: "https://videoconfirencefrontend-ihwx.onrender.com",
    methods: ["GET", "POST"]
}));
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({extended: true, limit: "40kb"}));

app.use("/api/v1/users", userRoutes);

const start= async () => {
    
    const connectionDb = await mongoose.connect("mongodb+srv://Mokshith:Hitam%402026@cluster0.dheczpm.mongodb.net/");
    
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`)
  server.listen(app.get("port"), () => {
console.log("Listening on port 8000");
  });
}

start();
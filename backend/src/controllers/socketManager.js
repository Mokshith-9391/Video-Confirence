import { Server } from 'socket.io';
import { meetingAgentManager } from "./meetingAgentManager.js";
import { Meeting } from "../models/meeting.model.js";

function extractMeetingCode(roomKey) {
    try {
        if (roomKey.startsWith("http://") || roomKey.startsWith("https://")) {
            const url = new URL(roomKey);
            return url.pathname.replace(/^\//, '').split('/')[0];
        }
        return roomKey.replace(/^\//, '').split('?')[0].split('/')[0];
    } catch (e) {
        return roomKey;
    }
}

let connections = {};
let messages = {};
let timeOnline = {};

const allowedOrigins = [
    "https://videoconfirencefrontend-ihwx.onrender.com",
    "http://localhost:3000"
];

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST", "OPTIONS"] // <-- ADDED "OPTIONS" HERE
        }
    });

    io.on("connection", (socket) => {
        // ... all other socket logic remains the same
        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            meetingAgentManager.initRoomAgent(path, (roomId, actionItem) => {
                if (connections[roomId]) {
                    connections[roomId].forEach((id) => {
                        io.to(id).emit("action-item-detected", actionItem);
                    });
                }
            });

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
            }
            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; a++) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender']);
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id });
                console.log("messages", matchingRoom, ":", sender, data);

                connections[matchingRoom].forEach((id) => {
                    io.to(id).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        socket.on("transcription-chunk", (text, speaker) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found) {
                meetingAgentManager.feedTranscription(matchingRoom, speaker, text);
                connections[matchingRoom].forEach((id) => {
                    io.to(id).emit("transcription-chunk-received", text, speaker);
                });
            }
        });

        socket.on("disconnect", () => {
            delete timeOnline[socket.id];
            let roomKey;
            for (const [k, v] of Object.entries(connections)) {
                if (v.includes(socket.id)) {
                    roomKey = k;
                    break;
                }
            }

            if (roomKey) {
                const index = connections[roomKey].indexOf(socket.id);
                if (index > -1) {
                    connections[roomKey].forEach(id => {
                        if (id !== socket.id) {
                            io.to(id).emit("user-left", socket.id);
                        }
                    });
                    connections[roomKey].splice(index, 1);
                }

                if (connections[roomKey].length === 0) {
                    const roomKeyToClose = roomKey;
                    delete connections[roomKey];

                    (async () => {
                        try {
                            const result = await meetingAgentManager.closeRoomAgent(roomKeyToClose);
                            console.log(`[SocketManager] Summary and Action Items generated for room ${roomKeyToClose}`);
                            const code = extractMeetingCode(roomKeyToClose);
                            await Meeting.updateMany(
                                { meetingCode: code },
                                { $set: { summary: result.summary, actionItems: result.actionItems } }
                            );
                        } catch (err) {
                            console.error("[SocketManager] Error closing agent or saving summary:", err);
                        }
                    })();
                }
            }
        });
    });
};
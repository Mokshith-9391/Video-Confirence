import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../utils/constants"; // Ensure this file exists

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${BACKEND_URL}/api/v1/users`
});

export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);

    const [userData, setUserData] = useState(authContext);

    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            });

            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch (err) {
            throw err;
        }
    };

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data;
        } catch (err) {
            throw err;
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            const token = localStorage.getItem("token");
            
            // CASE 1: HOSTING A NEW MEETING (No code provided)
            if (!meetingCode || meetingCode.trim() === "") {
                let request = await client.post("/add_to_activity", {
                    token: token,
                    meeting_code: null 
                });
                
                // CRITICAL FIX: Return the actual code string, not the whole object
                return request.data.meetingCode; 
            }

            // CASE 2: JOINING AN EXISTING MEETING
            await client.post("/add_to_activity", {
                token: token,
                meeting_code: meetingCode
            });
            
            // Return the code passed by the user so we can navigate to it
            return meetingCode; 

        } catch (e) {
            console.error("Error adding to history:", e);
            throw e;
        }
    };

    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );

};
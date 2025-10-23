import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js"; 
import bcrypt from "bcrypt";
import crypto from "crypto";

const login = async(req, res) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Please Provide username and password"});
    }
    try {
        const user = await User.findOne({username});
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid credentials"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            let token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token: token});
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid credentials"});
        }
    } catch (e) {
        console.error("Login Error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Something went wrong: ${e.message}`});
    }
}

const registerUser = async(req, res) => {
    const {name, username, password} = req.body;
    try {
        const existingUser = await User.findOne({username});
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({message: "User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });
        
        try {
            await newUser.save();
        } catch (saveError) {
            console.error("Save to database failed:", saveError);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Failed to save user: ${saveError.message}`});
        }
        
        res.status(httpStatus.CREATED).json({message: "User registered successfully"});
    } catch (e) {
        console.error("Registration Error:", e);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Something went wrong: ${e.message}`});
    }
}

const validateToken = async(req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) {
        return res.status(httpStatus.BAD_REQUEST).json({message: "Token not found"});
    }
    try {
        const user = await User.findOne({token});
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid token"});
        }
        return res.status(httpStatus.OK).json({message: "Token is valid"});
    } catch (e) {
        console.error("Token Validation Error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Something went wrong: ${e.message}`});
    }
}

const addToActivity = async(req, res) => {
    const { userId } = req.body; 

    try {
        const uniqueCode = crypto.randomBytes(3).toString("hex").toUpperCase();
        
        const newMeeting = new Meeting({
            user_id: userId || 'anonymous',
            meetingCode: uniqueCode,
        });
        
        await newMeeting.save();
        
        return res.status(httpStatus.CREATED).json({
            message: "Meeting room created successfully.",
            meetingCode: uniqueCode
        });

    } catch (e) {
        console.error("Add to Activity Error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Failed to create meeting: ${e.message}`
        });
    }
}

export {login, registerUser, validateToken, addToActivity};
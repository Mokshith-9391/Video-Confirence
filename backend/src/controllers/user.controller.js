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
    const { token, meeting_code } = req.body; 
    const code = meeting_code || req.body.meetingCode;

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found" });
        }
        
        let targetCode = code;
        if (!targetCode || targetCode.trim() === "") {
            targetCode = crypto.randomBytes(3).toString("hex").toUpperCase();
        }
        
        // Prevent duplicate meeting history item for the same user in the same meeting code session
        const existingMeeting = await Meeting.findOne({ user_id: user._id, meetingCode: targetCode });
        if (existingMeeting) {
            return res.status(httpStatus.OK).json({
                message: "Meeting already in activity history.",
                meetingCode: targetCode
            });
        }

        const newMeeting = new Meeting({
            user_id: user._id,
            meetingCode: targetCode,
            date: new Date()
        });
        
        await newMeeting.save();
        
        return res.status(httpStatus.CREATED).json({
            message: "Meeting added to activity successfully.",
            meetingCode: targetCode
        });

    } catch (e) {
        console.error("Add to Activity Error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Failed to add meeting to activity: ${e.message}`
        });
    }
}

const getAllActivity = async(req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token is required" });
    }
    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }
        const meetings = await Meeting.find({ user_id: user._id }).sort({ date: -1 });
        return res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        console.error("Get All Activity Error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
}

// FINAL FIX: This must include all functions required by the router.
export { login, registerUser, validateToken, addToActivity, getAllActivity };

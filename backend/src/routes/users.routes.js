import { Router } from "express";
import { login, registerUser, validateToken } from "../controllers/user.controller.js";

const router= Router();

router.route("/login").post(login);
router.route("/register").post(registerUser);
router.route("/validate-token").get(validateToken);



export default router;
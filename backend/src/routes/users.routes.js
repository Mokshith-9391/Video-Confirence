import { Router } from "express";
import { login, registerUser, validateToken, addToActivity } from "../controllers/user.controller.js";

const router= Router();

router.route("/login").post(login);
router.route("/register").post(registerUser);
router.route("/validate-token").get(validateToken);
router.route("/add_to_activity").post(addToActivity);
router.route("/get_all_activity");

export default router;

import express from "express";

import { authController } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/activate/:activeToken", authController.activateEmail);
router.post("/googleLogin", authController.googleLogin);

export default router;

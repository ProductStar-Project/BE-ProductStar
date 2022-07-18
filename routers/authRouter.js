import express from "express";

import { authController } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/activate/:active-token", authController.activateEmail);
router.post("/google-login", authController.googleLogin);
router.post("/facebook-login", authController.facebookLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/change-password", authController.changePassword);

export default router;

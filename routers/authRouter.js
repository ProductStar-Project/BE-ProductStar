import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authController } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/activate/:active-token", authController.activateEmail);
router.post("/google-login", authController.googleLogin);
router.post("/facebook-login", authController.facebookLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/change-password", authMiddleware, authController.changePassword);
router.post("/refresh-token", authController.refreshToken);
router.get("/logout", authController.logout);

export default router;

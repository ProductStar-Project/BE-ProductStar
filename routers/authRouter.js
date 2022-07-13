import express from "express";

import { authController } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login", authController.login);
router.get("/register", authController.register);

export default router;

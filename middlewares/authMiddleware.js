import { authModel } from "../model/authModel.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").split(" ")[1];
    if (!token)
      return res.status(400).json({ msg: "invalid token", user: token });
    const idUser = jwt.verify(token, process.env.YOUR_ACCESS_TOKEN_KEY);
    if (!idUser)
      return res.status(400).json({ msg: "Invalid Authentication." });

    const user = await authModel.findById(idUser.id);
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

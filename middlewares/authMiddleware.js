import { authModel } from "../model/authModel.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      jwt.verify(
        token,
        process.env.YOUR_ACCESS_TOKEN_KEY,
        async (err, result) => {
          if (err) {
            return res.status(403).json("Token is not valid!");
          }
          const user = await authModel.findById(result.id);
          req.user = user;
          next();
        }
      );
    } else {
      res.status(401).json("You are not authenticated!");
    }
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

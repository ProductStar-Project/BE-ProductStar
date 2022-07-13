import { authModel } from "../model/authModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const authController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    const user = await authModel.findOne({ email: email });

    if (!user)
      return res.status(400).json({ msg: "This is email does not exits" });

    const passwordMatch = bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(400).json({ msg: "This is not a valid password" });

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });

    return res
      .status(200)
      .json({ accessToken, refreshToken, user: { user, password: "" } });
  },
  register: async (req, res) => {
    const passwordHash = await bcrypt.hash("123456", 12);
    const user = new authModel({
      email: "tuannguyen@gmail.com",
      password: passwordHash,
    });
    user.save();

    if (!user) return res.status(400).json({ msg: "This is failed" });
    return res.status(200).json({ user });
  },
};

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.YOUR_ACCESS_TOKEN_KEY);
};
const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.YOUR_REFRESH_TOKEN_KEY);
};

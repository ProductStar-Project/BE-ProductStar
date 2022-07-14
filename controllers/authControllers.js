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

    const { password: passwordHidden, ...rest } = user._doc;

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: { ...rest },
    });
  },
  register: async (req, res) => {
    const { email, password } = req.body;

    const user = await authModel.findOne({ email: email });

    if (user) {
      return res.status(400).json({ msg: "This is email is alredeay exits" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Please enter your password > 6" });
    }
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = new authModel({
      email: email,
      password: passwordHash,
    });
    await newUser.save();
    console.log(newUser._doc);
    // const activation_token = createActivationToken({ ...newUser._doc });
    if (!newUser) return res.status(400).json({ msg: "This is failed" });
    return res.status(200).json({ msg: "Register success" });
  },
};

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.YOUR_ACCESS_TOKEN_KEY);
};
const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.YOUR_REFRESH_TOKEN_KEY);
};

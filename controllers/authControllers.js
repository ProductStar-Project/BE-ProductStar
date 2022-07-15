import dotenv from "dotenv";
import { authModel } from "../model/authModel.js";
import { sendEmail } from "../utils/sendMail.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { google } from "googleapis";
const { OAuth2 } = google.auth;

dotenv.config();

export const authController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    const user = await authModel.findOne({ email: email });

    if (!user)
      return res.status(400).json({ msg: "This is email does not exits" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ msg: "This is not a valid password" });
    }

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/api/refreshToken",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30days
    });

    const { password: passwordHidden, ...rest } = user._doc;

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: { ...rest },
    });
  },
  register: async (req, res) => {
    try {
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
      const activation_token = createActiveToken({ ...newUser._doc });
      const url = `${process.env.CLIENT_URL}/auth/activate/${activation_token}`;
      sendEmail(email, url, "Verify your email address");
      res.json({
        msg: "Register Success! Please activate your email to start.",
      });
      //  if (!newUser) return res.status(400).json({ msg: "This is failed" });
      // return res.status(200).json({ msg: "Register success" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  activateEmail: async (req, res) => {
    try {
      const { activeToken } = req.params;

      const user = jwt.verify(activeToken, process.env.YOUR_ACTIVE_TOKEN_KEY);
      console.log(user);

      const { email, password } = user;

      const check = await authModel.findOne({ email });
      if (check)
        return res.status(400).json({ msg: "This email already exists." });

      const newUser = new authModel({
        email,
        password,
      });
      await newUser.save();

      // try {
      //   if (role === "company") {
      //     let newCompany = new Company({
      //       idCompany: id._id,
      //     });
      //     await newCompany.save();
      //   }
      // } catch (err) {
      //   console.log("err:", err.message);
      // }

      res.send(
        `<div style=text-align:center><h1>Account has been activated!</h1>
        <a href="${process.env.CLIENT_URL_FE}/login">Link Trang Dang Nhap<a></div>`
      );
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  googleLogin: async (req, res) => {
    const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID);

    try {
      const { tokenId } = req.body;
      const verify = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.MAILING_SERVICE_CLIENT_ID,
      });

      const { email_verified, email } = verify.payload;
      // const { email_verified, email, name, picture } = verify.payload;

      const password = email + process.env.YOUR_GOOGLE_SECRET;

      const passwordHash = await bcrypt.hash(password, 12);

      if (!email_verified)
        return res.status(400).json({ msg: "Email verification failed." });

      const user = await authModel.findOne({ email });

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(400).json({ msg: "Password is incorrect." });

        const refreshToken = createRefreshToken({ id: user._id });
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          path: "/user/refreshToken",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: "Login success!" });
      } else {
        const newUser = new authModel({
          email,
          password: passwordHash,
        });
        await newUser.save();

        const refreshToken = createRefreshToken({ id: newUser._id });
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          path: "/user/refreshToken",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: "Login success!" });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

const createActiveToken = (payload) => {
  return jwt.sign(payload, process.env.YOUR_ACTIVE_TOKEN_KEY);
};

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.YOUR_ACCESS_TOKEN_KEY);
};
const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.YOUR_REFRESH_TOKEN_KEY);
};

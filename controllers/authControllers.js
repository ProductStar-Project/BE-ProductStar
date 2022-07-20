import dotenv from "dotenv";
import { authModel } from "../model/authModel.js";
import { sendEmail } from "../utils/sendMail.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fetch from "node-fetch";

import { google } from "googleapis";
import { generateP } from "../utils/generatePassword.js";
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
      path: "/api/v1/auth/refreshToken",
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
      const { email, password, firstname, lastname } = req.body;
      const username = `${firstname} ${lastname}`;

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
        firstname,
        lastname,
        username,
      });
      const activation_token = createActiveToken({ ...newUser._doc });
      const url = `${process.env.CLIENT_URL}/auth/activate/${activation_token}`;
      sendEmail(email, url, "Verify your email address", "active");
      res.json({
        msg: "Register Success! Please activate your email to start.",
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  activateEmail: async (req, res) => {
    try {
      const { activeToken } = req.params;

      const user = jwt.verify(activeToken, process.env.YOUR_ACTIVE_TOKEN_KEY);

      const { email, password, firstname, lastname, username } = user;

      const check = await authModel.findOne({ email });
      if (check)
        return res.status(400).json({ msg: "This email already exists." });

      const newUser = new authModel({
        email,
        password,
        firstname,
        lastname,
        username,
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
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await authModel.findOne({ email: email });
      if (!user) {
        return res.status(400).json({ msg: "This is email does not exits" });
      }
      const newPassword = generateP();
      const passwordHash = await bcrypt.hash(newPassword, 12);

      await authModel.findOneAndUpdate(
        { email },
        { password: passwordHash },
        { new: true }
      );
      sendEmail(email, newPassword, "Your new password", "forgot");
      return res
        .status(200)
        .json({ msg: "Reset password success, please check your email" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  changePassword: async (req, res) => {
    try {
      const { email, password, newPassword } = req.body;
      const user = await authModel.findOne({ email: email });
      if (!user)
        return res.status(400).json({ msg: "This is email does not exits" });
      const isPassword = await bcrypt.compare(password, user.password);

      if (!isPassword)
        return res.status(400).json({ msg: "Your password don't match" });

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await authModel.findOneAndUpdate(
        { email },
        { password: passwordHash },
        { new: true }
      );

      return res.status(200).json({ msg: "Your password is change success !" });
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
      // const { email_verified, email } = verify.payload;
      const { email_verified, email, name, picture } = verify.payload;

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
          path: "/api/v1/auth/refreshToken",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: "Login success!" });
      } else {
        const newUser = new authModel({
          email,
          password: passwordHash,
          username: name,
          avatar: picture,
        });
        await newUser.save();

        const refreshToken = createRefreshToken({ id: newUser._id });
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          path: "/api/v1/auth/refreshToken",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: "Login success!" });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  facebookLogin: async (req, res) => {
    try {
      const { accessToken, userID } = req.body;

      const URL = `https://graph.facebook.com/v4.0/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`;

      const data = await fetch(URL)
        .then((res) => res.json())
        .then((res) => {
          return res;
        });
      const { email, name, picture } = data;
      const password = email + process.env.FACEBOOK_SECRET;

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await authModel.findOne({ email });
      console.log(user);

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(400).json({ msg: "Password is incorrect." });

        const refresh_token = createRefreshToken({ id: user._id });
        res.cookie("refreshtoken", refresh_token, {
          httpOnly: true,
          path: "/api/v1/auth/refresh_token",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: "Login success!" });
      } else {
        const newUser = new authModel({
          email,
          password: passwordHash,
          username: name,
          avatar: picture.url,
        });

        await newUser.save();

        const refresh_token = createRefreshToken({ id: newUser._id });
        res.cookie("refreshtoken", refresh_token, {
          httpOnly: true,
          path: "/api/v1/auth/refresh_token",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: "Login success!" });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  refreshToken: async (req, res) => {
    console.log(req.headers.cookie.split("=")[1]);
    return res.json({ id: req.user._id });
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

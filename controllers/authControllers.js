import { authModel } from "../model/authModel.js";
import { sendEmail } from "../ultis/sendMail.js";
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
      const { activation_token } = req.body;
      const user = jwt.verify(
        activation_token,
        process.env.YOUR_ACTIVE_TOKEN_KEY
      );

      const { firstname, lastname, username, email, password, role } = user;

      const check = await Users.findOne({ email });
      if (check)
        return res.status(400).json({ msg: "This email already exists." });

      const newUser = new Users({
        firstname,
        lastname,
        username,
        email,
        password,
        role,
      });
      await newUser.save();

      try {
        if (role === "company") {
          let newCompany = new Company({
            idCompany: id._id,
          });
          await newCompany.save();
        }
      } catch (err) {
        console.log("err:", err.message);
      }

      res.json({ msg: "Account has been activated!" });
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

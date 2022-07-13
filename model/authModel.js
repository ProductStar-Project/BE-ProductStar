import mongoose from "mongoose";

const authScheme = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamp: true }
);

export const authModel = mongoose.model("auth", authScheme);

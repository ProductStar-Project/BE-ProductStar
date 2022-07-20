import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routers/authRouter.js";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const URI =
  "mongodb+srv://admin:dLmQ5mCE1pyd0kwU@productstar.xnqpvmv.mongodb.net/?retryWrites=true&w=majority";

app.use(bodyParser.json({ limit: "30mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "30mb" }));
app.use(cors());

// app.get("http://localhost:5000/auth/activate/:token",);

app.use("/api/v1/auth", authRouter);

mongoose
  .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("connected to DB");
    app.listen(PORT, () => {
      console.log("Sever running on port " + PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });

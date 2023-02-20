const express = require("express");

const userRouter = require("./routers/userRouter");

require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", userRouter);

module.exports = app;

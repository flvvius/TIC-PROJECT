require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { db } = require("./config/db");
const watchersRoutes = require("./routes/watchersRoutes");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const boardRoutes = require("./routes/boardRoutes");
const columnRoutes = require("./routes/columnRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
const port = 8081;

const server = http.createServer(app);
const io = socketIO(server);

app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-cache');
  }
}));

app.use(cors({
  origin: "http://localhost:8080",
  credentials: true,
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

app.use("/", watchersRoutes(io, db));

app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", boardRoutes);
app.use("/", columnRoutes);
app.use("/", taskRoutes);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

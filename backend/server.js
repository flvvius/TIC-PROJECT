const express = require("express");
const { auth, db } = require("./config/db");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
const port = 8081;

const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

const usersCollection = db.collection("users");

function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.cookie("token", token, {
    httpOnly: false, // am stat 3 ore la mizeria asta
    secure: false,
    sameSite: "lax",
    domain: "localhost",
    maxAge: 60 * 60 * 1000,
  });
}

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  console.log("AuthMiddleware - Received token:", token);

  if (!token) {
    return res.status(401).json({ error: "No token. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("AuthMiddleware - Token decoded:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("AuthMiddleware - Error verifying token:", error.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

app.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }

    const existingUserSnap = await usersCollection.where("email", "==", email).get();
    if (!existingUserSnap.empty) {
      return res.status(400).json({ error: "User already exists." });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUserId = uuidv4();
    await usersCollection.doc(newUserId).set({
      email,
      passwordHash: hashedPassword,
      displayName: displayName || "Anonymous",
      createdAt: new Date(),
    });

    return res.status(201).json({ message: "User registered." });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }

    const userSnap = await usersCollection.where("email", "==", email).limit(1).get();
    if (userSnap.empty) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    const match = await bcrypt.compare(password, userData.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const payload = {
      uid: userDoc.id,
      email: userData.email,
    };

    setTokenCookie(res, payload);
    res.json({ message: "Logged in successfully." });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out." });
});

app.get("/profile", authMiddleware, (req, res) => {
  try {
    const { uid, email } = req.user;
    return res.json({ user: { uid, email } });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

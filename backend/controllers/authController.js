const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db");

const usersCollection = db.collection("users");

function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.cookie("token", token, {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    domain: "localhost",
    maxAge: 60 * 60 * 1000,
  });
}

async function register(req, res) {
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
}

async function login(req, res) {
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
}

function logout(req, res) {
  res.clearCookie("token");
  return res.json({ message: "Logged out." });
}

module.exports = {
  register,
  login,
  logout,
};

const express = require("express");
const { auth, db } = require("./config/db");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = 8081;

app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-cache');
  }
}));

console.log("Static files being served from:", path.join(__dirname, "uploads"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user.uid;
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, `${userId}-${uniqueSuffix}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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
    httpOnly: false,
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

const sharp = require("sharp");

app.post("/api/profile/uploadPicture", authMiddleware, upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const metadata = await sharp(req.file.path).metadata();
    if (metadata.width > 1000 || metadata.height > 1000) {
      await sharp(req.file.path)
        .resize(1000, 1000, { fit: "inside" })
        .toFile(req.file.path);
    }

    const { uid } = req.user;
    const filePath = `uploads/${req.file.filename}`;
    await db.collection("users").doc(uid).update({ profilePicture: filePath });

    res.json({ message: "Profile picture uploaded successfully.", profilePicture: filePath });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Failed to upload profile picture." });
  }
});

app.post("/api/profile/updateName", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { displayName } = req.body;

    if (!displayName) {
      return res.status(400).json({ error: "Name is required." });
    }

    await usersCollection.doc(userId).update({ displayName });
    res.json({ message: "Name updated successfully." });
  } catch (error) {
    console.error("Error updating name:", error);
    res.status(500).json({ error: "Failed to update name." });
  }
});

app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userSnap = await usersCollection.doc(userId).get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found." });
    }

    const userData = userSnap.data();

    res.json({
      user: {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName || "Anonymous",
        profilePicture: userData.profilePicture || null,
        createdAt: userData.createdAt.toDate(),
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.get("/api/boards", authMiddleware, async (req, res) => {
  try {
    const { email } = req.user;
    const boardsSnap = await db
      .collection("boards")
      .where("members", "array-contains", email)
      .get();

    const boards = boardsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch boards." });
  }
});

app.post("/api/boards", authMiddleware, async (req, res) => {
  try {
    const { name, invitedUsers = [], ownerEmail } = req.body;
    const { email } = req.user;

    if (!name) {
      return res.status(400).json({ error: "Board name is required." });
    }

    const validEmails = [];
    const invalidEmails = [];

    for (const invitedEmail of invitedUsers) {
      const userSnap = await db.collection("users").where("email", "==", invitedEmail).limit(1).get();
      if (!userSnap.empty) {
        validEmails.push(invitedEmail);
      } else {
        invalidEmails.push(invitedEmail);
      }
    }

    if (invalidEmails.length) {
      return res.status(400).json({
        error: "Some emails are invalid.",
        invalidEmails,
      });
    }

    const members = [email, ...validEmails];
    const newBoard = {
      name,
      members,
      ownerEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const boardRef = await db.collection("boards").add(newBoard);

    res.status(201).json({ id: boardRef.id, ...newBoard });
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: "Failed to create board." });
  }
});


app.get("/api/boards/:boardId", authMiddleware, async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const boardSnap = await db.collection("boards").doc(boardId).get();

    if (!boardSnap.exists) {
      return res.status(404).json({ error: "Board not found." });
    }

    const boardData = boardSnap.data();
    const membersDetails = [];

    for (const email of boardData.members || []) {
      const userSnap = await usersCollection.where("email", "==", email).get();
      console.log("USER SNAP:          " + userSnap.docs[0].data()["email"])
      if (userSnap.docs[0].data()) {
        membersDetails.push({
          email,
          ...userSnap.docs[0].data(),
        });
      }
    }

    console.log("BOARD DATA:         " + boardData.members)
    console.log("MEMBER DETAILS:     " + membersDetails[0].email)

    res.json({
      ...boardData,
      members: membersDetails,
    });
  } catch (error) {
    console.error("Error fetching board:", error);
    res.status(500).json({ error: "Failed to fetch board." });
  }
});

app.delete("/api/boards/:boardId", authMiddleware, async (req, res) => {
  try {
    const boardId = req.params.boardId;
    await db.collection("boards").doc(boardId).delete();
    res.json({ message: `Board ${boardId} deleted.` });
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ error: "Failed to delete board." });
  }
});

app.get("/api/boards/:boardId/columns", authMiddleware, async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const colRef = db.collection("boards").doc(boardId).collection("columns");
    const colSnap = await colRef.orderBy("order").get();

    const columns = colSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(columns);
  } catch (error) {
    console.error("Error fetching columns:", error);
    res.status(500).json({ error: "Failed to fetch columns." });
  }
});

app.post("/api/boards/:boardId/columns/:colId", authMiddleware, async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const colId = req.params.colId;
    const { title, order } = req.body;

    const colRef = db
      .collection("boards")
      .doc(boardId)
      .collection("columns")
      .doc(colId);

    await colRef.set({ title, order }, { merge: true });
    res.status(201).json({ message: `Column ${colId} created/updated.` });
  } catch (error) {
    console.error("Error creating/updating column:", error);
    res.status(500).json({ error: "Failed to create/update column." });
  }
});

app.get("/api/boards/:boardId/tasks", authMiddleware, async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const tasksRef = db.collection("boards").doc(boardId).collection("tasks");
    const tasksSnap = await tasksRef.orderBy("order").get();

    const tasks = tasksSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
});

app.post("/api/boards/:boardId/tasks", authMiddleware, async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const { title, columnId, order } = req.body;

    const tasksRef = db.collection("boards").doc(boardId).collection("tasks");
    const newTaskRef = await tasksRef.add({
      title,
      columnId,
      order,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: newTaskRef.id,
      title,
      columnId,
      order,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task." });
  }
});

app.patch("/api/boards/:boardId/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const { boardId, taskId } = req.params;
    const updates = req.body;

    const taskRef = db
      .collection("boards")
      .doc(boardId)
      .collection("tasks")
      .doc(taskId);

    await taskRef.update(updates);
    res.json({ message: `Task ${taskId} updated.` });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task." });
  }
});

app.post("/api/boards/:boardId/invite", authMiddleware, async (req, res) => {
  try {
    const { boardId } = req.params;
    const emails = req.body.emails || [];

    if (!emails.length) {
      return res.status(400).json({ error: "No emails provided." });
    }

    const validEmails = [];
    const alreadyMembers = [];
    const boardRef = db.collection("boards").doc(boardId);
    const boardSnap = await boardRef.get();

    if (!boardSnap.exists) {
      return res.status(404).json({ error: "Board not found." });
    }

    const currentMembers = boardSnap.data().members || [];

    for (const email of emails) {
      if (currentMembers.includes(email)) {
        alreadyMembers.push(email);
        continue;
      }

      const userSnap = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!userSnap.empty) {
        validEmails.push(email);
      } else {
        console.warn(`User not found for email: ${email}`);
      }
    }

    if (validEmails.length) {
      await boardRef.update({
        members: admin.firestore.FieldValue.arrayUnion(...validEmails),
      });
    }

    res.json({
      message: "Invite processed.",
      validEmails,
      alreadyMembers,
      invalidEmails: emails.filter(
        (email) => !validEmails.includes(email) && !alreadyMembers.includes(email)
      ),
    });
  } catch (error) {
    console.error("Error inviting members:", error);
    res.status(500).json({ error: "Failed to invite members." });
  }
});

app.delete("/api/boards/:boardId/members/:email", authMiddleware, async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const email = req.params.email;

    const boardRef = db.collection("boards").doc(boardId);
    await boardRef.update({
      members: admin.firestore.FieldValue.arrayRemove(email),
    });

    res.json({ message: `Member ${email} removed successfully.` });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove member." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

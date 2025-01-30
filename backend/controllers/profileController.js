const { db } = require("../config/db");
const { upload, resizeIfNeeded } = require("../middlewares/uploadMiddleware");

const usersCollection = db.collection("users");

async function uploadPicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    await resizeIfNeeded(req.file.path);

    const userId = req.user.uid;
    const filePath = `uploads/${req.file.filename}`;
    await usersCollection.doc(userId).update({ profilePicture: filePath });

    res.json({ 
      message: "Profile picture uploaded successfully.", 
      profilePicture: filePath 
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Failed to upload profile picture." });
  }
}

async function updateName(req, res) {
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
}

async function getProfile(req, res) {
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
}

module.exports = {
  uploadPicture,
  updateName,
  getProfile,
};

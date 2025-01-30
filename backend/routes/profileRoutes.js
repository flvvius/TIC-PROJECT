const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/uploadMiddleware");
const { uploadPicture, updateName, getProfile } = require("../controllers/profileController");

router.post("/api/profile/uploadPicture", authMiddleware, upload.single("profilePicture"), uploadPicture);
router.post("/api/profile/updateName", authMiddleware, updateName);
router.get("/profile", authMiddleware, getProfile);

module.exports = router;

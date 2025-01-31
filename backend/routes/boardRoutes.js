const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  createBoard,
  getBoard,
  deleteBoard,
  inviteMembers,
  removeMember,
  getPaginatedBoards,
} = require("../controllers/boardController");

router.get("/api/boards/paged", authMiddleware, getPaginatedBoards);

router.post("/api/boards", authMiddleware, createBoard);

router.get("/api/boards/:boardId", authMiddleware, getBoard);

router.delete("/api/boards/:boardId", authMiddleware, deleteBoard);

router.post("/api/boards/:boardId/invite", authMiddleware, inviteMembers);

router.delete("/api/boards/:boardId/members/:email", authMiddleware, removeMember);

module.exports = router;

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

router.get("/api/boards/:boardId/columns/:colId/tasks", authMiddleware, getTasks);

router.post("/api/boards/:boardId/columns/:colId/tasks", authMiddleware, createTask);

router.patch("/api/boards/:boardId/columns/:colId/tasks/:taskId", authMiddleware, updateTask);

router.delete("/api/boards/:boardId/columns/:colId/tasks/:taskId", authMiddleware, deleteTask);

module.exports = router;

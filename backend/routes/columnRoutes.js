const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  getColumns,
  createOrUpdateColumn,
} = require("../controllers/columnController");

router.get("/api/boards/:boardId/columns", authMiddleware, getColumns);

router.post("/api/boards/:boardId/columns/:colId", authMiddleware, createOrUpdateColumn);

module.exports = router;

const express = require("express");
const router = express.Router();
const { initWatchers } = require("../controllers/watchersController");

module.exports = (io, db) => {
  const { listenBoard } = initWatchers(db, io);

  router.get("/listen/:boardId", listenBoard);

  return router;
};

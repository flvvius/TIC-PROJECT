const { db } = require("../config/db");

async function getColumns(req, res) {
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
}

async function createOrUpdateColumn(req, res) {
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
}

module.exports = {
  getColumns,
  createOrUpdateColumn,
};

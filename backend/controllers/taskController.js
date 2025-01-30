const admin = require("firebase-admin");
const { db } = require("../config/db");

async function getTasks(req, res) {
  try {
    const { boardId, colId } = req.params;
    const tasksRef = db
      .collection("boards")
      .doc(boardId)
      .collection("columns")
      .doc(colId)
      .collection("tasks");

    const tasksSnap = await tasksRef.get();

    const tasks = tasksSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks in column:", error);
    res.status(500).json({ error: "Failed to fetch tasks." });
  }
}

async function createTask(req, res) {
  try {
    const { boardId, colId } = req.params;
    const { title, order } = req.body;

    const tasksRef = db
      .collection("boards")
      .doc(boardId)
      .collection("columns")
      .doc(colId)
      .collection("tasks");

    const newTaskRef = await tasksRef.add({
      title,
      order: order ?? 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      id: newTaskRef.id,
      title,
      order: order ?? 0,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating task in column:", error);
    res.status(500).json({ error: "Failed to create task." });
  }
}

async function updateTask(req, res) {
  try {
    const { boardId, colId, taskId } = req.params;
    const updates = req.body;

    const taskRef = db
      .collection("boards")
      .doc(boardId)
      .collection("columns")
      .doc(colId)
      .collection("tasks")
      .doc(taskId);

    await taskRef.update(updates);

    res.json({ message: `Task ${taskId} in column ${colId} updated.` });
  } catch (error) {
    console.error("Error updating task in column:", error);
    res.status(500).json({ error: "Failed to update task." });
  }
}

async function deleteTask(req, res) {
  try {
    const { boardId, colId, taskId } = req.params;

    const taskRef = db
      .collection("boards")
      .doc(boardId)
      .collection("columns")
      .doc(colId)
      .collection("tasks")
      .doc(taskId);

    await taskRef.delete();

    res.json({ message: `Task ${taskId} in column ${colId} deleted.` });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task." });
  }
}

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};

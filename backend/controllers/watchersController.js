function initWatchers(db, io) {
    function watchTasksSubcollection(boardId, colId) {
      const tasksRef = db
        .collection("boards")
        .doc(boardId)
        .collection("columns")
        .doc(colId)
        .collection("tasks");
  
      tasksRef.onSnapshot((tasksSnap) => {
        tasksSnap.docChanges().forEach((change) => {
          const taskId = change.doc.id;
          const taskData = change.doc.data();
  
          if (change.type === "added") {
            io.emit("taskAdded", {
              boardId,
              columnId: colId,
              id: taskId,
              ...taskData,
            });
          } else if (change.type === "modified") {
            io.emit("taskModified", {
              boardId,
              columnId: colId,
              id: taskId,
              ...taskData,
            });
          } else if (change.type === "removed") {
            io.emit("taskRemoved", {
              boardId,
              columnId: colId,
              id: taskId,
              ...taskData,
            });
          }
        });
      });
    }
  
    async function listenBoard(req, res) {
      const { boardId } = req.params;
      const boardRef = db.collection("boards").doc(boardId);
  
      boardRef.onSnapshot((boardSnap) => {
        if (!boardSnap.exists) return;
        const boardData = boardSnap.data();
        io.emit("boardUpdated", {
          id: boardSnap.id,
          ...boardData,
        });
      });
  
      const columnsRef = boardRef.collection("columns");
      columnsRef.onSnapshot((colSnap) => {
        colSnap.docChanges().forEach((colChange) => {
          const colId = colChange.doc.id;
          const colData = colChange.doc.data();
  
          if (colChange.type === "added") {
            io.emit("columnAdded", { id: colId, ...colData });
            watchTasksSubcollection(boardId, colId);
          } else if (colChange.type === "modified") {
            io.emit("columnModified", { id: colId, ...colData });
          } else if (colChange.type === "removed") {
            io.emit("columnRemoved", { id: colId, ...colData });
          }
        });
      });
  
      const snapshot = await columnsRef.get();
      snapshot.forEach((doc) => {
        watchTasksSubcollection(boardId, doc.id);
      });
  
      res.send(`Listening to changes for boardId: ${boardId}`);
    }
  
    return { listenBoard };
  }
  
  module.exports = { initWatchers };
  
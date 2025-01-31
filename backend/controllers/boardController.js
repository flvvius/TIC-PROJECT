const admin = require("firebase-admin");
const { db } = require("../config/db");

async function getPaginatedBoards(req, res) {
    try {
      const userEmail = req.user.email;
      let { limit, startAfter } = req.query;
      limit = parseInt(limit) || 5;
  
      console.log("Limit:", limit);
      console.log("Start After:", startAfter);
  
      let queryRef = db
        .collection("boards")
        .where("members", "array-contains", userEmail)
        .orderBy("createdAt", "desc")
        .limit(limit);
  
      if (startAfter) {
        const startAfterNum = Number(startAfter);
        if (!isNaN(startAfterNum) && startAfterNum > 0) {
          const admin = require("firebase-admin");
          const startAfterTS = admin.firestore.Timestamp.fromMillis(startAfterNum);
  
          queryRef = queryRef.startAfter(startAfterTS);
        }
      }
  
      const snapshot = await queryRef.get();
  
      const boards = [];
      snapshot.forEach(doc => {
        boards.push({
          id: doc.id,
          ...doc.data(),
        });
      });
  
      let nextPageCursor = null;
      if (boards.length === limit) {
        const lastDoc = boards[boards.length - 1];
        if (lastDoc.createdAt) {
          const lastCreated = lastDoc.createdAt.toMillis
            ? lastDoc.createdAt.toMillis()
            : lastDoc.createdAt;
  
          nextPageCursor = lastCreated;
        }
      }
  
      console.log("Boards:", boards);
      console.log("Next Page Cursor:", nextPageCursor);
  
      return res.json({
        boards,
        nextPageCursor,
      });
    } catch (error) {
      console.error("Error fetching paged boards:", error);
      return res.status(500).json({ error: "Failed to fetch paged boards." });
    }
}  

async function createBoard(req, res) {
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
}

async function getBoard(req, res) {
  try {
    const boardId = req.params.boardId;
    const boardSnap = await db.collection("boards").doc(boardId).get();

    if (!boardSnap.exists) {
      return res.status(404).json({ error: "Board not found." });
    }

    const boardData = boardSnap.data();
    const membersDetails = [];

    const usersCollection = db.collection("users");

    for (const email of boardData.members || []) {
      const userSnap = await usersCollection.where("email", "==", email).get();
      if (!userSnap.empty && userSnap.docs[0]) {
        const userDocData = userSnap.docs[0].data();
        membersDetails.push({
          email,
          ...userDocData,
        });
      }
    }

    res.json({
      ...boardData,
      members: membersDetails,
    });
  } catch (error) {
    console.error("Error fetching board:", error);
    res.status(500).json({ error: "Failed to fetch board." });
  }
}

async function deleteBoard(req, res) {
  try {
    const boardId = req.params.boardId;
    const userEmail = req.user.email;

    const boardRef = db.collection("boards").doc(boardId);
    const boardSnap = await boardRef.get();

    if (!boardSnap.exists) {
      return res.status(404).json({ error: "Board not found." });
    }

    const boardData = boardSnap.data();

    if (boardData.ownerEmail !== userEmail) {
      return res.status(403).json({ error: "You are not the owner of this board." });
    }

    await boardRef.delete();
    res.json({ message: `Board ${boardId} deleted.` });
  } catch (error) {
    console.error("Error deleting board:", error);
    res.status(500).json({ error: "Failed to delete board." });
  }
}

async function inviteMembers(req, res) {
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
}

async function removeMember(req, res) {
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
}

module.exports = {
  getPaginatedBoards,
  createBoard,
  getBoard,
  deleteBoard,
  inviteMembers,
  removeMember,
};

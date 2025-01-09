<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5">
            Kanban Boards
            <v-spacer></v-spacer>
            <v-btn color="primary" icon @click="openNewBoardDialog">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-list>
              <v-list-item
                v-for="board in boards"
                :key="board.id"
                @click="enterBoard(board.id)"
                class="board-item"
              >
                <v-list-item-title>{{ board.name }}</v-list-item-title>
                <v-spacer></v-spacer>
                <v-btn text color="primary" @click.stop="deleteBoard(board.id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="isDialogOpen" max-width="500px">
      <v-card>
        <v-card-title>Add New Board</v-card-title>
        <v-card-text>
          <v-text-field
            label="Board Name"
            v-model="newBoardName"
            placeholder="Enter a name for the board"
            required
          />

          <v-text-field
            label="Invite Members (comma-separated)"
            v-model="inviteUsers"
            placeholder="user1UID, user2UID"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="createBoard">Create</v-btn>
          <v-btn text @click="closeDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";

import { getAuth } from "firebase/auth";
const auth = getAuth();
const currentUserUid = auth.currentUser?.uid || null;

const router = useRouter();

const boards = ref([]);
const isDialogOpen = ref(false);
const newBoardName = ref("");

const inviteUsers = ref("");

onMounted(async () => {
  await fetchBoards();
});

async function fetchBoards() {
  try {
    if (!currentUserUid) {
      console.warn("No current user. Cannot fetch boards.");
      return;
    }

    const boardsColl = collection(db, "boards");
    const qBoards = query(
      boardsColl,
      where("members", "array-contains", currentUserUid)
    );
    const snapshot = await getDocs(qBoards);

    boards.value = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (error) {
    console.error("Error fetching boards:", error.message);
  }
}

function openNewBoardDialog() {
  isDialogOpen.value = true;
}

function closeDialog() {
  isDialogOpen.value = false;
  newBoardName.value = "";
  inviteUsers.value = "";
}

async function createBoard() {
  if (!newBoardName.value.trim()) return;

  let invitedArray = [];
  if (inviteUsers.value.trim()) {
    invitedArray = inviteUsers.value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
  }

  const members = [];
  if (currentUserUid) {
    members.push(currentUserUid);
  }
  members.push(...invitedArray);

  const board = {
    name: newBoardName.value,
    createdAt: serverTimestamp(),
    members,
  };

  try {
    await addDoc(collection(db, "boards"), board);
    console.log("Board created:", board);
    await fetchBoards();
    closeDialog();
  } catch (e) {
    console.error("Error creating board:", e.message);
  }
}

async function enterBoard(boardId) {
  router.push(`/kanban/${boardId}`);
}

async function deleteBoard(boardId) {
  try {
    await deleteDoc(doc(db, "boards", boardId));
    console.log(`Board ${boardId} deleted`);
    await fetchBoards();
  } catch (e) {
    console.error(`Error deleting board ${boardId}:`, e.message);
  }
}
</script>

<style scoped>
.board-item {
  cursor: pointer;
  transition: background-color 0.3s;
}

.board-item:hover {
  background-color: #f5f5f5;
}
</style>

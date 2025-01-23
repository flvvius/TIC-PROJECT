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
            label="Invite Members (emails, comma-separated)"
            v-model="inviteEmails"
            placeholder="user1@example.com, user2@example.com"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="createBoard">Create</v-btn>
          <v-btn text @click="closeDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="toast.show"
      :timeout="toast.timeout"
      :color="toast.color"
      location="top right"
    >
      {{ toast.message }}
      <template #actions>
        <v-btn text @click="toast.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  getBoards,
  createBoard as createBoardAPI,
  deleteBoard as deleteBoardAPI,
  getProfile,
} from "../api";

const router = useRouter();
const boards = ref([]);
const isDialogOpen = ref(false);
const newBoardName = ref("");
const inviteEmails = ref("");
const userData = ref("");

const toast = ref({
  show: false,
  message: "",
  color: "",
  timeout: 3000,
});

onMounted(async () => {
  userData.value = (await getProfile()).user;
  fetchBoards();
});

async function fetchBoards() {
  try {
    const data = await getBoards();
    boards.value = data;
  } catch (error) {
    console.error("Error fetching boards:", error);
    showToast("Error fetching boards.", "error");
  }
}

function openNewBoardDialog() {
  isDialogOpen.value = true;
}

function closeDialog() {
  isDialogOpen.value = false;
  newBoardName.value = "";
  inviteEmails.value = "";
}

async function createBoard() {
  if (!newBoardName.value.trim()) {
    showToast("Board name is required.", "error");
    return;
  }

  let invitedArray = [];
  if (inviteEmails.value.trim()) {
    invitedArray = inviteEmails.value
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
  }

  try {
    await createBoardAPI({
      name: newBoardName.value,
      invitedUsers: invitedArray,
      ownerEmail: userData.value.email,
    });
    await fetchBoards();
    closeDialog();
    showToast("Board created successfully.", "success");
  } catch (error) {
    if (error.response?.status === 400 && error.response.data?.invalidEmails) {
      showToast(
        `Some emails are invalid: ${error.response.data.invalidEmails.join(
          ", "
        )}`,
        "warning"
      );
    } else {
      console.error("Error creating board:", error);
      showToast("Error creating board. Try again later.", "error");
    }
  }
}

function enterBoard(boardId) {
  router.push(`/kanban/${boardId}`);
}

async function deleteBoard(boardId) {
  try {
    await deleteBoardAPI(boardId);
    await fetchBoards();
    showToast("Board deleted successfully.", "success");
  } catch (error) {
    console.error(`Error deleting board ${boardId}:`, error);
    showToast("Error deleting board. Try again.", "error");
  }
}

function showToast(message, color) {
  toast.value = { show: true, message, color, timeout: 3000 };
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

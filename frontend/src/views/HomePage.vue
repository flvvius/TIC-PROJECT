<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-sheet elevation="1" rounded="lg" class="pa-4">
          <v-card outlined>
            <v-card-title class="d-flex align-center">
              <v-icon left color="primary">mdi-view-kanban</v-icon>
              <span class="text-h5 font-weight-medium">Kanban Boards</span>
              <v-spacer></v-spacer>
              <v-btn color="success" class="elevation-2" @click="openNewBoardDialog">
                <v-icon left>mdi-plus</v-icon>
                Create Board
              </v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text>
              <v-row>
                <v-col cols="12" v-for="board in boards" :key="board.id">
                  <v-card
                    outlined
                    hover
                    elevation="2"
                    class="pa-2 board-item"
                    @click="enterBoard(board.id)"
                  >
                    <v-card-title class="d-flex align-center">
                      <v-icon left color="primary">mdi-clipboard-text-outline</v-icon>
                      <span class="font-weight-medium">{{ board.name }}</span>
                      <v-spacer></v-spacer>
                      <v-btn
                        icon
                        text
                        @click.stop="confirmDeleteBoard(board.id)"
                      >
                        <v-icon color="error">mdi-delete</v-icon>
                      </v-btn>
                    </v-card-title>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-sheet>
      </v-col>
    </v-row>

    <v-dialog v-model="isDialogOpen" max-width="500px">
      <v-card>
        <v-card-title>
          <v-icon left>mdi-plus</v-icon> Add New Board
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-text-field
            label="Board Name"
            v-model="newBoardName"
            placeholder="Enter a name for the board"
            outlined
          />
          <v-text-field
            label="Invite Members (emails, comma-separated)"
            v-model="inviteEmails"
            placeholder="user1@example.com, user2@example.com"
            outlined
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="createBoard">Create</v-btn>
          <v-btn text @click="closeDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>
          <v-icon left color="warning">mdi-alert</v-icon> Confirm Delete
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          Are you sure you want to delete this board? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-btn text color="error" @click="deleteConfirmedBoard">Delete</v-btn>
          <v-btn text @click="confirmDeleteDialog = false">Cancel</v-btn>
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
import { useToast, showToast } from "@/utils/toast";

const router = useRouter();
const boards = ref([]);
const isDialogOpen = ref(false);
const newBoardName = ref("");
const inviteEmails = ref("");
const confirmDeleteDialog = ref(false);
const boardToDelete = ref(null);
const userData = ref("");
const toast = useToast();

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

function confirmDeleteBoard(boardId) {
  boardToDelete.value = boardId;
  confirmDeleteDialog.value = true;
}

async function deleteConfirmedBoard() {
  try {
    await deleteBoardAPI(boardToDelete.value);
    await fetchBoards();
    confirmDeleteDialog.value = false;
    showToast("Board deleted successfully.", "success");
  } catch (error) {
    console.error(`Error deleting board ${boardToDelete.value}:`, error);
    showToast("Error deleting board. Try again later.", "error");
  }
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
        `Some emails are invalid: ${error.response.data.invalidEmails.join(", ")}`,
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
</script>

<style scoped>
.board-item {
  cursor: pointer;
  transition: box-shadow 0.3s, transform 0.3s;
}

.board-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}
</style>

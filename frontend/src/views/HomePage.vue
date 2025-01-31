<template>
  <v-container>
    <div ref="scrollContainer" class="scroll-container">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-sheet elevation="1" rounded="lg" class="pa-4">
            <v-card outlined>
              <v-card-title class="d-flex align-center">
                <v-icon left color="primary">mdi-view-kanban</v-icon>
                <span class="text-h5 font-weight-medium">Kanban Boards</span>
                <v-spacer></v-spacer>
                <v-btn
                  color="success"
                  class="elevation-2"
                  @click="openNewBoardDialog"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Create Board
                </v-btn>
              </v-card-title>
              <v-divider></v-divider>

              <v-card-text>
                <v-row>
                  <v-col
                    v-for="board in boards"
                    :key="board.id"
                    cols="12"
                    md="12"
                    class="mb-4"
                  >
                    <v-card
                      outlined
                      hover
                      elevation="2"
                      class="pa-2 board-item"
                      @click="enterBoard(board.id)"
                    >
                      <v-card-title class="d-flex align-center title-card">
                        <v-icon left color="primary"
                          >mdi-clipboard-text-outline</v-icon
                        >
                        <span class="font-weight-medium">{{ board.name }}</span>
                        <v-btn
                          icon
                          text
                          v-if="userData && board.ownerEmail === userData.email"
                          @click.stop="confirmDeleteBoard(board.id)"
                          class="btn-icon"
                        >
                          <v-icon color="error">mdi-delete</v-icon>
                        </v-btn>
                      </v-card-title>
                    </v-card>
                  </v-col>
                </v-row>

                <v-alert v-if="boards.length === 0" type="info" class="mt-4">
                  No boards found. Create one to get started!
                </v-alert>
              </v-card-text>

              <v-progress-circular
                v-if="isLoadingMore"
                color="primary"
                indeterminate
                class="mx-auto my-4"
              />
            </v-card>
          </v-sheet>
        </v-col>
      </v-row>
    </div>

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
        <v-card-text
          >Are you sure you want to delete this board? This action cannot be
          undone.</v-card-text
        >
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
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
  getProfile,
  createBoard as createBoardAPI,
  deleteBoard as deleteBoardAPI,
} from "@/api";
import { useToast, showToast } from "@/utils/toast";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import debounce from "lodash/debounce";

const router = useRouter();
const toast = useToast();

const boards = ref([]);
const userData = ref(null);
const isDialogOpen = ref(false);
const newBoardName = ref("");
const inviteEmails = ref("");
const confirmDeleteDialog = ref(false);
const boardToDelete = ref(null);
const lastVisible = ref(null);
const isLoadingMore = ref(false);
const hasMoreBoards = ref(true);
const scrollContainer = ref(null);

let unsubscribeBoards = null;

const calculateInitialLimit = () => {
  const containerHeight = window.innerHeight || 800;
  const boardHeight = 200;
  return Math.ceil(containerHeight / boardHeight) + 2;
};

onMounted(async () => {
  try {
    const profile = await getProfile();
    userData.value = profile.user;
    const initialLimit = calculateInitialLimit();
    listenForBoards(initialLimit);
    await nextTick();
    setTimeout(() => {
      if (scrollContainer.value instanceof HTMLElement) {
        attachScrollListener();
      } else {
        console.error("scrollContainer is not a valid HTMLElement.");
      }
    }, 500);
  } catch (error) {
    console.error("Error initializing profile:", error);
    showToast("Error loading profile.", "error");
  }
});

function listenForBoards(initialLimit = 6) {
  if (!userData.value) return;

  const boardsCollection = collection(db, "boards");
  let q = query(
    boardsCollection,
    where("members", "array-contains", userData.value.email),
    orderBy("createdAt", "desc"),
    limit(initialLimit)
  );

  unsubscribeBoards = onSnapshot(q, (snapshot) => {
    if (snapshot.docs.length > 0) {
      lastVisible.value = snapshot.docs[snapshot.docs.length - 1];
    }

    snapshot.docChanges().forEach((change) => {
      const boardData = { id: change.doc.id, ...change.doc.data() };

      if (change.type === "added") {
        if (!boards.value.some((board) => board.id === boardData.id)) {
          boards.value.push(boardData);
        }
      } else if (change.type === "removed") {
        boards.value = boards.value.filter(
          (board) => board.id !== boardData.id
        );
      }
    });

    if (snapshot.docs.length > 0) {
      lastVisible.value = snapshot.docs[snapshot.docs.length - 1];
    }
  });
}

async function loadMoreBoards() {
  if (!lastVisible.value || isLoadingMore.value || !hasMoreBoards.value) return;

  isLoadingMore.value = true;
  const boardsCollection = collection(db, "boards");
  const q = query(
    boardsCollection,
    where("members", "array-contains", userData.value.email),
    orderBy("createdAt", "desc"),
    startAfter(lastVisible.value),
    limit(3)
  );

  try {
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        const boardData = { id: doc.id, ...doc.data() };
        if (!boards.value.some((board) => board.id === boardData.id)) {
          boards.value.push(boardData);
        }
      });
      lastVisible.value = snapshot.docs[snapshot.docs.length - 1];
    } else {
      hasMoreBoards.value = false;
    }
  } catch (error) {
    console.error("Error loading more boards:", error);
  } finally {
    isLoadingMore.value = false;
  }
}

function attachScrollListener() {
  if (
    !scrollContainer.value ||
    !(scrollContainer.value instanceof HTMLElement)
  ) {
    console.error("scrollContainer is not an HTMLElement");
    return;
  }

  scrollContainer.value.addEventListener("scroll", debounce(handleScroll, 300));
}

function detachScrollListener() {
  if (!scrollContainer.value) return;
  scrollContainer.value.removeEventListener("scroll", handleScroll);
}

function handleScroll() {
  if (!scrollContainer.value || isLoadingMore.value || !hasMoreBoards.value)
    return;

  const bottomOffset = 200;
  const container = scrollContainer.value;

  if (
    container.scrollHeight - container.scrollTop <=
    container.clientHeight + bottomOffset
  ) {
    loadMoreBoards();
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

onUnmounted(() => {
  if (unsubscribeBoards) {
    unsubscribeBoards();
  }
  detachScrollListener();
});
</script>

<style scoped>
.board-item {
  cursor: pointer;
  transition: box-shadow 0.3s, transform 0.3s;
  height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.board-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.title-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.btn-icon {
  margin-left: auto;
  align-self: center;
}

.scroll-container {
  height: calc(100vh - 150px);
  overflow-y: auto;
  padding-bottom: 20px;
}
</style>


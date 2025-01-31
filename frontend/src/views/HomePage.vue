<template>
  <v-container>
    <ScrollContainer @scroll="handleScroll">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-sheet elevation="1" rounded="lg" class="pa-4">
            <v-card outlined>
              <v-card-title class="d-flex align-center">
                <v-icon left color="primary">mdi-view-kanban</v-icon>
                <span class="font-weight-medium">Kanban Boards</span>
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
            </v-card>
          </v-sheet>
        </v-col>
      </v-row>
      <BoardList
        :boards="boards"
        :userData="userData"
        @delete="confirmDeleteBoard"
        @enter="enterBoard"
      />
      <v-progress-circular
        v-if="isLoadingMore"
        color="primary"
        indeterminate
        class="mx-auto my-4"
      />
    </ScrollContainer>
    <NewBoardDialog
      :isDialogOpen="isDialogOpen"
      @create-board="createBoard"
      @update:isDialogOpen="isDialogOpen = $event"
    />
    <DeleteBoardDialog
      :isDialogOpen="confirmDeleteDialog"
      @confirm="deleteConfirmedBoard"
      @update:isDialogOpen="confirmDeleteDialog = $event"
    />
    <Snackbar
      :toast="toast"
      @update:toast="(updatedToast) => (toast = updatedToast)"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
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
import ScrollContainer from "@/components/ScrollContainer.vue";
import BoardList from "@/components/BoardList.vue";
import NewBoardDialog from "@/components/NewBoardDialog.vue";
import DeleteBoardDialog from "@/components/DeleteBoardDialog.vue";
import Snackbar from "@/components/SnackbarToast.vue";

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
const hasFetchedInitialBoards = ref(false);

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
    await fetchInitialBoards();
  } catch (error) {
    console.error("Error initializing profile:", error);
    showToast("Error loading profile.", "error");
  }
});

async function fetchInitialBoards() {
  if (hasFetchedInitialBoards.value) return;

  const initialLimit = calculateInitialLimit();

  const boardsCollection = collection(db, "boards");
  const q = query(
    boardsCollection,
    where("members", "array-contains", userData.value.email),
    orderBy("createdAt", "desc"),
    limit(initialLimit)
  );

  try {
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      boards.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      lastVisible.value = snapshot.docs[snapshot.docs.length - 1];
    }
  } catch (error) {
    console.error("Error fetching initial boards:", error);
  } finally {
    hasFetchedInitialBoards.value = true;
    listenForBoards(); 
  }
}

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
    limit(5)
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


function handleScroll() {
  if (isLoadingMore.value || !hasMoreBoards.value) return;
  loadMoreBoards();
}


const openNewBoardDialog = () => {
  isDialogOpen.value = true;
};

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

async function createBoard({ name, emails }) {
  if (!name.trim()) {
    showToast("Board name is required.", "error");
    return;
  }

  let invitedArray = [];
  if (emails.trim()) {
    invitedArray = emails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
  }

  try {
    await createBoardAPI({
      name,
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

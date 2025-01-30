<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="3" class="mb-4">
          <v-card-title>
            <v-icon left color="primary">mdi-account-multiple</v-icon>
            Board Members
            <v-spacer />
            <v-btn
              color="primary"
              v-if="isBoardOwner"
              @click="openInviteDialog"
              class="ma-2"
            >
              <v-icon left>mdi-plus</v-icon>
              Invite
            </v-btn>
            <v-btn
              icon
              @click="toggleMembersPanel"
              :aria-label="isMembersPanelExpanded ? 'Collapse' : 'Expand'"
            >
              <v-icon>
                {{
                  isMembersPanelExpanded ? "mdi-chevron-up" : "mdi-chevron-down"
                }}
              </v-icon>
            </v-btn>
          </v-card-title>
          <v-divider />
          <v-card-text v-if="isMembersPanelExpanded">
            <v-list>
              <v-list-item
                v-for="member in members"
                :key="member.email"
                class="d-flex align-center justify-space-between"
              >
                <v-row align="center" no-gutters class="w-100">
                  <v-col cols="auto">
                    <v-avatar size="48" class="me-3">
                      <v-img
                        :src="
                          member.profilePicture
                            ? `${backendBaseUrl}/${member.profilePicture}`
                            : 'http://localhost:8081/uploads/default-avatar.png'
                        "
                      />
                    </v-avatar>
                  </v-col>
                  <v-col>
                    <v-list-item-title class="font-weight-medium">
                      {{ member.displayName || "Anonymous" }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ member.email }}
                    </v-list-item-subtitle>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn
                      icon
                      small
                      color="error"
                      style="margin-left: 8px; transform: scale(0.8)"
                      v-if="isBoardOwner && member.email !== boardOwnerEmail"
                      @click="
                        openRemoveDialog(member.email, member.displayName)
                      "
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col cols="12" lg="10">
        <v-row>
          <v-col
            v-for="column in columns"
            :key="column.id"
            cols="12"
            md="4"
            class="mb-4"
            :data-column-id="column.id"
          >
            <v-card elevation="2">
              <v-card-title class="d-flex justify-space-between">
                <span class="font-weight-medium">{{ column.title }}</span>
                <v-btn icon small @click="openNewTaskDialog(column.id)">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </v-card-title>
              <v-divider />
              <v-card-text>
                <Draggable
                  v-model="tasksByColumn[column.id]"
                  item-key="id"
                  group="tasks"
                  @change="(evt) => onListChange(evt, column.id)"
                >
                  <template #item="{ element: task }">
                    <v-sheet
                      elevation="1"
                      rounded
                      class="mb-2 pa-2 d-flex align-center justify-space-between"
                      style="background-color: #fafafa"
                    >
                      <span class="text-body-1 font-weight-medium">
                        {{ task.title }}
                      </span>

                      <v-menu
                        activator="parent"
                        close-on-content-click
                        offset-x
                        :nudge-left="10"
                      >
                        <template #activator="{ props }">
                          <v-btn icon size="small" v-bind="props">
                            <v-icon>mdi-dots-vertical</v-icon>
                          </v-btn>
                        </template>
                        <v-list>
                          <v-list-item
                            v-for="col in filteredColumns(column.id)"
                            :key="col.id"
                            @click="moveTask(task, column.id, col.id)"
                          >
                            <v-list-item-title>
                              Move to {{ col.title }}
                            </v-list-item-title>
                          </v-list-item>
                          <v-list-item
                            @click="deleteTaskInColumn(column.id, task.id)"
                          >
                            <v-list-item-title>Delete Task</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </v-sheet>
                  </template>
                </Draggable>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-dialog v-model="isDialogOpen" max-width="500px">
      <v-card>
        <v-card-title>Add a New Task</v-card-title>
        <v-divider />
        <v-card-text>
          <v-text-field
            v-model="newTaskTitle"
            label="Task Title"
            placeholder="Enter a task title"
            outlined
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="createTask">Create</v-btn>
          <v-btn text @click="closeDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="inviteDialogOpen" max-width="500px">
      <v-card>
        <v-card-title>Invite Members</v-card-title>
        <v-divider />
        <v-card-text>
          <v-text-field
            v-model="invitedEmails"
            label="Enter emails (comma-separated)"
            placeholder="user1@example.com, user2@example.com"
            outlined
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="inviteMembers">Invite</v-btn>
          <v-btn text @click="closeInviteDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isRemoveDialogOpen" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Confirm Member Removal</v-card-title>
        <v-divider />
        <v-card-text>
          Are you sure you want to remove
          <strong>{{ memberToRemoveName }}</strong>
          from the board?
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" text @click="confirmRemoveMember">Remove</v-btn>
          <v-btn text @click="isRemoveDialogOpen = false">Cancel</v-btn>
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
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Draggable from "vuedraggable";
import {
  getBoard,
  getColumns,
  createOrUpdateColumn,
  createTaskInColumn,
  updateTaskInColumn,
  deleteTaskInColumn as deleteTaskInColumnAPI,
  getProfile,
  inviteMembers as inviteMembersAPI,
  removeMember as removeMemberAPI,
} from "@/api";
import { useToast, showToast } from "@/utils/toast";
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";

const backendBaseUrl = "http://localhost:8081";
const route = useRoute();
const router = useRouter();
const boardId = route.params.boardId;
const toast = useToast();

const members = ref([]);
const columns = ref([]);
const tasksByColumn = ref({});

const isMembersPanelExpanded = ref(false);
const isBoardOwner = ref(false);
const boardOwnerEmail = ref(null);

const inviteDialogOpen = ref(false);
const invitedEmails = ref("");
const isDialogOpen = ref(false);
const newTaskTitle = ref("");
const activeColumnId = ref(null);
const isRemoveDialogOpen = ref(false);
const memberToRemove = ref(null);
const memberToRemoveName = ref("");

const currentUserEmail = ref("");

let unsubscribeBoard = null;
let unsubscribeColumns = null;
let columnTasksUnsubs = [];

onMounted(async () => {
  try {
    const userData = await getProfile();
    currentUserEmail.value = userData.user.email;

    const boardDocRef = doc(db, "boards", boardId);
    unsubscribeBoard = onSnapshot(boardDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        showToast("This board no longer exists.", "warning");
        router.push("/");
        return;
      }
      const boardData = snapshot.data();
      if (!(boardData.members || []).includes(currentUserEmail.value)) {
        showToast("You have been removed from the board.", "warning");
        router.push("/");
        return;
      }
      isBoardOwner.value = boardData.ownerEmail === currentUserEmail.value;
      boardOwnerEmail.value = boardData.ownerEmail;
    });

    const columnsRef = collection(db, "boards", boardId, "columns");
    unsubscribeColumns = onSnapshot(columnsRef, async (snapshot) => {
      const newCols = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      newCols.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      columns.value = newCols;

      cleanupColumnTasksWatchers();
      tasksByColumn.value = {};

      for (const col of newCols) {
        tasksByColumn.value[col.id] = [];
        watchTasksOfColumn(col.id);
      }
    });

    const boardData = await getBoard(boardId);
    members.value = boardData.members;
    isBoardOwner.value = boardData.ownerEmail === currentUserEmail.value;
    boardOwnerEmail.value = boardData.ownerEmail;

    let cols = await getColumns(boardId);
    if (!cols || !cols.length) {
      cols = [
        { id: "todo", title: "To Do", order: 0 },
        { id: "in-progress", title: "In Progress", order: 1 },
        { id: "done", title: "Done", order: 2 },
      ];
      for (const col of cols) {
        await createOrUpdateColumn(boardId, col.id, {
          title: col.title,
          order: col.order,
        });
      }
    }
    columns.value = cols.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const col of columns.value) {
      tasksByColumn.value[col.id] = [];
      watchTasksOfColumn(col.id);
    }

    initializeBoardListeners(boardId);
  } catch (error) {
    console.error("Error setting up board:", error);
  }
});

onUnmounted(() => {
  if (unsubscribeBoard) unsubscribeBoard();
  if (unsubscribeColumns) unsubscribeColumns();
  cleanupColumnTasksWatchers();
});

function watchTasksOfColumn(colId) {
  const qTasks = query(
    collection(db, "boards", boardId, "columns", colId, "tasks"),
    orderBy("order")
  );
  const unsub = onSnapshot(qTasks, (snap) => {
    const tasks = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    tasksByColumn.value[colId] = tasks;
  });
  columnTasksUnsubs.push(unsub);
}

function cleanupColumnTasksWatchers() {
  columnTasksUnsubs.forEach((fn) => fn && fn());
  columnTasksUnsubs = [];
}

async function initializeBoardListeners(boardId) {
  try {
    await fetch(`${backendBaseUrl}/listen/${boardId}`);
  } catch (error) {
    console.error("Error setting up listeners on server:", error);
  }
}

function toggleMembersPanel() {
  isMembersPanelExpanded.value = !isMembersPanelExpanded.value;
}

function openInviteDialog() {
  inviteDialogOpen.value = true;
}
function closeInviteDialog() {
  inviteDialogOpen.value = false;
  invitedEmails.value = "";
}

async function inviteMembers() {
  if (!invitedEmails.value.trim()) {
    showToast("Please enter at least one email.", "warning");
    return;
  }
  const emailList = invitedEmails.value
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  try {
    const result = await inviteMembersAPI(boardId, emailList);
    const { validEmails, alreadyMembers, invalidEmails } = result;
    if (validEmails.length) {
      showToast(`${validEmails.length} members invited.`, "success");
    }
    if (alreadyMembers.length) {
      showToast(`Already members: ${alreadyMembers.join(", ")}.`, "info");
    }
    if (invalidEmails.length) {
      showToast(`Invalid: ${invalidEmails.join(", ")}.`, "warning");
    }
    const updatedMembers = await getBoard(boardId).then((data) => data.members);
    members.value = updatedMembers;
    closeInviteDialog();
  } catch (err) {
    console.error("Invite error:", err);
    showToast("Failed to invite members.", "error");
  }
}

function openRemoveDialog(email, displayName) {
  memberToRemove.value = email;
  memberToRemoveName.value = displayName || "this member";
  isRemoveDialogOpen.value = true;
}
async function confirmRemoveMember() {
  try {
    await removeMemberAPI(boardId, memberToRemove.value);
    const updatedMembers = await getBoard(boardId).then((data) => data.members);
    members.value = updatedMembers;
    showToast("Member removed successfully.", "success");
  } catch (error) {
    showToast("Error removing member. Try again later.", "error");
  } finally {
    isRemoveDialogOpen.value = false;
  }
}

async function moveTask(task, oldColumnId, newColumnId) {
  try {
    await deleteTaskInColumnAPI(boardId, oldColumnId, task.id);
    const newOrder = tasksByColumn.value[newColumnId]?.length || 0;
    await createTaskInColumn(boardId, newColumnId, {
      title: task.title,
      order: newOrder,
    });
  } catch (err) {
    console.error("moveTask error:", err);
    showToast("Failed to move task.", "error");
  }
}

async function onListChange(evt, columnId) {
  const { added, removed, moved } = evt;

  try {
    if (moved) {
      await reorderTasksInColumn(columnId);
    }

    if (added) {
      const newIndex = added.newIndex;
      const newItem = tasksByColumn.value[columnId][newIndex];
      if (!newItem) return;

      const result = await createTaskInColumn(boardId, columnId, {
        title: newItem.title,
        order: newIndex,
      });

      newItem.id = result.id;

      await reorderTasksInColumn(columnId);
    }

    if (removed) {
      const oldItem = removed.element;
      if (oldItem && oldItem.id) {
        await deleteTaskInColumnAPI(boardId, columnId, oldItem.id);
      }
      await reorderTasksInColumn(columnId);
    }
  } catch (error) {
    console.error("onListChange error:", error);
    showToast("Drag-and-drop failed. Please try again.", "error");
  }
}

async function reorderTasksInColumn(colId) {
  const tasks = tasksByColumn.value[colId];
  if (!tasks) return;
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].order !== i) {
      tasks[i].order = i;
      await updateTaskInColumn(boardId, colId, tasks[i].id, { order: i });
    }
  }
}

function openNewTaskDialog(columnId) {
  activeColumnId.value = columnId;
  isDialogOpen.value = true;
}
function closeDialog() {
  isDialogOpen.value = false;
  newTaskTitle.value = "";
  activeColumnId.value = null;
}

async function createTask() {
  if (!newTaskTitle.value.trim() || !activeColumnId.value) return;
  const currentTasks = tasksByColumn.value[activeColumnId.value];
  const newOrder = currentTasks.length;
  try {
    await createTaskInColumn(boardId, activeColumnId.value, {
      title: newTaskTitle.value,
      order: newOrder,
    });
    closeDialog();
  } catch (err) {
    console.error("createTask error:", err);
    showToast("Failed to create task.", "error");
  }
}

async function deleteTaskInColumn(colId, taskId) {
  try {
    await deleteTaskInColumnAPI(boardId, colId, taskId);
    showToast("Task deleted successfully.", "success");
  } catch (err) {
    console.error("deleteTaskInColumn error:", err);
    showToast("Failed to delete task.", "error");
  }
}

function filteredColumns(currentColId) {
  return columns.value.filter((c) => c.id !== currentColId);
}
</script>

<style scoped>
.v-avatar {
  margin-right: 16px;
}
</style>

<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="3" class="mb-4">
          <v-card-title>
            <v-icon left color="primary">mdi-account-multiple</v-icon> Board
            Members
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              v-if="isBoardOwner"
              @click="openInviteDialog"
              class="ma-2"
            >
              <v-icon left>mdi-plus</v-icon> Invite
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
          <v-divider></v-divider>
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
                      ></v-img>
                    </v-avatar>
                  </v-col>
                  <v-col>
                    <v-list-item-title class="font-weight-medium">
                      {{ member.displayName || "Anonymous" }}
                    </v-list-item-title>
                    <v-list-item-subtitle>{{
                      member.email
                    }}</v-list-item-subtitle>
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
          >
            <v-card elevation="2">
              <v-card-title class="d-flex justify-space-between">
                <span class="font-weight-medium">{{ column.title }}</span>
                <v-btn icon small @click="openNewTaskDialog(column.id)">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <Draggable
                  :list="tasksByColumn[column.id]"
                  item-key="id"
                  group="tasks"
                  @end="onDragEnd"
                >
                  <template #item="{ element: task }">
                    <v-sheet
                      elevation="1"
                      rounded
                      class="mb-2 pa-2 d-flex align-center justify-space-between"
                      style="background-color: #fafafa"
                    >
                      <span class="text-body-1 font-weight-medium">{{
                        task.title
                      }}</span>

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
                            v-for="col in filteredColumns(task)"
                            :key="col.id"
                            @click="moveTask(task, col.id)"
                          >
                            <v-list-item-title
                              >Move to {{ col.title }}</v-list-item-title
                            >
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
        <v-divider></v-divider>
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
        <v-divider></v-divider>
        <v-card-text>
          <v-text-field
            v-model="invitedEmails"
            label="Enter emails (comma-separated)"
            placeholder="example1@mail.com, example2@mail.com"
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
        <v-divider></v-divider>
        <v-card-text>
          Are you sure you want to remove
          <strong>{{ memberToRemoveName }}</strong> from the board?
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
  getTasks,
  getProfile,
  createTask as createTaskAPI,
  updateTask as updateTaskAPI,
  inviteMembers as inviteMembersAPI,
  removeMember as removeMemberAPI,
} from "@/api";
import { useToast, showToast } from "@/utils/toast";

import {
  doc,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "@/firebase";

const backendBaseUrl = "http://localhost:8081";
const route = useRoute();
const router = useRouter();

const boardId = route.params.boardId;
const toast = useToast();

const members = ref([]);
const inviteDialogOpen = ref(false);
const invitedEmails = ref("");
const isMembersPanelExpanded = ref(false);

const columns = ref([]);
const tasksByColumn = ref({});
const isDialogOpen = ref(false);
const newTaskTitle = ref("");
const activeColumnId = ref(null);
const isBoardOwner = ref(false);
const boardOwnerEmail = ref(null);

const isRemoveDialogOpen = ref(false);
const memberToRemove = ref(null);
const memberToRemoveName = ref("");

const currentUserEmail = ref("");

let unsubscribeBoard = null;
let unsubscribeColumns = null;
let unsubscribeTasks = null;

onMounted(async () => {
  try {
    const userData = await getProfile();
    currentUserEmail.value = userData.user.email;

    const boardDocRef = doc(db, "boards", boardId);
    unsubscribeBoard = onSnapshot(boardDocRef, async (snapshot) => {
      if (!snapshot.exists()) {
        showToast("This board no longer exists.", "warning");
        router.push("/");
        return;
      }

      const boardData = snapshot.data();
      const memberEmails = boardData?.members || [];

      if (!memberEmails.includes(currentUserEmail.value)) {
        showToast("You have been removed from the board.", "warning");
        router.push("/");
        return;
      }

      const fetchedMembers = await Promise.all(
        memberEmails.map(async (email) => {
          const q = query(collection(db, "users"), where("email", "==", email));
          const userSnap = await getDocs(q);
          if (!userSnap.empty) {
            const userDoc = userSnap.docs[0];
            return {
              email,
              displayName: userDoc.data().displayName || "Anonymous",
              profilePicture: userDoc.data().profilePicture || null,
            };
          }
          return {
            email,
            displayName: "Unknown",
            profilePicture: null,
          };
        })
      );
      members.value = fetchedMembers;

      isBoardOwner.value = boardData.ownerEmail === currentUserEmail.value;
      boardOwnerEmail.value = boardData.ownerEmail;
    });

    const columnsRef = collection(db, `boards/${boardId}/columns`);
    unsubscribeColumns = onSnapshot(columnsRef, (snapshot) => {
      let cols = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      cols.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      columns.value = cols;
      tasksByColumn.value = columns.value.reduce((acc, col) => {
        acc[col.id] = [];
        return acc;
      }, {});
    });

    const tasksRef = collection(db, `boards/${boardId}/tasks`);
    unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const newTasksByColumn = {};

      tasks.forEach((task) => {
        if (!newTasksByColumn[task.columnId]) {
          newTasksByColumn[task.columnId] = [];
        }
        newTasksByColumn[task.columnId].push(task);
      });

      for (const columnId in newTasksByColumn) {
        newTasksByColumn[columnId].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
      }

      tasksByColumn.value = newTasksByColumn;
    });

    initializeBoardListeners(boardId);

    const boardData = await getBoard(boardId);
    members.value = boardData.members;
    isBoardOwner.value = boardData.ownerEmail === currentUserEmail.value;
    boardOwnerEmail.value = boardData.ownerEmail;

    let columnsData = await getColumns(boardId);
    if (!columnsData || !columnsData.length) {
      columnsData = [
        { id: "todo", title: "To Do", order: 0 },
        { id: "in-progress", title: "In Progress", order: 1 },
        { id: "done", title: "Done", order: 2 },
      ];
      for (const col of columnsData) {
        await createOrUpdateColumn(boardId, col.id, {
          title: col.title,
          order: col.order,
        });
      }
    }
    columns.value = columnsData;

    tasksByColumn.value = columns.value.reduce((acc, col) => {
      acc[col.id] = [];
      return acc;
    }, {});

    const tasksData = await getTasks(boardId);
    tasksData.forEach((task) => {
      if (task.columnId && tasksByColumn.value[task.columnId]) {
        tasksByColumn.value[task.columnId].push(task);
      }
    });

    for (const colId in tasksByColumn.value) {
      tasksByColumn.value[colId].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
    }
  } catch (error) {
    console.error("Error fetching board data:", error);
  }
});

onUnmounted(() => {
  if (unsubscribeBoard) unsubscribeBoard();
  if (unsubscribeColumns) unsubscribeColumns();
  if (unsubscribeTasks) unsubscribeTasks();
});

async function initializeBoardListeners(boardId) {
  try {
    await fetch(`${backendBaseUrl}/listen/${boardId}`);
    console.log("Listening to Firestore updates for board:", boardId);
  } catch (error) {
    console.error("Error setting up listeners:", error);
  }
}

function toggleMembersPanel() {
  isMembersPanelExpanded.value = !isMembersPanelExpanded.value;
}

async function inviteMembers() {
  if (!invitedEmails.value.trim()) {
    showToast("Please enter at least one email.", "warning");
    return;
  }

  const emailList = invitedEmails.value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  try {
    const response = await inviteMembersAPI(boardId, emailList);
    const { validEmails, alreadyMembers, invalidEmails } = response;

    if (validEmails.length) {
      showToast(
        `${validEmails.length} members successfully invited.`,
        "success"
      );
    }
    if (alreadyMembers.length) {
      showToast(
        `These members were already part of the board: ${alreadyMembers.join(
          ", "
        )}.`,
        "info"
      );
    }
    if (invalidEmails.length) {
      showToast(
        `These emails are invalid or do not exist: ${invalidEmails.join(
          ", "
        )}.`,
        "warning"
      );
    }

    const updatedMembers = await getBoard(boardId).then((data) => data.members);
    members.value = updatedMembers;
    closeInviteDialog();
  } catch (error) {
    console.error("Error inviting members:", error);
    showToast("Failed to invite members. Please try again later.", "error");
  }
}

function closeInviteDialog() {
  inviteDialogOpen.value = false;
  invitedEmails.value = "";
}

function openInviteDialog() {
  inviteDialogOpen.value = true;
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

async function moveTask(task, newColumnId) {
  try {
    await updateTaskAPI(boardId, task.id, { columnId: newColumnId });
    const newOrder = tasksByColumn.value[newColumnId]?.length || 0;
    await updateTaskAPI(boardId, task.id, {
      columnId: newColumnId,
      order: newOrder,
    });
  } catch (error) {
    console.error("Error moving task:", error);
  }
}

function filteredColumns(task) {
  return columns.value.filter((col) => col.id !== task.columnId);
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

  const newOrder = tasksByColumn.value[activeColumnId.value].length;
  const taskData = {
    title: newTaskTitle.value,
    columnId: activeColumnId.value,
    order: newOrder,
  };

  try {
    const createdTask = await createTaskAPI(boardId, taskData);
    tasksByColumn.value[activeColumnId.value].push(createdTask);
    closeDialog();
  } catch (error) {
    console.error("Error creating task:", error);
  }
}

async function onDragEnd() {
  try {
    for (const [columnId, tasksArray] of Object.entries(tasksByColumn.value)) {
      await Promise.all(
        tasksArray.map((task, idx) => {
          task.columnId = columnId;
          task.order = idx;

          return updateTaskAPI(boardId, task.id, {
            columnId,
            order: idx,
          });
        })
      );
    }
    // window.location.reload(); // possible, but annoying
  } catch (error) {
    console.error("Error updating task order or column:", error);
  }
}
</script>

<style scoped>
.v-avatar {
  margin-right: 16px;
}
</style>

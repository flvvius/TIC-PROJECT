<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="3" class="mb-4">
          <v-card-title>
            <v-icon left color="primary">mdi-account-multiple</v-icon> Board Members
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              v-if="isBoardOwner"
              @click="openInviteDialog"
              class="ma-2"
            >
              <v-icon left>mdi-plus</v-icon> Invite
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="member in members"
                :key="member.email"
                class="d-flex align-center"
              >
                <v-avatar size="48" class="me-3">
                  <v-img
                    :src="
                      member.profilePicture
                        ? `${backendBaseUrl}/${member.profilePicture}`
                        : 'http://localhost:8081/uploads/default-avatar.png'
                    "
                  ></v-img>
                </v-avatar>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-medium">
                    {{ member.displayName || "Anonymous" }}
                  </v-list-item-title>
                  <v-list-item-subtitle>{{ member.email }}</v-list-item-subtitle>
                </v-list-item-content>
                <v-btn
                  icon
                  small
                  v-if="isBoardOwner && member.email !== boardOwnerEmail"
                  @click="openRemoveDialog(member.email, member.displayName)"
                >
                  <v-icon color="error">mdi-delete</v-icon>
                </v-btn>
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
                  @change="(evt) => onDragChange(evt, column.id)"
                  @end="onDragEnd"
                >
                  <template #item="{ element }">
                    <v-list-item class="py-1">
                      <v-list-item-title>{{ element.title }}</v-list-item-title>
                    </v-list-item>
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
          Are you sure you want to remove <strong>{{ memberToRemoveName }}</strong> from the board?
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
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
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

const backendBaseUrl = "http://localhost:8081";
const route = useRoute();
const boardId = route.params.boardId;
const toast = useToast();

const members = ref([]);
const inviteDialogOpen = ref(false);
const invitedEmails = ref("");

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

onMounted(async () => {
  try {
    const userData = await getProfile();
    const user = userData.user;
    const boardData = await getBoard(boardId);
    members.value = boardData.members;
    isBoardOwner.value = boardData.ownerEmail === user.email;
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

async function onDragChange(evt, newColumnId) {
  if (evt.added) {
    const { element: task } = evt.added;
    const oldColumnId = task.columnId;

    if (oldColumnId && oldColumnId !== newColumnId) {
      try {
        await updateTaskAPI(boardId, task.id, { columnId: newColumnId });
        task.columnId = newColumnId;
      } catch (error) {
        console.error("Error moving task to new column:", error);
      }
    }
  }
}

async function onDragEnd() {
  try {
    for (const tasks of Object.entries(tasksByColumn.value)) {
      await Promise.all(
        tasks.map((task, idx) => {
          task.order = idx;
          return updateTaskAPI(boardId, task.id, { order: idx });
        })
      );
    }
  } catch (error) {
    console.error("Error updating task order:", error);
  }
}
</script>

<style scoped>
.v-avatar {
  margin-right: 16px;
}
</style>

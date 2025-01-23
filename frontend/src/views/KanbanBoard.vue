<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>Board Members</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="member in members" :key="member.email">
                <v-row align="center">
                  <v-col cols="auto" style="margin-right: -28px">
                    <v-avatar>
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
                    <v-list-item-title>{{
                      member.displayName || "Anonymous"
                    }}</v-list-item-title>
                    <v-list-item-subtitle>{{ member.email }}</v-list-item-subtitle>
                    <v-btn
                      icon
                      small
                      v-if="isBoardOwner && member.email !== boardOwnerEmail"
                      @click="removeMember(member.email)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-list-item>
            </v-list>

            <v-btn color="primary" v-if="isBoardOwner" @click="openInviteDialog">
              Invite Members
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="column in columns" :key="column.id">
        <v-card>
          <v-card-title>
            {{ column.title }}
            <v-btn icon @click="openNewTaskDialog(column.id)">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <Draggable
              :list="tasksByColumn[column.id]"
              item-key="id"
              group="tasks"
              @change="(evt) => onDragChange(evt, column.id)"
              @end="onDragEnd"
            >
              <template #item="{ element }">
                <v-list-item>
                  <v-list-item-title>{{ element.title }}</v-list-item-title>
                </v-list-item>
              </template>
            </Draggable>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="isDialogOpen" max-width="500px">
      <v-card>
        <v-card-title>Add a New Task</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newTaskTitle"
            label="Task Title"
            placeholder="Enter a task title"
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
        <v-card-text>
          <v-text-field
            v-model="invitedEmails"
            label="Enter emails (comma-separated)"
            placeholder="example1@mail.com, example2@mail.com"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="inviteMembers">Invite</v-btn>
          <v-btn text @click="closeInviteDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbarVisible" :color="snackbarColor" timeout="3000" location="top right">
      {{ snackbarText }}
      <template #action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbarVisible = false">Close</v-btn>
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

const backendBaseUrl = "http://localhost:8081";
const route = useRoute();
const boardId = route.params.boardId;

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

const snackbarVisible = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("");

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
  if (!invitedEmails.value.trim()) return;

  const emailList = invitedEmails.value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  try {
    await inviteMembersAPI(boardId, emailList);
    const updatedMembers = await getBoard(boardId).then((data) => data.members);
    members.value = updatedMembers;
    showSnackbar(`${emailList.length} members successfully invited.`, "success");
    closeInviteDialog();
  } catch (error) {
    if (error.response?.status === 404) {
      showSnackbar("Some members were not found.", "warning");
    } else {
      showSnackbar("Error inviting members. Try again later.", "error");
    }
  }
}

function closeInviteDialog() {
  inviteDialogOpen.value = false;
  invitedEmails.value = "";
}

function openInviteDialog() {
  inviteDialogOpen.value = true;
}

async function removeMember(email) {
  try {
    await removeMemberAPI(boardId, email);
    const updatedMembers = await getBoard(boardId).then((data) => data.members);
    members.value = updatedMembers;
    showSnackbar("Member removed successfully.", "success");
  } catch (error) {
    showSnackbar("Error removing member. Try again later.", "error");
  }
}

function showSnackbar(message, color) {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbarVisible.value = true;
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
  try
 {
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

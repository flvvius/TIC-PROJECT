<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            Board Members
            <v-spacer></v-spacer>
            <v-btn icon color="primary" @click="inviteDialogOpen = true">
              <v-icon>mdi-account-plus</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="(member, idx) in boardMembers" :key="idx">
                <v-list-item-title>{{ member }}</v-list-item-title>
              </v-list-item>
            </v-list>
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
        <v-card-title>Invite New Members</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="inviteInput"
            label="UIDs (comma-separated)"
            placeholder="user1UID, user2UID"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="inviteMembers">Invite</v-btn>
          <v-btn text @click="closeInviteDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import Draggable from "vuedraggable";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/firebase";

const route = useRoute();
const boardId = route.params.boardId;

const boardMembers = ref([]);
const inviteDialogOpen = ref(false);
const inviteInput = ref("");

const columns = ref([]);
const tasksByColumn = ref({});
const isDialogOpen = ref(false);
const newTaskTitle = ref("");
const activeColumnId = ref(null);

onMounted(async () => {
  try {
    const boardRef = doc(db, "boards", boardId);
    const boardSnap = await getDoc(boardRef);
    if (boardSnap.exists()) {
      const boardData = boardSnap.data();
      boardMembers.value = Array.isArray(boardData.members)
        ? boardData.members
        : [];
    }

    const colRef = collection(db, "boards", boardId, "columns");
    const colSnap = await getDocs(query(colRef, orderBy("order")));

    if (colSnap.empty) {
      const defaultCols = [
        { id: "todo", title: "To Do", order: 0 },
        { id: "in-progress", title: "In Progress", order: 1 },
        { id: "done", title: "Done", order: 2 },
      ];
      for (const col of defaultCols) {
        await setDoc(doc(db, "boards", boardId, "columns", col.id), {
          title: col.title,
          order: col.order,
        });
      }
      columns.value = defaultCols;
    } else {
      columns.value = colSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
    }

    tasksByColumn.value = columns.value.reduce((acc, col) => {
      acc[col.id] = [];
      return acc;
    }, {});

    const tasksRef = collection(db, "boards", boardId, "tasks");
    const tasksSnap = await getDocs(query(tasksRef, orderBy("order")));

    tasksSnap.forEach((docSnap) => {
      const taskData = { id: docSnap.id, ...docSnap.data() };
      const colId = taskData.columnId;
      if (colId && tasksByColumn.value[colId]) {
        tasksByColumn.value[colId].push(taskData);
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
  if (!inviteInput.value.trim()) return;

  const newMembers = inviteInput.value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item);

  try {
    const boardRef = doc(db, "boards", boardId);
    await updateDoc(boardRef, {
      members: arrayUnion(...newMembers),
    });
    boardMembers.value.push(...newMembers);

    closeInviteDialog();
  } catch (error) {
    console.error("Error inviting members:", error);
  }
}

function closeInviteDialog() {
  inviteDialogOpen.value = false;
  inviteInput.value = "";
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

  const newOrder = tasksByColumn.value[activeColumnId.value].length || 0;
  const taskData = {
    title: newTaskTitle.value,
    columnId: activeColumnId.value,
    createdAt: serverTimestamp(),
    order: newOrder,
  };

  try {
    const taskRef = await addDoc(
      collection(db, "boards", boardId, "tasks"),
      taskData
    );
    tasksByColumn.value[activeColumnId.value].push({
      id: taskRef.id,
      ...taskData,
    });
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
        await updateDoc(doc(db, "boards", boardId, "tasks", task.id), {
          columnId: newColumnId,
        });
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
      if (!Array.isArray(tasks)) continue;
      await Promise.all(
        tasks.map((task, idx) => {
          task.order = idx;
          return updateDoc(doc(db, "boards", boardId, "tasks", task.id), {
            order: idx,
          });
        })
      );
    }
  } catch (error) {
    console.error("Error updating task order:", error);
  }
}
</script>

<style scoped></style>

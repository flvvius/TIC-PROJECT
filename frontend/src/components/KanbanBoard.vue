<template>
  <v-container fluid>
    <v-row v-if="columns.length === 0">
      <v-col>
        <div>No columns found</div>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col v-for="column in columns" :key="column.id">
        <v-card>
          <v-card-title>
            {{ column.title }}
            <v-btn icon @click="openNewTaskDialog(column.id)">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-list>
              <draggable
                v-model="tasksByColumn[column.id]"
                group="tasks"
                @end="onDragEnd"
              >
                <v-list-item
                  v-for="task in tasksByColumn[column.id]"
                  :key="task.id"
                >
                  <v-list-item-title>{{ task.title }}</v-list-item-title>
                </v-list-item>
              </draggable>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="isDialogOpen" max-width="500px">
      <v-card>
        <v-card-title>Add a New Task</v-card-title>
        <v-card-text>
          <v-text-field
            label="Task Title"
            v-model="newTaskTitle"
            placeholder="Enter a task title"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="createTask">Create</v-btn>
          <v-btn text @click="closeDialog">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import draggable from "vuedraggable/src/vuedraggable";
import { db } from "../firebase";

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const columns = ref([]);
const tasksByColumn = ref({});

const boardId = "1";

const isDialogOpen = ref(false);
const newTaskTitle = ref("");
const activeColumnId = ref(null);

onMounted(async () => {
  const columnsQuery = query(
    collection(db, "boards", boardId, "columns"),
    orderBy("order")
  );
  const columnsSnap = await getDocs(columnsQuery);
  columns.value = columnsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  for (const col of columns.value) {
    const tasksSnap = await getDocs(
      collection(db, "boards", boardId, "columns", col.id, "tasks")
    );
    tasksByColumn.value[col.id] = tasksSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  }
});

const openNewTaskDialog = (columnId) => {
  activeColumnId.value = columnId;
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
  newTaskTitle.value = "";
  activeColumnId.value = null;
};

const createTask = async () => {
  if (!newTaskTitle.value.trim()) return;
  if (!activeColumnId.value) return;

  try {
    await addDoc(
      collection(
        db,
        "boards",
        boardId,
        "columns",
        activeColumnId.value,
        "tasks"
      ),
      {
        title: newTaskTitle.value,
        createdAt: serverTimestamp(),
        order: tasksByColumn.value[activeColumnId.value]?.length || 0,
      }
    );

    const tasksSnap = await getDocs(
      collection(
        db,
        "boards",
        boardId,
        "columns",
        activeColumnId.value,
        "tasks"
      )
    );
    tasksByColumn.value[activeColumnId.value] = tasksSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    closeDialog();
  } catch (err) {
    console.error("Error creating task:", err);
  }
};

const onDragEnd = async () => {
  for (const [columnId, tasksList] of Object.entries(tasksByColumn.value)) {
    await Promise.all(
      tasksList.map((task, idx) => {
        const taskRef = doc(
          db,
          "boards",
          boardId,
          "columns",
          columnId,
          "tasks",
          task.id
        );
        return updateDoc(taskRef, { order: idx });
      })
    );
  }
};
</script>

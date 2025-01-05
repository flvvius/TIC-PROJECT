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
            <draggable
              :list="tasksByColumn[column.id]"
              item-key="id"
              group="tasks"
              :data-column-id="column.id"
              @change="(evt) => onDragChange(evt, column.id)"
              @end="onDragEnd"
            >
              <template #item="{ element }">
                <v-list-item>
                  <v-list-item-title>
                    {{ element.title }}
                  </v-list-item-title>
                </v-list-item>
              </template>
            </draggable>
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
import draggable from "vuedraggable";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";

const columns = ref([]);
const tasksByColumn = ref({});
const boardId = "1"; // de luat din baza de date
const isDialogOpen = ref(false);
const newTaskTitle = ref("");
const activeColumnId = ref(null);

onMounted(async () => {
  const colRef = collection(db, "boards", boardId, "columns");
  const q = query(colRef, orderBy("order"));
  const snap = await getDocs(q);

  columns.value = snap.docs.map((d) => ({
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
      columnId: col.id,
    }));
  }
});

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

  const task = {
    title: newTaskTitle.value,
    columnId: activeColumnId.value,
    createdAt: serverTimestamp(),
    order: tasksByColumn.value[activeColumnId.value]?.length || 0,
  };

  try {
    const taskRef = doc(
      collection(
        db,
        "boards",
        boardId,
        "columns",
        activeColumnId.value,
        "tasks"
      )
    );
    await setDoc(taskRef, task);

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
  } catch (e) {
    console.error("Error creating task:", e.message);
  }
}

async function onDragChange(evt, columnId) {
  console.log("onDragChange fired:", evt);
  console.log("Target column ID:", columnId);

  if (!evt.added) {
    console.warn("No task added during drag");
    return;
  }

  const { element: addedTask, newIndex } = evt.added;

  const oldColumnId = addedTask.columnId;
  if (oldColumnId && oldColumnId !== columnId) {
    try {
      await deleteDoc(
        doc(
          db,
          "boards",
          boardId,
          "columns",
          oldColumnId,
          "tasks",
          addedTask.id
        )
      );
    } catch (e) {
      console.error(
        `Error removing task ${addedTask.id} from '${oldColumnId}':`,
        e.message
      );
    }
  }

  addedTask.columnId = columnId;
  try {
    await setDoc(
      doc(db, "boards", boardId, "columns", columnId, "tasks", addedTask.id),
      {
        title: addedTask.title,
        columnId: columnId,
        createdAt: addedTask.createdAt || serverTimestamp(),
        order: newIndex,
      }
    );
  } catch (e) {
    console.error(
      `Error adding task ${addedTask.id} to '${columnId}':`,
      e.message
    );
  }
}

async function onDragEnd() {
  console.log("onDragEnd fired");

  for (const [columnId, tasks] of Object.entries(tasksByColumn.value)) {
    console.log(`Reordering tasks in column: ${columnId}`);

    await Promise.all(
      tasks.map(async (task, idx) => {
        if (task.columnId === columnId) {
          console.log(`Attempting to update task ${task.id} order to ${idx}`);
          try {
            const taskRef = doc(
              db,
              "boards",
              boardId,
              "columns",
              columnId,
              "tasks",
              task.id
            );

            await updateDoc(taskRef, { order: idx });
            console.log(`Task ${task.id} updated successfully to order ${idx}`);
          } catch (e) {
            console.error(
              `Failed to update task ${task.id} in Firestore:`,
              e.message
            );
          }
        }
      })
    );
  }

  for (const col of columns.value) {
    try {
      const tasksSnap = await getDocs(
        collection(db, "boards", boardId, "columns", col.id, "tasks")
      );
      tasksByColumn.value[col.id] = tasksSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      console.log(
        `Tasks in column '${col.id}' re-fetched from Firestore:`,
        tasksByColumn.value[col.id]
      );
    } catch (e) {
      console.error(`Failed to fetch tasks for column '${col.id}':`, e.message);
    }
  }

  console.log("Reordering completed and tasks validated with Firestore.");
}
</script>

<style scoped></style>

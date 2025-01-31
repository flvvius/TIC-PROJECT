<template>
  <v-row>
    <v-col
      v-for="board in boards"
      :key="board.id"
      cols="12"
      md="12"
      class="mb-4"
    >
      <BoardItem
        :board="board"
        :userData="userData"
        @delete="onDelete"
        @enter="onEnter"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import BoardItem from "./BoardItem.vue";
defineProps(["boards", "userData"]);
const emit = defineEmits(["enter", "delete"]);

function onDelete(boardId) {
  emit("delete", boardId);
}

function onEnter(boardId) {
  emit("enter", boardId);
}
</script>

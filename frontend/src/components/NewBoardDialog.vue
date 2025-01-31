<template>
  <v-dialog
    :model-value="isDialogOpen"
    @update:modelValue="$emit('update:isDialogOpen', $event)"
    max-width="500px"
  >
    <v-card>
      <v-card-title>
        <v-icon left>mdi-plus</v-icon> Add New Board
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-text-field
          label="Board Name"
          v-model="boardName"
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
        <v-btn text @click="$emit('update:isDialogOpen', false)">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from "vue";

defineProps(["isDialogOpen"]);
const emit = defineEmits(["update:isDialogOpen", "create-board"]);

const boardName = ref("");
const inviteEmails = ref("");

function createBoard() {
  emit("create-board", { name: boardName.value, emails: inviteEmails.value });
  emit("update:isDialogOpen", false);
}
</script>

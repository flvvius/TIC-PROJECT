<template>
  <v-dialog
    :model-value="isDialogOpen"
    @update:modelValue="$emit('update:isDialogOpen', $event)"
    max-width="400px"
  >
    <v-card>
      <v-card-title>
        <v-icon left color="warning">mdi-alert</v-icon> Confirm Delete
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        Are you sure you want to delete this board? This action cannot be
        undone.
      </v-card-text>
      <v-card-actions>
        <v-btn text color="error" @click="confirmDelete">Delete</v-btn>
        <v-btn text @click="$emit('update:isDialogOpen', false)">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps(["isDialogOpen"]);
const emit = defineEmits(["update:isDialogOpen", "confirm"]);

function confirmDelete() {
  emit("confirm");
  emit("update:isDialogOpen", false);
}
</script>

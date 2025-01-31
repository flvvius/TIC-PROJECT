<template>
    <v-snackbar
      :model-value="toast.show"
      @update:modelValue="emitUpdate"
      :timeout="toast.timeout"
      :color="toast.color"
      location="top right"
    >
      {{ toast.message }}
      <template #actions>
        <v-btn text @click="closeSnackbar">Close</v-btn>
      </template>
    </v-snackbar>
  </template>
  
  <script setup>
  import { toRefs } from "vue";
  
  const props = defineProps(["toast"]);
  const emit = defineEmits(["update:toast"]);
  
  const { toast } = toRefs(props);
  
  const emitUpdate = (value) => {
    emit("update:toast", { ...toast.value, show: value });
  };
  
  const closeSnackbar = () => {
    emit("update:toast", { ...toast.value, show: false });
  };
  </script>
  
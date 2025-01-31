<template>
    <div ref="scrollContainer" class="scroll-container">
      <slot />
    </div>
  </template>
  
  <script setup>
  import { onMounted, onUnmounted, ref } from "vue";
  import debounce from "lodash/debounce";
  
  const emit = defineEmits(["scroll"]);
  const scrollContainer = ref(null);
  
  function handleScroll() {
    if (!scrollContainer.value) return;
  
    const container = scrollContainer.value;
    const bottomOffset = 50;
  
    if (
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + bottomOffset
    ) {
      emit("scroll");
    }
  }
  
  const debouncedScroll = debounce(handleScroll, 300);
  
  onMounted(() => {
    if (scrollContainer.value) {
      scrollContainer.value.addEventListener("scroll", debouncedScroll);
    }
  });
  
  onUnmounted(() => {
    if (scrollContainer.value) {
      scrollContainer.value.removeEventListener("scroll", debouncedScroll);
    }
  });
  </script>
  
  <style scoped>
  .scroll-container {
    height: calc(100vh - 150px);
    overflow-y: auto;
    padding-bottom: 20px;
  }
  </style>
  
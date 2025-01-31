<template>
    <v-card
      outlined
      hover
      elevation="2"
      class="pa-2 board-item"
      @click="$emit('enter', board.id)"
    >
      <v-card-title class="title-card">
        <div class="title-content">
          <v-icon color="primary">mdi-clipboard-text-outline</v-icon>
          <span class="font-weight-medium board-name">{{ board.name }}</span>
        </div>
  
        <v-btn
          icon
          text
          v-if="userData && board.ownerEmail === userData.email"
          @click.stop="$emit('delete', board.id)"
          class="delete-btn"
        >
          <v-icon color="error">mdi-delete</v-icon>
        </v-btn>
      </v-card-title>
    </v-card>
  </template>
  
  <script setup>
  defineProps(["board", "userData"]);
  defineEmits(["delete", "enter"]);
  </script>
  
  <style scoped>
  .board-item {
    cursor: pointer;
    transition: box-shadow 0.3s, transform 0.3s;
    height: 110px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
  }
  
  .board-item:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
  
  .title-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
  }
  
  .title-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .board-name {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .delete-btn {
    margin-left: auto;
  }
  </style>
  
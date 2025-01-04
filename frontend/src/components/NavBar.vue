<template>
  <v-app-bar color="primary" dark app>
    <v-app-bar-nav-icon v-if="isMobile" @click="toggleDrawer" />

    <v-toolbar-title>ProTracker</v-toolbar-title>

    <v-spacer></v-spacer>

    <template v-if="!isMobile">
      <v-btn text to="/">Home</v-btn>
      <v-btn text to="/about">About</v-btn>
      <v-btn text to="/kanban">Kanban Board</v-btn>
      <v-btn text to="/login">Login</v-btn>
    </template>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" app temporary color="grey lighten-4">
    <v-list>
      <v-list-item to="/">
        <v-list-item-title>Home</v-list-item-title>
      </v-list-item>
      <v-list-item to="/about">
        <v-list-item-title>About</v-list-item-title>
      </v-list-item>
      <v-list-item to="/kanban">
        <v-list-item-title>Kanban Board</v-list-item-title>
      </v-list-item>
      <v-list-item to="/login">
        <v-list-item-title>Login</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDisplay } from "vuetify";

const drawer = ref(false);

function toggleDrawer() {
  drawer.value = !drawer.value;
}

const { mdAndUp } = useDisplay();

const isMobile = computed(() => !mdAndUp.value);
</script>

<style scoped></style>

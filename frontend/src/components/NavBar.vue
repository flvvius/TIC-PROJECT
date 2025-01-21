<template>
    <v-app-bar color="primary" dark app>
      <v-app-bar-nav-icon v-if="isMobile" @click="toggleDrawer" />
      <v-toolbar-title>ProTracker</v-toolbar-title>
      <v-spacer></v-spacer>
  
      <v-btn text to="/">Home</v-btn>
  
      <template v-if="authState.isLoggedIn">
        <v-menu offset-y>
          <template #activator="{ props }">
            <v-btn v-bind="props" text class="d-flex align-center">
              <v-img
                v-if="authState.profile?.profilePicture"
                :src="`${baseURL}/${authState.profile.profilePicture}`"
                alt="Profile Picture"
                width="30"
                height="30"
                class="rounded-circle mr-2"
              ></v-img>
              <span>{{ authState.profile?.displayName || "User" }}</span>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="navigateToProfile">
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleSignOut">
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      <v-btn v-else text @click="navigateToSignIn">Sign In</v-btn>
    </v-app-bar>
  </template>
  
  <script setup>
  import { ref, computed } from "vue";
  import { useAuthState, updateAuthState, clearAuthState } from "@/store/auth";
  import { useDisplay } from "vuetify";
  import { useRouter } from "vue-router";
  import axios from "axios";
  
  const baseURL = "http://localhost:8081";
  const authState = useAuthState();
  
  const drawer = ref(false);
  function toggleDrawer() {
    drawer.value = !drawer.value;
  }
  
  const { mdAndUp } = useDisplay();
  const isMobile = computed(() => !mdAndUp.value);
  
  const router = useRouter();
  
  function navigateToProfile() {
    router.push("/profile");
  }
  
  function navigateToSignIn() {
    router.push("/signin");
  }
  
  async function handleSignOut() {
    try {
      await axios.post(`${baseURL}/logout`, {}, { withCredentials: true });
      clearAuthState();
      router.push("/signin");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  }
  
  updateAuthState();
  </script>
  
  <style scoped>
  .rounded-circle {
    border-radius: 50%;
  }
  .mr-2 {
    margin-right: 8px;
  }
  </style>
  
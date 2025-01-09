<template>
  <v-app-bar color="primary" dark app>
    <v-app-bar-nav-icon v-if="isMobile" @click="toggleDrawer" />

    <v-toolbar-title>ProTracker</v-toolbar-title>
    <v-spacer></v-spacer>

    <template v-if="!isMobile">
      <v-btn text to="/">Home</v-btn>
      <v-btn text to="/profile">Profile</v-btn>
      <v-btn text @click="handleSignInOut">
        {{ isLoggedIn ? "Sign Out" : "Sign In" }}
      </v-btn>
    </template>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" app temporary color="grey lighten-4">
    <v-list>
      <v-list-item to="/">
        <v-list-item-title>Home</v-list-item-title>
      </v-list-item>

      <v-list-item to="/profile">
        <v-list-item-title>Profile</v-list-item-title>
      </v-list-item>

      <v-list-item @click="handleSignInOut">
        <v-list-item-title>
          {{ isLoggedIn ? "Sign Out" : "Sign In" }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const drawer = ref(false);
function toggleDrawer() {
  drawer.value = !drawer.value;
}

const { mdAndUp } = useDisplay();
const isMobile = computed(() => !mdAndUp.value);

const auth = getAuth();
const user = ref(null);

onMounted(() => {
  user.value = auth.currentUser;
  onAuthStateChanged(auth, (u) => {
    user.value = u;
  });
});

const isLoggedIn = computed(() => !!user.value);

const router = useRouter();

async function handleSignInOut() {
  if (isLoggedIn.value) {
    try {
      await signOut(auth);
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  } else {
    router.push("/signin");
  }
}
</script>

<style scoped></style>

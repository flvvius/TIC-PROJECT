<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>My Profile</v-card-title>
          <v-card-text>
            <div v-if="profile">
              <p>
                Your email: <strong>{{ profile.email }}</strong>
              </p>
              <p v-if="profile.displayName">
                Your display name: <strong>{{ profile.displayName }}</strong>
              </p>
              <p v-if="profile.createdAt">
                Account created on: <strong>{{ formattedDate }}</strong>
              </p>
              <p>
                Your user ID: <strong>{{ profile.uid }}</strong>
              </p>
              <v-btn color="primary" @click="copyUid">Copy User ID</v-btn>
            </div>
            <div v-else>
              <p>No user profile available.</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { getProfile } from "@/api";

const profile = ref(null);
const error = ref(null);

onMounted(async () => {
  try {
    const response = await getProfile();
    profile.value = response.user;
    console.log("Fetched profile:", profile.value);
  } catch (err) {
    console.error("Error fetching profile:", err.message);
    error.value = err.response?.data?.error || "Failed to fetch profile.";
  }
});

const formattedDate = computed(() => {
  if (!profile.value?.createdAt) return null;
  return new Date(profile.value.createdAt).toLocaleString();
});

async function copyUid() {
  if (!profile.value?.uid) return;
  try {
    await navigator.clipboard.writeText(profile.value.uid);
    console.log("Copied User ID to clipboard!");
  } catch (error) {
    console.error("Failed to copy User ID:", error);
  }
}
</script>

<style scoped></style>

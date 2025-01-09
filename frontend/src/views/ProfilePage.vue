<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>My Profile</v-card-title>
          <v-card-text>
            <div v-if="userUid">
              <p>
                Your user ID: <strong>{{ userUid }}</strong>
              </p>
              <v-btn color="primary" @click="copyUid">Copy UID</v-btn>
            </div>
            <div v-else>
              <p>No user found.</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getAuth } from "firebase/auth";

const userUid = ref(null);

onMounted(() => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    userUid.value = user.uid;
  } else {
    console.warn("No user is logged in");
  }
});

async function copyUid() {
  if (!userUid.value) return;
  try {
    await navigator.clipboard.writeText(userUid.value);
    console.log("Copied UID to clipboard!");
  } catch (error) {
    console.error("Failed to copy UID:", error);
  }
}
</script>

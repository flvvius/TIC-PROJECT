<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Profile Picture</v-card-title>
          <v-card-text class="d-flex flex-column align-center">
            <v-img
              v-if="profile?.profilePicture"
              :src="`http://localhost:8081/${profile.profilePicture}`"
              alt="Profile Picture qqq"
              width="200"
              height="200"
              class="rounded-circle"
            />

            <div v-else>
              <v-icon color="grey" size="96">mdi-account-circle</v-icon>
              <p>No picture uploaded</p>
            </div>
            <v-file-input
              label="Upload Profile Picture"
              @change="handleProfilePictureUpload"
              accept="image/*"
              dense
              class="mt-4"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>My Profile</v-card-title>
          <v-card-text>
            <div v-if="profile">
              <p>
                Your email: <strong>{{ profile.email }}</strong>
              </p>
              <p v-if="profile.displayName">
                Your name: <strong>{{ profile.displayName }}</strong>
              </p>
              <p>
                Your user ID: <strong>{{ profile.uid }}</strong>
              </p>
              <p v-if="profile.createdAt">
                Account created on: <strong>{{ formattedDate }}</strong>
              </p>

              <v-divider class="my-4"></v-divider>

              <v-text-field
                label="Update Name"
                v-model="updatedDisplayName"
                placeholder="Enter your name"
              />
              <v-btn color="success" @click="updateDisplayName">
                Save Name
              </v-btn>
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
import {
  getProfile,
  updateProfile,
  uploadProfilePicture as uploadProfilePictureAPI,
} from "@/api";

const profile = ref(null);
const updatedDisplayName = ref("");

onMounted(async () => {
  try {
    const response = await getProfile();
    profile.value = response.user;
    updatedDisplayName.value = profile.value?.displayName || "";
    console.log("Fetched profile:", profile.value);
  } catch (err) {
    console.error("Error fetching profile:", err.message);
  }
});

const formattedDate = computed(() => {
  if (!profile.value?.createdAt) return null;
  return new Date(profile.value.createdAt).toLocaleString();
});

async function updateDisplayName() {
  try {
    await updateProfile({ displayName: updatedDisplayName.value });
    profile.value.displayName = updatedDisplayName.value;
    console.log("Display name updated successfully.");
  } catch (err) {
    console.error("Error updating display name:", err.message);
  }
}

async function handleProfilePictureUpload(event) {
  const file =
    event instanceof File ? event : event?.[0] || event?.target?.files?.[0];

  if (!file) {
    console.error("No file selected for upload.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("File size exceeds 5MB. Please choose a smaller file.");
    return;
  }

  const formData = new FormData();
  formData.append("profilePicture", file);

  try {
    const response = await uploadProfilePictureAPI(formData);
    profile.value.profilePicture = response.profilePicture;
    console.log(
      "Profile picture uploaded successfully:",
      response.profilePicture
    );
  } catch (err) {
    console.error("Error uploading profile picture:", err.message);
  }
}
</script>

<style scoped>
.rounded-circle {
  border-radius: 50%;
}
</style>

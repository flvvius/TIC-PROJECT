<template>
  <v-container class="sign-up-page" max-width="400px">
    <v-card>
      <v-card-title>Sign Up</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSignUp">
          <v-text-field
            label="Email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
          />
          <v-text-field
            label="Password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
          />
          <v-text-field
            label="Display Name"
            v-model="displayName"
            required
            autocomplete="name"
          />

          <v-btn type="submit" color="primary">Sign Up</v-btn>
        </v-form>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="message" class="success-message">{{ message }}</div>

        <v-divider class="my-4"></v-divider>
        <v-btn color="secondary" @click="goToSignIn">
          Already have an account? Sign In
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import router from "../router/index";
import { registerUser } from "@/api";

const email = ref("");
const password = ref("");
const displayName = ref("");
const error = ref(null);
const message = ref(null);

const handleSignUp = async () => {
  error.value = null;
  try {
    await registerUser(email.value, password.value, displayName.value);
    message.value = "User registered successfully!";

    email.value = "";
    password.value = "";
    displayName.value = "";

    router.push("/signin");
  } catch (err) {
    error.value = err.response?.data?.error || "An error occurred";
  }
};

function goToSignIn() {
  router.push("/signin");
}
</script>

<style scoped>
.error-message {
  color: red;
}
.success-message {
  color: green;
}
.my-4 {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
}
</style>

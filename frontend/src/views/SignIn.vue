<template>
  <v-container class="signin-page" max-width="400px">
    <v-card>
      <v-card-title>Sign In</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
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
            autocomplete="current-password"
          />
          <v-btn type="submit" color="primary">Sign In</v-btn>
        </v-form>
        <div v-if="error" class="error-message">{{ error }}</div>

        <v-divider class="my-4"></v-divider>
        <v-btn color="secondary" @click="goToSignup">
          Don’t have an account? Sign Up
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import router from "../router";
import { loginUser } from "../api";
import Cookies from "js-cookie";
import { updateAuthState } from "@/store/auth";

const email = ref("");
const password = ref("");
const error = ref(null);

const handleLogin = async () => {
  error.value = null;

  try {
    const response = await loginUser(email.value, password.value);
    console.log("Login response:", response);

    const token = Cookies.get("token");
    if (!token) {
      throw new Error("Token not set in cookies");
    }

    console.log("Token set in cookie:", token);
    updateAuthState();
    router.push("/");
  } catch (err) {
    console.error("Login error:", err.message);
    error.value = err.response?.data?.error || err.message;
  }
};
</script>


<style scoped>
.error-message {
  color: red;
}
.my-4 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>

<template>
  <v-container class="signin-page" max-width="400px">
    <v-card>
      <v-card-title>Sign In</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field label="Email" v-model="email" type="email" required />
          <v-text-field
            label="Password"
            v-model="password"
            type="password"
            required
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import router from "../router/index";

const email = ref("");
const password = ref("");
const error = ref(null);

const handleLogin = async () => {
  error.value = null;
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push("/");
  } catch (err) {
    error.value = err.message;
  }
};

function goToSignup() {
  router.push("/signup");
}
</script>

<style scoped>
.error-message {
  color: red;
}
.my-4 {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
}
</style>

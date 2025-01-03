<template>
  <v-container class="login-page" max-width="400px">
    <v-card>
      <v-card-title>Login</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field label="Email" v-model="email" type="email" required />
          <v-text-field
            label="Password"
            v-model="password"
            type="password"
            required
          />
          <v-btn type="submit" color="primary">Login</v-btn>
        </v-form>
        <div v-if="error" class="error-message">{{ error }}</div>
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
</script>

<style scoped>
.error-message {
  color: red;
}
</style>

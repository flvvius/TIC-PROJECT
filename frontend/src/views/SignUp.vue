<template>
  <v-container class="sign-up-page" max-width="400px">
    <v-card>
      <v-card-title>Sign Up</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSignUp">
          <v-text-field label="Email" v-model="email" type="email" required />
          <v-text-field
            label="Password"
            v-model="password"
            type="password"
            required
          />
          <v-btn type="submit" color="primary">Sign Up</v-btn>
        </v-form>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="message" class="success-message">{{ message }}</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const email = ref("");
const password = ref("");
const error = ref(null);
const message = ref(null);

const handleSignUp = async () => {
  error.value = null;
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    message.value = "User registered successfully!";
    email.value = "";
    password.value = "";
  } catch (err) {
    error.value = err.message;
  }
};
</script>

<style scoped>
.error-message {
  color: red;
}
.success-message {
  color: green;
}
</style>

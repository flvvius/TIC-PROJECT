import { reactive } from "vue";
import Cookies from "js-cookie";
import axios from "axios";

const baseURL = "http://localhost:8081";

const authState = reactive({
  isLoggedIn: !!Cookies.get("token"),
  profile: null,
});

export function useAuthState() {
  return authState;
}

export async function updateAuthState() {
  try {
    if (Cookies.get("token")) {
      const response = await axios.get(`${baseURL}/profile`, { withCredentials: true });
      authState.isLoggedIn = true;
      authState.profile = response.data.user;
    } else {
      authState.isLoggedIn = false;
      authState.profile = null;
    }
  } catch (error) {
    console.error("Error updating auth state:", error.message);
    authState.isLoggedIn = false;
    authState.profile = null;
  }
}

export function clearAuthState() {
  authState.isLoggedIn = false;
  authState.profile = null;
  Cookies.remove("token");
}

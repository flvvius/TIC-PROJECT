import { reactive } from "vue";
import Cookies from "js-cookie";

const authState = reactive({
  isLoggedIn: !!Cookies.get("token"),
});

export function useAuthState() {
  return authState;
}

export function updateAuthState() {
  authState.isLoggedIn = !!Cookies.get("token");
}

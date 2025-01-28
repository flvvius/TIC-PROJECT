import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { loadFonts } from "./plugins/webfontloader";
import Cookies from "js-cookie";
import { updateAuthState } from "@/store/auth";

loadFonts();

let app = null;

function checkAuth() {
  const token = Cookies.get("token");
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      updateAuthState();
      return decoded.uid;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  } else {
    console.log("No valid token found, user is not authenticated.");
    updateAuthState();
    return null;
  }
}

if (!app) {
  checkAuth();
  app = createApp(App);
  app.use(router).use(store).use(vuetify).mount("#app");
}

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { loadFonts } from "./plugins/webfontloader";

import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

loadFonts();

let app = null;

onAuthStateChanged(auth, (user) => {
  if (!app) {
    app = createApp(App);
    app.use(router).use(store).use(vuetify).mount("#app");
  }

  if (user) {
    console.log("User is logged in:", user.email);
  } else {
    console.log("No user is logged in.");
  }
});

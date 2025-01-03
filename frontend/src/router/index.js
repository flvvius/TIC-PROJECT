import { createRouter, createWebHistory } from "vue-router";
import SignUp from "../views/SignUp.vue";
import SignIn from "../views/SignIn.vue";
import Home from "../views/HomePage.vue";
import currentUser from "@/middlewares";

const routes = [
  { path: "/", component: Home, meta: { requiresAuth: true } },
  { path: "/signup", component: SignUp },
  { path: "/signin", component: SignIn },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const user = currentUser.value || null;
  if (to.meta.requiresAuth && !user) {
    next("/signin");
  } else {
    next();
  }
});

export default router;

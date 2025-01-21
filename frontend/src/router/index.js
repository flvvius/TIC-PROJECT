import { createRouter, createWebHistory } from "vue-router";
import SignUp from "../views/SignUp.vue";
import SignIn from "../views/SignIn.vue";
import Home from "../views/HomePage.vue";
import KanbanBoard from "../views/KanbanBoard.vue";
import Profile from "../views/ProfilePage.vue";
import axios from "axios";

async function getUserProfile() {
  try {
    const response = await axios.get("http://localhost:8081/profile", {
      withCredentials: true,
    });
    return response.data?.user;
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    return null;
  }
}

async function isAuthenticated() {
  const user = await getUserProfile();
  return !!user?.email;
}

const routes = [
  {
    path: "/",
    component: Home,
    name: "Home",
    meta: { requiresAuth: true },
  },
  { path: "/signup", component: SignUp },
  { path: "/signin", component: SignIn },
  {
    path: "/kanban/:boardId",
    component: KanbanBoard,
    name: "KanbanBoard",
    meta: { requiresAuth: true },
    props: true,
  },
  {
    path: "/profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      console.warn("User not authenticated. Redirecting to Sign In.");
      return next("/signin");
    }

    if (to.name === "KanbanBoard") {
      const boardId = to.params.boardId;
      if (!boardId) {
        console.warn("Invalid board ID. Redirecting to Home.");
        return next("/");
      }

      try {
        const boardResponse = await axios.get(
          `http://localhost:8081/api/boards/${boardId}`,
          { withCredentials: true }
        );
        const boardData = boardResponse.data;

        if (!boardData || !Array.isArray(boardData.members)) {
          console.warn("Invalid board data. Redirecting to Home.");
          return next("/");
        }

        const user = await getUserProfile();
        if (!user?.email) {
          console.warn("User email not found. Redirecting to Home.");
          return next("/");
        }

        const isMember = boardData.members.some(
          (member) => member.email === user.email
        );

        if (!isMember) {
          console.warn("User not a member of the board. Redirecting to Home.");
          return next("/");
        }

        return next();
      } catch (error) {
        console.error("Error verifying board membership:", error.message);
        return next("/");
      }
    }

    return next();
  }

  next();
});

export default router;

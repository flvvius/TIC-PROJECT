import { createRouter, createWebHistory } from "vue-router";
import SignUp from "../views/SignUp.vue";
import SignIn from "../views/SignIn.vue";
import Home from "../views/HomePage.vue";
import KanbanBoard from "../views/KanbanBoard.vue";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

const routes = [
  { path: "/", component: Home, name: "Home", meta: { requiresAuth: true } },
  { path: "/signup", component: SignUp },
  { path: "/signin", component: SignIn },
  {
    path: "/kanban/:boardId",
    component: KanbanBoard,
    name: "KanbanBoard",
    meta: { requiresAuth: true },
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.name === "KanbanBoard") {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return next("/signin");
    }

    const boardId = to.params.boardId;
    if (!boardId) {
      return next("/");
    }

    try {
      const boardRef = doc(db, "boards", boardId);
      const boardSnap = await getDoc(boardRef);

      if (!boardSnap.exists()) {
        return next("/");
      }

      const boardData = boardSnap.data();

      const members = boardData.members || [];
      if (!Array.isArray(members) || !members.includes(user.uid)) {
        return next("/");
      }

      return next();
    } catch (error) {
      console.error("Error checking board membership:", error);
      return next("/");
    }
  } else {
    next();
  }
});

export default router;

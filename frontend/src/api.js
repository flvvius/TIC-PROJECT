import axios from "axios";

axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: "http://localhost:8081",
  withCredentials: true,
});

export const loginUser = async (email, password) => {
  const response = await api.post("/login", { email, password });
  return response.data;
};

export const registerUser = async (email, password, displayName) => {
  const response = await api.post("/register", {
    email,
    password,
    displayName,
  });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/logout");
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/profile");
  return response.data;
};

export const getBoards = async () => {
  const response = await api.get("/api/boards");
  return response.data;
};

export const getBoard = async (boardId) => {
  const response = await api.get(`/api/boards/${boardId}`);
  return response.data;
};

export const createBoard = async (boardData) => {
  const response = await api.post("/api/boards", boardData);
  return response.data;
};

export const deleteBoard = async (boardId) => {
  const response = await api.delete(`/api/boards/${boardId}`);
  return response.data;
};

export const getColumns = async (boardId) => {
  const response = await api.get(`/api/boards/${boardId}/columns`);
  return response.data;
};

export const createOrUpdateColumn = async (boardId, colId, colData) => {
  const response = await api.post(`/api/boards/${boardId}/columns/${colId}`, colData);
  return response.data;
};

export const getTasks = async (boardId) => {
  const response = await api.get(`/api/boards/${boardId}/tasks`);
  return response.data;
};

export const createTask = async (boardId, taskData) => {
  const response = await api.post(`/api/boards/${boardId}/tasks`, taskData);
  return response.data;
};

export const updateTask = async (boardId, taskId, updates) => {
  const response = await api.patch(`/api/boards/${boardId}/tasks/${taskId}`, updates);
  return response.data;
};

export const inviteMembers = async (boardId, newMembers) => {
  const response = await api.post(`/api/boards/${boardId}/invite`, { newMembers });
  return response.data;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data?.error || error.message);
    return Promise.reject(error);
  }
);

export default api;

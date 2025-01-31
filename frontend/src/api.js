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

export const updateProfile = async (data) => {
  const response = await api.post("/api/profile/updateName", data);
  return response.data;
};

export const uploadProfilePicture = async (formData) => {
  try {
    const response = await api.post("/api/profile/uploadPicture", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data?.error || error.message);
    throw error;
  }
};

export const getBoards = async (cursor = null) => {
  const url = cursor
    ? `/api/boards/paged?limit=5&startAfter=${cursor}`
    : `/api/boards/paged?limit=5`;

  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data?.error || error.message);
    throw error;
  }
};

export const createBoard = async (boardData) => {
  const response = await api.post("/api/boards", boardData);
  return response.data;
};

export const deleteBoard = async (boardId) => {
  const response = await api.delete(`/api/boards/${boardId}`);
  return response.data;
};

export const getBoard = async (boardId) => {
  const response = await api.get(`/api/boards/${boardId}`);
  return response.data;
};

export const inviteMembers = async (boardId, emails) => {
  const response = await api.post(`/api/boards/${boardId}/invite`, { emails });
  return response.data;
};

export const removeMember = async (boardId, email) => {
  const response = await api.delete(`/api/boards/${boardId}/members/${email}`);
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

export const getTasksInColumn = async (boardId, colId) => {
  const response = await api.get(`/api/boards/${boardId}/columns/${colId}/tasks`);
  return response.data;
};

export const createTaskInColumn = async (boardId, colId, taskData) => {
  const response = await api.post(`/api/boards/${boardId}/columns/${colId}/tasks`, taskData);
  return response.data;
};

export const updateTaskInColumn = async (boardId, colId, taskId, updates) => {
  const response = await api.patch(
    `/api/boards/${boardId}/columns/${colId}/tasks/${taskId}`,
    updates
  );
  return response.data;
};

export const deleteTaskInColumn = async (boardId, colId, taskId) => {
  const response = await api.delete(`/api/boards/${boardId}/columns/${colId}/tasks/${taskId}`);
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

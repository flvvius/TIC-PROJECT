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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data?.error || error.message);
    return Promise.reject(error);
  }
);

export default api;

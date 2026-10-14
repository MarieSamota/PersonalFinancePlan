import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const fetchItems = (search, signal) =>
  api.get("/transactions", {
    params: search ? { search } : undefined,
    signal,
  });
export const addItem = (item) => api.post("/transactions", item);
export const updateItem = (id, updated) =>
  api.put(`/transactions/${id}`, updated);
export const deleteItem = (id) => api.delete(`/transactions/${id}`);

export function getErrorMessage(err) {
  if (err.response) {
    if (err.response.status >= 500) {
      return "Ошибка сервера. Попробуйте позже.";
    }
    return err.response.data?.error ?? `Ошибка ${err.response.status}`;
  }
  if (err.request) {
    return "Нет соединения с сервером";
  }
  return err.message;
}

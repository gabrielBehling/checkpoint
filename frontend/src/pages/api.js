import axios from "axios";

const api = axios.create({
  baseURL: "http://checkpoint.localhost/api/auth",
});

export default api;
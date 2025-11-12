import axios from "axios";

const api = axios.create({
  baseURL: "http://checkpoint.localhost/api",
  withCredentials: true,
});

api.interceptors.response.use(
  function onFulfilled(response) {
    return response;
  },
  async function onRejected(error) {
    const errorCode = error?.response?.data?.error;
    if (errorCode === "INVALID_TOKEN" || errorCode === "UNAUTHORIZED") {
      return await axios
        .post("http://checkpoint.localhost/api/auth/refresh-token")
        .then((res) => {
          if (res.status === 200) {
            // Retry the original request with the error config
            const originalRequest = error.config;
            return axios(originalRequest);
          }
          return Promise.reject(error);
        })
        .catch((refreshError) => {
          return Promise.reject(refreshError);
        });
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "http://checkpoint.localhost/api",
  withCredentials: true,
});

api.interceptors.response.use(
  function onFulfilled(response) {
    return response;
  },
  function onRejected(error) {

    const status = error?.response?.status;
    if (status === 403) {
      return axios.post("http://checkpoint.localhost/api/auth/refresh-token", { withCredentials: true })
        .then((res) => {
          if(res.status === 200) {
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

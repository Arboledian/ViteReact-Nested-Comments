import axios from "axios";

//la sintaxis para acceder a .env es distinta en proyectos vite
const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_SERVER_URL,
  withCredentials: true,
});

export function makeRequest(url, options) {
  return api(url, options)
    .then(res => res.data)
    .catch(error => Promise.reject(error?.response?.data?.message ?? "Error"));
}

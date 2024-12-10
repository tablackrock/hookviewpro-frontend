import axios from "axios";

const api = axios.create({
  baseURL: "http://api.hookviewpro.com:3001/", // Update to production URL if applicable
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically set Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  console.log(localStorage.getItem("authToken"));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }else{
    console.log("Not auth token")
  }
  return config;
});

export default api;

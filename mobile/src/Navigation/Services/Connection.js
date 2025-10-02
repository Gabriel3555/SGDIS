import axios from "axios";

// Configuración base de Axios
const api = axios.create({
  baseURL: "https://sgdis.onrender.com/", 
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

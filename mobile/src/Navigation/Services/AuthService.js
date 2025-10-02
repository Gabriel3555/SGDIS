import api from "./Connection";



export const login = async (email, password) => {
  try {     
    const response = await api.post("api/v1/auth/login", { email, password });
    return response.data;
  } catch (error) {
    console.error("Error en conexión:", error.response?.data || error.message);
    throw error.response?.data || { message: "Error en la conexión" + error};
  }
};
